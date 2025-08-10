import { useState, useCallback } from "react";
import { Event, EventWithStats } from "@/types/event";
import { toast } from "sonner";
import { EventService } from "@/services/EventService";

interface UseEventsReturn {
  events: EventWithStats[];
  loading: boolean;
  error: Error | null;
  createEvent: (
    event: Omit<Event, "id" | "created_at" | "updated_at">
  ) => Promise<Event>;
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
      
      console.log("useEvents: fetchEvents called with schoolId:", schoolId);
      const eventsWithStats = await EventService.getEventsWithStats(schoolId);
      console.log("useEvents: fetched events:", eventsWithStats.length, "events");
      setEvents(eventsWithStats);
    } catch (err) {
      console.error("useEvents: fetchEvents error:", err);
      setError(err as Error);
      toast("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createEvent = useCallback(
    async (eventData: Omit<Event, "id" | "created_at" | "updated_at">) => {
      try {
        // Use EventService which handles backend API
        const data = await EventService.createEvent({
          name: eventData.name,
          date: eventData.date,
          school_id: eventData.school_id,
        });

        // Add empty stats for the new event
        const eventWithStats: EventWithStats = {
          ...data,
          stats: {
            total_cards: 0,
            needs_review: 0,
            ready_for_export: 0,
            exported: 0,
            archived: 0,
          },
        };

        setEvents((prev) => [eventWithStats, ...prev]);
        return data;
      } catch (err) {
        toast("Failed to create event");
        throw err;
      }
    },
    []
  );

  const updateEvent = useCallback(
    async (id: string, eventData: Partial<Event>) => {
      try {
        // For now, only support name updates via EventService
        if (eventData.name) {
          await EventService.updateEventName(id, eventData.name);
        }

        // Update local state - note: we only get the updated name back
        setEvents((prev) =>
          prev.map((event) =>
            event.id === id ? { ...event, ...eventData } : event
          )
        );

        // Return a mock data object since EventService doesn't return the full event
        return { id, ...eventData } as Event;
      } catch (err) {
        toast("Failed to update event");
        throw err;
      }
    },
    []
  );

  const archiveEvent = useCallback(
    async (id: string, archiveCards: boolean = false) => {
      try {
        await EventService.archiveEvent(id, archiveCards);

        setEvents((prev) =>
          prev.map((event) =>
            event.id === id ? { ...event, status: "archived" } : event
          )
        );

        toast(
          archiveCards
            ? "Event and associated cards archived successfully"
            : "Event archived successfully"
        );
      } catch (err) {
        toast("Failed to archive event");
        throw err;
      }
    },
    []
  );

  const archiveEvents = useCallback(
    async (ids: string[]) => {
      try {
        await EventService.archiveEvents(ids);

        // Update local state to reflect the archived events
        setEvents((prev) =>
          prev.map((event) =>
            ids.includes(event.id) ? { ...event, status: "archived" } : event
          )
        );

        toast(`Successfully archived ${ids.length} events`);
      } catch (err) {
        console.error("Error archiving events:", err);
        toast("Failed to archive events");
        throw err;
      }
    },
    [toast]
  );

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    archiveEvent,
    archiveEvents,
    fetchEvents,
  };
}
