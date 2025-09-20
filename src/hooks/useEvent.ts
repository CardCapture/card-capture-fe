import { useState, useEffect, useCallback } from "react";
import { EventWithStats } from "@/types/event";
import { EventService } from "@/services/EventService";
import { toast } from "sonner";

interface UseEventReturn {
  event: EventWithStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useEvent(eventId?: string): UseEventReturn {
  const [event, setEvent] = useState<EventWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log("useEvent: fetching event", eventId);
      const eventData = await EventService.getEventWithStats(eventId);
      console.log("useEvent: fetched event data:", eventData);
      
      setEvent(eventData);
    } catch (err) {
      console.error("useEvent: fetch error:", err);
      setError(err as Error);
      toast("Failed to fetch event details");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  };
}