import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Calendar,
  Search,
  MoreVertical,
  FileUp,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useLoader } from "@/contexts/LoaderContext";
import { CRMEventsService } from "@/services/CRMEventsService";
import { CSVUploadModal } from "./CRMEvents/CSVUploadModal";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface CRMEvent {
  id: string;
  name: string;
  event_date: string;
  crm_event_id: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export function CRMEventsSection() {
  const [events, setEvents] = useState<CRMEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAction, setDeleteAction] = useState<{ type: 'single' | 'bulk'; id?: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CRMEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    event_date: "",
    crm_event_id: "",
  });
  const { showLoader, hideLoader } = useLoader();
  const service = new CRMEventsService();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      showLoader("Loading events...");
      const data = await service.listEvents();
      setEvents(data || []);
    } catch (error: any) {
      console.error("Error loading events:", error);
      
      // Show a more helpful error message
      const errorMessage = error?.message || "Failed to load events";
      if (errorMessage.includes("endpoint not found")) {
        toast.error("Backend API not available. Please check if the server is running.");
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        toast.error("Authentication required. Please log in.");
      } else {
        toast.error("Failed to load events. Starting with empty list.");
      }
      
      // Set empty array so the UI still works
      setEvents([]);
    } finally {
      hideLoader();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(filteredEvents.map((e) => e.id)));
    } else {
      setSelectedEvents(new Set());
    }
  };

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents);
    if (checked) {
      newSelected.add(eventId);
    } else {
      newSelected.delete(eventId);
    }
    setSelectedEvents(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedEvents.size === 0) {
      toast.error("No events selected");
      return;
    }

    setDeleteAction({ type: 'bulk' });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteAction) return;

    try {
      showLoader("Deleting events...");
      
      if (deleteAction.type === 'bulk') {
        await service.bulkDeleteEvents(Array.from(selectedEvents));
        toast.success(`Deleted ${selectedEvents.size} events`);
        setSelectedEvents(new Set());
      } else if (deleteAction.id) {
        await service.deleteEvent(deleteAction.id);
        toast.success("Event deleted");
      }
      
      await loadEvents();
    } catch (error) {
      console.error("Error deleting events:", error);
      toast.error("Failed to delete events");
    } finally {
      hideLoader();
      setShowDeleteModal(false);
      setDeleteAction(null);
    }
  };

  const handleAddEvent = async () => {
    try {
      showLoader("Adding event...");
      if (editingEvent) {
        await service.updateEvent(editingEvent.id, newEvent);
        toast.success("Event updated");
      } else {
        await service.createEvent(newEvent);
        toast.success("Event added");
      }
      setShowAddModal(false);
      setEditingEvent(null);
      setNewEvent({ name: "", event_date: "", crm_event_id: "" });
      await loadEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast.error("Failed to save event");
    } finally {
      hideLoader();
    }
  };

  const handleEdit = (event: CRMEvent) => {
    setEditingEvent(event);
    setNewEvent({
      name: event.name,
      event_date: event.event_date,
      crm_event_id: event.crm_event_id,
    });
    setShowAddModal(true);
  };

  const handleDelete = (eventId: string) => {
    setDeleteAction({ type: 'single', id: eventId });
    setShowDeleteModal(true);
  };


  const handleUploadComplete = async (result: any) => {
    setShowUploadModal(false);
    await loadEvents();
    
    // Use the detailed message from backend, or fallback to the old format
    const message = result.message || 
      `Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`;
    
    toast.success(message);
  };

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.crm_event_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>
                Import and manage events from your CRM for easy mapping when creating events in CardCapture.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadModal(true)}
              >
                <FileUp className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEditingEvent(null);
                  setNewEvent({ name: "", event_date: "", crm_event_id: "" });
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and bulk actions */}
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedEvents.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedEvents.size})
              </Button>
            )}
          </div>

          {/* Events table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredEvents.length > 0 &&
                        selectedEvents.size === filteredEvents.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No events found. Add events manually or import from CSV.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEvents.has(event.id)}
                          onCheckedChange={(checked) =>
                            handleSelectEvent(event.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {event.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(event.event_date), "MMM d, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.crm_event_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.source === "csv" ? "secondary" : "outline"}>
                          {event.source}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(event)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(event.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Event Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Edit Event" : "Add Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={newEvent.name}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, name: e.target.value })
                }
                placeholder="Fall College Fair 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEvent.event_date}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, event_date: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crm_id">Event ID</Label>
              <Input
                id="crm_id"
                value={newEvent.crm_event_id}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, crm_event_id: e.target.value })
                }
                placeholder="Enter event ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddEvent}
              disabled={
                !newEvent.name || !newEvent.event_date || !newEvent.crm_event_id
              }
            >
              {editingEvent ? "Save Changes" : "Add Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <CSVUploadModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onComplete={handleUploadComplete}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event{deleteAction?.type === 'bulk' ? 's' : ''}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            {deleteAction?.type === 'bulk' 
              ? `Are you sure you want to delete ${selectedEvents.size} events? This action cannot be undone.`
              : 'Are you sure you want to delete this event? This action cannot be undone.'
            }
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}