import { authFetch } from "@/lib/authFetch";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface CRMEvent {
  id: string;
  school_id: string;
  name: string;
  event_date: string;
  crm_event_id: string;
  source: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface UploadResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
}

export class CRMEventsService {
  async listEvents(): Promise<CRMEvent[]> {
    const response = await authFetch(`${API_BASE_URL}/crm-events`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      
      // If it's HTML (404 page), the endpoint doesn't exist
      if (errorText.includes("<!DOCTYPE") || errorText.includes("<html")) {
        throw new Error("API endpoint not found. Please check if the backend server is running.");
      }
      
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || "Failed to fetch events");
      } catch {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.events || [];
  }

  async createEvent(event: {
    name: string;
    event_date: string;
    crm_event_id: string;
  }): Promise<CRMEvent> {
    const response = await authFetch(`${API_BASE_URL}/crm-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Failed to create event");
    }
    
    return data.event;
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CRMEvent>
  ): Promise<CRMEvent> {
    const response = await authFetch(`${API_BASE_URL}/crm-events/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Failed to update event");
    }
    
    return data.event;
  }

  async deleteEvent(eventId: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/crm-events/${eventId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to delete event");
    }
  }

  async bulkDeleteEvents(eventIds: string[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/crm-events/bulk`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventIds),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Failed to delete events");
    }
  }

  async uploadCSV(
    file: File,
    mapping: { name: string; date: string; crm_id: string }
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));
    
    // Create abort controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
    
    try {
      const response = await authFetch(`${API_BASE_URL}/crm-events/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to upload CSV");
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timed out after 2 minutes. Please check your backend logs.');
      }
      throw error;
    }
  }

  async searchEvents(query: string): Promise<CRMEvent[]> {
    const response = await authFetch(`${API_BASE_URL}/crm-events/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || "Failed to search events");
    }
    
    return data.results || [];
  }
}