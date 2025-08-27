import { eventsApi } from "@/api/supabase/events";
import { backendEventsApi } from "@/api/backend/events";
import { getEventCardStats } from "@/lib/getEventCardStats";
import type { Event, EventWithStats } from "@/types/event";

export class EventService {
  /**
   * Get events with statistics for a school
   */
  static async getEventsWithStats(
    schoolId?: string
  ): Promise<EventWithStats[]> {
    try {
      console.log("EventService: Fetching events and stats", { schoolId });

      // Fetch events and reviewed data in parallel
      const [eventsData, reviewedData] = await Promise.all([
        eventsApi.getEvents(schoolId),
        eventsApi.getReviewedData(schoolId),
      ]);

      console.log("EventService: Raw events data from Supabase:", eventsData);
      console.log("EventService: schoolId used for query:", schoolId);
      console.log("EventService: Number of events returned:", eventsData.length);

      // Process the data to include stats
      const eventsWithStats: EventWithStats[] = eventsData.map((event) => {
        const cards =
          reviewedData?.filter((card) => card.event_id === event.id) || [];

        console.log("EventService: Processing event stats", {
          eventName: event.name,
          eventId: event.id,
          school_id: event.school_id,
          cardCount: cards.length,
        });

        const stats = getEventCardStats(cards);

        return {
          ...event,
          stats,
        };
      });

      return eventsWithStats;
    } catch (error) {
      console.error("EventService: Failed to get events with stats", error);
      throw error;
    }
  }

  /**
   * Get a single event with statistics by ID
   */
  static async getEventWithStats(eventId: string): Promise<EventWithStats | null> {
    try {
      console.log("EventService: Fetching single event with stats", { eventId });

      // Fetch event and reviewed data for this specific event
      const [eventData, reviewedData] = await Promise.all([
        eventsApi.getEventById(eventId),
        eventsApi.getReviewedDataForEvent(eventId),
      ]);

      if (!eventData) {
        return null;
      }

      console.log("EventService: Single event data:", eventData);
      console.log("EventService: Cards for event:", reviewedData?.length || 0);

      const stats = getEventCardStats(reviewedData || []);

      return {
        ...eventData,
        stats,
      };
    } catch (error) {
      console.error("EventService: Failed to get event with stats", error);
      throw error;
    }
  }

  /**
   * Create a new event
   */
  static async createEvent(eventData: {
    name: string;
    date: string;
    school_id: string;
    slate_event_id?: string | null;
  }): Promise<Event> {
    try {
      console.log("EventService DEBUG - Received data:", eventData);
      // Use backend API for event creation as it handles additional logic
      const result = await backendEventsApi.createEvent(eventData);
      console.log("EventService DEBUG - Backend response:", result);
      return result;
    } catch (error) {
      console.error("EventService: Failed to create event", error);
      throw error;
    }
  }

  /**
   * Update an event (name only for now)
   */
  static async updateEventName(eventId: string, name: string): Promise<void> {
    try {
      await backendEventsApi.updateEvent(eventId, { name });
    } catch (error) {
      console.error("EventService: Failed to update event name", error);
      throw error;
    }
  }

  /**
   * Archive a single event with optional card archiving
   */
  static async archiveEvent(
    eventId: string,
    archiveCards: boolean = false
  ): Promise<void> {
    try {
      // Archive the event first
      await eventsApi.archiveEvent(eventId);

      // If requested, archive all associated cards
      if (archiveCards) {
        await eventsApi.archiveEventCards(eventId);
      }
    } catch (error) {
      console.error("EventService: Failed to archive event", error);
      throw error;
    }
  }

  /**
   * Archive multiple events
   */
  static async archiveEvents(eventIds: string[]): Promise<void> {
    try {
      await backendEventsApi.archiveEvents(eventIds);
    } catch (error) {
      console.error("EventService: Failed to archive events", error);
      throw error;
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    try {
      await backendEventsApi.deleteEvent(eventId);
    } catch (error) {
      console.error("EventService: Failed to delete event", error);
      throw error;
    }
  }

  /**
   * Transform event for UI display
   */
  static transformEventForUI(event: Event) {
    return {
      ...event,
      dateFormatted: new Date(event.date).toLocaleDateString(),
      createdAtFormatted: new Date(event.created_at).toLocaleDateString(),
      isArchived: event.status === "archived",
    };
  }

  /**
   * Validate event data before creation/update
   */
  static validateEventData(eventData: {
    name: string;
    date: string;
    school_id?: string;
  }) {
    const errors: string[] = [];

    if (!eventData.name || eventData.name.trim().length === 0) {
      errors.push("Event name is required");
    }

    if (!eventData.date) {
      errors.push("Event date is required");
    } else {
      const eventDate = new Date(eventData.date);
      if (isNaN(eventDate.getTime())) {
        errors.push("Invalid event date");
      }
    }

    if (eventData.school_id && eventData.school_id.trim().length === 0) {
      errors.push("School ID cannot be empty");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
