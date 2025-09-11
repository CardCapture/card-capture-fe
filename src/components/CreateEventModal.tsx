import React, { useState, memo, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { Loader2, Calendar } from "lucide-react";
import { CRMEventsService } from "@/services/CRMEventsService";
import { format } from "date-fns";
import { formatDateOnlyWithFormat } from "@/utils/dateUtils";
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
  const [crmEvents, setCrmEvents] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const blockDropdownRef = useRef(false);
  const service = new CRMEventsService();
  const { user, session } = useAuth();

  // Use shared profile hook instead of duplicate fetching
  const { schoolId, loading: profileLoading } = useProfile();

  // Search CRM events when user types in event name
  useEffect(() => {
    if (eventName.length < 2) {
      setCrmEvents([]);
      setShowSuggestions(false);
      return;
    }

    // Don't search if we just selected an event
    if (blockDropdownRef.current) {
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsSearching(true);
      try {
        const events = await service.searchEvents(eventName);
        setCrmEvents(events || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error searching CRM events:", error);
        setCrmEvents([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [eventName]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameInputRef.current && !nameInputRef.current.parentElement?.contains(event.target as Node)) {
        setTimeout(() => setShowSuggestions(false), 150); // Small delay to allow selection
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  // Memoize form handlers
  const handleEventNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      blockDropdownRef.current = false; // Allow search when user types
      setEventName(value);
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

  const handleCRMEventSelect = useCallback(
    (crmEvent: any) => {
      // Block dropdown from reopening when setting eventName
      blockDropdownRef.current = true;
      
      // Hide dropdown immediately
      setShowSuggestions(false);
      setCrmEvents([]);
      
      // Set form values
      setEventName(crmEvent.name);
      setEventDate(crmEvent.event_date);
      setSlateEventId(crmEvent.crm_event_id);
      
      // Remove focus from the input
      if (nameInputRef.current) {
        nameInputRef.current.blur();
      }
    },
    []
  );

  const resetForm = useCallback(() => {
    setEventName("");
    setEventDate("");
    setSlateEventId("");
    setCrmEvents([]);
    setShowSuggestions(false);
    setIsSearching(false);
    blockDropdownRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

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
        console.log("CREATE EVENT DEBUG - schoolId from useProfile:", schoolId);
        console.log("CREATE EVENT DEBUG - user from useAuth:", user?.id);
        console.log("CREATE EVENT DEBUG - slateEventId state:", slateEventId);
        console.log("CREATE EVENT DEBUG - slateEventId.trim():", slateEventId.trim());
        console.log("CREATE EVENT DEBUG - slateEventId.trim() || null:", slateEventId.trim() || null);
        
        const createdEvent = await EventService.createEvent(eventData);
        console.log("CREATE EVENT DEBUG - Created event response:", createdEvent);

        // DEBUG: Check if newly created event appears in Supabase query
        try {
          const { supabase } = await import('@/lib/supabaseClient');
          console.log("DEBUG: Querying events table directly after creation");
          
          const { data: directQuery, error } = await supabase
            .from('events')
            .select('id, name, school_id')
            .eq('school_id', schoolId)
            .order('created_at', { ascending: false })
            .limit(10);
            
          console.log("DEBUG: Direct Supabase query result:", {
            data: directQuery,
            error: error,
            newEventId: createdEvent.id,
            schoolIdUsed: schoolId
          });
          
          // Check if the new event is in the results
          const newEventFound = directQuery?.find(event => event.id === createdEvent.id);
          console.log("DEBUG: New event found in direct query?", newEventFound);
          
          // Also try calling the debug endpoint with proper auth
          try {
            const debugResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/debug/auth-user`, {
              headers: {
                'Authorization': `Bearer ${session?.access_token}`,
              },
            });
            const debugData = await debugResponse.json();
            console.log("DEBUG auth.users check:", debugData);
          } catch (debugError) {
            console.log("DEBUG endpoint failed:", debugError);
          }
          
        } catch (debugError) {
          console.log("DEBUG: Supabase direct query failed:", debugError);
        }

        toast.created("Event");
        onEventCreated();
        resetForm();
        onClose();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <Label htmlFor="name">Event Name</Label>
              <div className="relative">
                <Input
                  ref={nameInputRef}
                  id="name"
                  placeholder="Enter event name (start typing to search CRM events)"
                  value={eventName}
                  onChange={handleEventNameChange}
                  onFocus={() => {
                    // Show existing suggestions if we have search results
                    if (!blockDropdownRef.current && eventName.length >= 2 && crmEvents.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  disabled={isCreating}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* CRM Event Suggestions Dropdown */}
              {showSuggestions && crmEvents.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {crmEvents.map((event, index) => (
                    <div
                      key={event.id}
                      className="px-3 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCRMEventSelect(event);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate text-gray-900">
                            {event.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDateOnlyWithFormat(event.event_date, "MMM d, yyyy")}
                            </div>
                            <div className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                              {event.crm_event_id.length > 12 
                                ? `${event.crm_event_id.substring(0, 12)}...`
                                : event.crm_event_id
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <Label htmlFor="slate-event-id">Event ID (Optional)</Label>
              <Input
                id="slate-event-id"
                placeholder="Enter Event ID"
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
              onClick={handleClose}
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
