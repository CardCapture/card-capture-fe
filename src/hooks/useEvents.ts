import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Event, EventWithStats } from '@/types/event';
import { toast } from 'sonner';
import { getEventCardStats } from '@/lib/getEventCardStats';
import { authFetch } from "@/lib/authFetch";

interface UseEventsReturn {
    events: EventWithStats[];
    loading: boolean;
    error: Error | null;
    createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<Event>;
    updateEvent: (id: string, event: Partial<Event>) => Promise<Event>;
    archiveEvent: (id: string, archiveCards?: boolean) => Promise<void>;
    archiveEvents: (ids: string[]) => Promise<void>;
    fetchEvents: () => Promise<void>;
}

export function useEvents(schoolId?: string): UseEventsReturn {
    const [events, setEvents] = useState<EventWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            
            // Fetch events filtered by school_id if provided
            let query = supabase
                .from('events')
                .select('*, school_id')
                .order('date', { ascending: false });
            if (schoolId) {
                query = query.eq('school_id', schoolId);
            }
            const { data: eventsData, error: eventsError } = await query;

            if (eventsError) throw eventsError;

            // Then fetch associated reviewed_data in a separate query, excluding deleted cards
            let reviewedQuery = supabase
                .from('reviewed_data')
                .select('*')
                .neq('review_status', 'deleted');
            if (schoolId) {
                reviewedQuery = reviewedQuery.eq('school_id', schoolId);
            }
            const { data: reviewedData, error: reviewedError } = await reviewedQuery;

            if (reviewedError) {
                console.error('Error fetching reviewed_data:', reviewedError);
                throw new Error(`Failed to fetch reviewed data: ${reviewedError.message}`);
            }

            // Process the data to include stats
            const eventsWithStats: EventWithStats[] = eventsData.map(event => {
                // Filter out cards with null event_id in JavaScript
                const cards = reviewedData?.filter(card => card.event_id === event.id) || [];
                
                console.log('🎯 Processing event:', {
                    eventName: event.name,
                    eventId: event.id,
                    status: event.status,
                    cardCount: cards.length,
                    cards: cards.map(c => ({
                        id: c.id,
                        status: c.status,
                        exported_at: c.exported_at,
                        event_id: c.event_id
                    }))
                });
                
                const stats = getEventCardStats(cards);

                return {
                    ...event,
                    stats
                };
            });

            setEvents(eventsWithStats);
        } catch (err) {
            setError(err as Error);
            toast("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    }, [schoolId]);

    const createEvent = useCallback(async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const { data, error } = await supabase
                .from('events')
                .insert(eventData)
                .select()
                .single();

            if (error) throw error;

            // Add empty stats for the new event
            const eventWithStats: EventWithStats = {
                ...data,
                stats: {
                    total_cards: 0,
                    needs_review: 0,
                    ready_for_export: 0,
                    exported: 0,
                    archived: 0
                }
            };

            setEvents(prev => [eventWithStats, ...prev]);
            return data;
        } catch (err) {
            toast("Failed to create event");
            throw err;
        }
    }, []);

    const updateEvent = useCallback(async (id: string, eventData: Partial<Event>) => {
        try {
            const { data, error } = await supabase
                .from('events')
                .update(eventData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setEvents(prev => prev.map(event => 
                event.id === id 
                    ? { ...event, ...data }
                    : event
            ));

            return data;
        } catch (err) {
            toast("Failed to update event");
            throw err;
        }
    }, []);

    const archiveEvent = useCallback(async (id: string, archiveCards: boolean = false) => {
        try {
            // Start a transaction to update both the event and its cards
            const { error: eventError } = await supabase
                .from('events')
                .update({ status: 'archived' })
                .eq('id', id);

            if (eventError) throw eventError;

            // If archiveCards is true, archive all associated cards
            if (archiveCards) {
                const { error: cardsError } = await supabase
                    .from('reviewed_data')
                    .update({ status: 'archived' })
                    .eq('event_id', id)
                    .neq('status', 'archived'); // Only update non-archived cards

                if (cardsError) throw cardsError;
            }

            setEvents(prev => prev.map(event => 
                event.id === id 
                    ? { ...event, status: 'archived' }
                    : event
            ));

            toast(archiveCards 
                ? "Event and associated cards archived successfully"
                : "Event archived successfully"
            );
        } catch (err) {
            toast("Failed to archive event");
            throw err;
        }
    }, []);

    const archiveEvents = useCallback(async (ids: string[]) => {
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await authFetch(`${apiBaseUrl}/archive-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ event_ids: ids }),
            });

            if (!response.ok) {
                throw new Error('Failed to archive events');
            }

            // Update local state to reflect the archived events
            setEvents(prev => prev.map(event => 
                ids.includes(event.id) 
                    ? { ...event, status: 'archived' }
                    : event
            ));

            toast(`Successfully archived ${ids.length} events`);
        } catch (err) {
            toast("Failed to archive events");
            throw err;
        }
    }, [toast]);

    return {
        events,
        loading,
        error,
        createEvent,
        updateEvent,
        archiveEvent,
        archiveEvents,
        fetchEvents
    };
} 