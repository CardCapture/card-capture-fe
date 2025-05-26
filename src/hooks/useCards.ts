// src/hooks/useCards.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Import the initialized client
import type { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from '@/lib/toast'; // Use new toast system
import type { ProspectCard, CardStatus } from '@/types/card'; // Ensure path is correct
import { useAuth } from "@/contexts/AuthContext";
import { authFetch } from "@/lib/authFetch";

// Update the interface to use the new type
interface UseCardsReturn {
    cards: ProspectCard[];
    fetchCards: () => Promise<void>; // Expose fetchCards
    getStatusCount: (tabValue: CardStatus) => number;
    isLoading: boolean; // Add a loading state
    setReviewModalState: (isOpen: boolean) => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function useCards(): UseCardsReturn {
    const [cards, setCards] = useState<ProspectCard[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { session } = useAuth();
    
    // Add a ref to track if we're in the review modal
    const isInReviewModalRef = useRef<boolean>(false);
    
    // Add refs for debouncing updates
    const lastUpdateRef = useRef<number>(Date.now());
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdateRef = useRef<boolean>(false);

    // Export a function to set the review modal state
    const setReviewModalState = useCallback((isOpen: boolean) => {
        console.log(`Setting review modal state to: ${isOpen}`);
        isInReviewModalRef.current = isOpen;
    }, []);

    const fetchCards = useCallback(async () => {
        console.log("Fetching cards via useCards hook...");
        setIsLoading(true);
        
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
            const response = await authFetch(`${apiBaseUrl}/cards`);
            if (!response.ok) {
                throw new Error(`Failed to fetch cards (${response.status})`);
            }
            const data = await response.json();
            const formattedCards: ProspectCard[] = Array.isArray(data)
                ? data.map((item: any): ProspectCard => ({
                    id: item.document_id || item.id || `unknown-${Math.random().toString(36).substring(7)}`,
                    document_id: item.document_id || item.id || `unknown-${Math.random().toString(36).substring(7)}`,
                    review_status: item.review_status || 'processing',
                    created_at: item.uploaded_at || item.created_at || new Date().toISOString(),
                    updated_at: item.updated_at || new Date().toISOString(),
                    school_id: item.school_id || '',
                    exported_at: item.exported_at || null,
                    image_path: item.image_path || undefined,
                    fields: item.fields || {},
                    event_id: item.event_id,
                }))
                : [];

            setCards(formattedCards);
        } catch (error) {
            console.error('Error fetching cards:', error);
            toast.error(error instanceof Error ? error.message : "An unknown error occurred.", "Error Fetching Cards");
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    // Effect for initial fetch
    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    // Effect for Supabase real-time subscription
    useEffect(() => {
        if (!supabase) {
            console.warn("Supabase client not available, real-time updates disabled.");
            return;
        }

        const channelName = 'reviewed_data_changes';
        let channel: RealtimeChannel | null = null;

        const handleDbChange = (payload: any) => {
            console.log('Supabase change received:', payload);
            
            // Update the specific card in the local state
            if (payload.eventType === 'UPDATE') {
                setCards(prevCards => prevCards.map(card => 
                    card.id === payload.new.document_id 
                        ? {
                            ...card,
                            ...payload.new,
                            fields: payload.new.fields || card.fields,
                            review_status: payload.new.review_status || card.review_status
                        }
                        : card
                ));
            } else if (payload.eventType === 'INSERT') {
                // For new cards, fetch all cards to ensure proper ordering
                fetchCards();
            } else if (payload.eventType === 'DELETE') {
                setCards(prevCards => prevCards.filter(card => 
                    card.id !== payload.old.document_id
                ));
            }
        };

        const subscriptionOptions = {
            event: '*' as const,
            schema: 'public',
            table: 'reviewed_data',
        };

        // Subscribe
        channel = supabase
            .channel(channelName)
            .on('postgres_changes', subscriptionOptions, handleDbChange)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Supabase channel '${channelName}' subscribed successfully!`);
                } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`Supabase channel error: ${status}`, err);
                    // Attempt to reconnect
                    setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        channel?.unsubscribe();
                        channel?.subscribe();
                    }, 5000);
                }
                console.log(`Supabase channel status: ${status}`);
            });

        // Cleanup function
        return () => {
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (supabase && channel) {
                console.log(`Unsubscribing from Supabase channel '${channelName}'`);
                supabase.removeChannel(channel)
                    .then(status => console.log(`Unsubscribe status: ${status}`))
                    .catch(err => console.error("Error unsubscribing from Supabase channel:", err));
            }
        };
    }, [fetchCards]);

    const getStatusCount = useCallback((status: CardStatus) => {
        if (!Array.isArray(cards)) return 0;
        return cards.filter(card => card.review_status === status).length;
    }, [cards]);

    return {
        cards,
        fetchCards,
        getStatusCount,
        isLoading,
        setReviewModalState,
    };
}