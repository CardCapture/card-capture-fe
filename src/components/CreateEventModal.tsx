import React, { useState, memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { EventService } from "@/services/EventService";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [slateEventId, setSlateEventId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  // Use shared profile hook instead of duplicate fetching
  const { schoolId, loading: profileLoading } = useProfile();

  // Memoize form handlers
  const handleEventNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEventName(e.target.value);
    },
    []
  );

  const handleEventDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEventDate(e.target.value);
    },
    []
  );

  const handleSlateEventIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      console.log("Slate Event ID input changed:", e.target.value);
      setSlateEventId(e.target.value);
      console.log("Slate Event ID state will be set to:", e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!eventName || !eventDate) {
        toast.warning(
          "Please provide both an event name and date.",
          "Missing Information"
        );
        return;
      }
      if (!schoolId) {
        toast.error(
          "Your user profile is missing a school ID. Please contact support.",
          "Missing School ID"
        );
        return;
      }
      setIsCreating(true);
      try {
        const eventData = {
          name: eventName,
          date: eventDate,
          school_id: schoolId,
          slate_event_id: slateEventId.trim() || null,
        };
        
        console.log("CREATE EVENT DEBUG - Frontend sending data:", eventData);
        console.log("CREATE EVENT DEBUG - slateEventId state:", slateEventId);
        console.log("CREATE EVENT DEBUG - slateEventId.trim():", slateEventId.trim());
        console.log("CREATE EVENT DEBUG - slateEventId.trim() || null:", slateEventId.trim() || null);
        
        await EventService.createEvent(eventData);

        toast.created("Event");
        onEventCreated();
        onClose();
        setEventName("");
        setEventDate("");
        setSlateEventId("");
      } catch (error) {
        console.error("Error creating event:", error);
        toast.error(
          "Something went wrong while creating the event. Please try again.",
          "Creation Failed"
        );
      } finally {
        setIsCreating(false);
      }
    },
    [eventName, eventDate, slateEventId, schoolId, onEventCreated, onClose]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                placeholder="Enter event name"
                value={eventName}
                onChange={handleEventNameChange}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Event Date</Label>
              <Input
                id="date"
                type="date"
                value={eventDate}
                onChange={handleEventDateChange}
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slate-event-id">Slate Event ID (Optional)</Label>
              <Input
                id="slate-event-id"
                placeholder="Enter Slate Event ID"
                value={slateEventId}
                onChange={handleSlateEventIdChange}
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !eventName || !eventDate}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default memo(CreateEventModal);
export { CreateEventModal };

const ArchiveConfirmation: React.FC<{
  rowSelection: Record<string, boolean>;
  handleArchiveSelected: () => void;
}> = ({ rowSelection, handleArchiveSelected }) => {
  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive Cards</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to archive {Object.keys(rowSelection).length}{" "}
            {Object.keys(rowSelection).length === 1 ? "card" : "cards"}?
            Archived cards will be moved to the Archived tab.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchiveSelected}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Archive
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ArchiveConfirmation };
