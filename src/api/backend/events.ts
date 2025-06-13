import { authFetch } from "@/lib/authFetch";
import type { Event } from "@/types/event";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const backendEventsApi = {
  /**
   * Create a new event
   */
  async createEvent(eventData: {
    name: string;
    date: string;
    school_id: string;
    slate_event_id?: string | null;
  }): Promise<Event> {
    console.log("Backend API DEBUG - Sending to backend:", eventData);
    
    const response = await authFetch(`${API_BASE_URL}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    console.log("Backend API DEBUG - Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend API DEBUG - Error response:", errorText);
      throw new Error(`Failed to create event (${response.status})`);
    }

    const result = await response.json();
    console.log("Backend API DEBUG - Success response:", result);
    return result;
  },

  /**
   * Update an event
   */
  async updateEvent(
    eventId: string,
    updates: { name?: string }
  ): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to update event");
    }
  },

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/events/${eventId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete event (${response.status})`);
    }
  },

  /**
   * Archive multiple events
   */
  async archiveEvents(eventIds: string[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/archive-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_ids: eventIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to archive events (${response.status})`);
    }
  },
};
