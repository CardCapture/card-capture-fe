import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface SelectedEvent {
  id: string;
  name: string;
}

interface ToastArgs {
  title: string;
  description: string;
  variant?: string;
}

export function useEventName(
  selectedEvent: SelectedEvent | null,
  fetchEvents: () => void,
  toast: (args: ToastArgs) => void
) {
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [eventNameInput, setEventNameInput] = useState(
    selectedEvent?.name || ""
  );
  const [eventNameLoading, setEventNameLoading] = useState(false);
  const [eventNameError, setEventNameError] = useState<string | null>(null);

  const handleEditEventName = () => {
    setIsEditingEventName(true);
    setEventNameInput(selectedEvent?.name || "");
    setEventNameError(null);
  };

  const handleCancelEditEventName = () => {
    setIsEditingEventName(false);
    setEventNameInput(selectedEvent?.name || "");
    setEventNameError(null);
  };

  const handleSaveEventName = async () => {
    if (!selectedEvent || !eventNameInput.trim()) return;
    setEventNameLoading(true);
    setEventNameError(null);
    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const response = await fetch(`${apiBaseUrl}/events/${selectedEvent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: eventNameInput.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update event name");
      }
      toast({
        title: "Event name updated",
        description: "The event name was updated successfully.",
      });
      setIsEditingEventName(false);
      fetchEvents();
    } catch (error: unknown) {
      let message = "Failed to update event name";
      if (error instanceof Error) message = error.message;
      setEventNameError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setEventNameLoading(false);
    }
  };

  return {
    isEditingEventName,
    eventNameInput,
    setEventNameInput,
    eventNameLoading,
    eventNameError,
    handleEditEventName,
    handleCancelEditEventName,
    handleSaveEventName,
  };
}
