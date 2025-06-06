import { useState } from "react";
import { EventService } from "@/services/EventService";
import { toast } from "@/lib/toast";

interface SelectedEvent {
  id: string;
  name: string;
}

export function useEventName(
  selectedEvent: SelectedEvent | null,
  fetchEvents: () => void
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
      await EventService.updateEventName(
        selectedEvent.id,
        eventNameInput.trim()
      );
      toast.updated("Event name");
      setIsEditingEventName(false);
      fetchEvents();
    } catch (error: unknown) {
      let message = "Failed to update event name";
      if (error instanceof Error) message = error.message;
      setEventNameError(message);
      toast.error(message, "Error");
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
