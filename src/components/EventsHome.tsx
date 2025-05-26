// src/components/DashboardCopy.tsx

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  SortingState,
} from '@tanstack/react-table';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEvents } from '@/hooks/useEvents';
import type { Event, EventWithStats } from '@/types/event';
import { CreateEventModal } from './CreateEventModal';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, CalendarDays, CheckCircle2, Archive, Check, FileOutput, ArchiveIcon, Download, Trash2, X, Loader2, Camera, Upload, Plus, UserPlus, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/lib/toast';

// Tab type for event filtering
type EventTab = 'upcoming' | 'completed' | 'archived';

const DashboardCopy = () => {
  // External Hooks
  const router = useNavigate();
  const { events, loading: eventsLoading, fetchEvents, archiveEvents } = useEvents();
  
  // State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date', desc: true } // Default sort by date descending
  ]);
  const [hideExported, setHideExported] = useState(false);
  const [selectedTab, setSelectedTab] = useState<EventTab>('upcoming');
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState({
    name: '',
    email: '',
    cell: '',
    date_of_birth: ''
  });
  const [selectedEventForEntry, setSelectedEventForEntry] = useState<string>('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Refs
  const eventsRef = useRef<{ fetchEvents: () => Promise<void> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug effect to log events and their stats
  useEffect(() => {
    console.log('📈 DashboardCopy Events:', events?.map(event => ({
      name: event.name,
      id: event.id,
      stats: event.stats
    })));
  }, [events]);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handler for capturing a card
  const handleCaptureCard = () => {
    // Implementation would go here - this would open the camera modal
    toast.info("Camera capture functionality would be triggered here", "Capture Card");
  };

  // Handler for importing a file
  const handleImportFile = () => {
    // Trigger file input click
    fileInputRef.current?.click();
  };

  // Handler for file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Here you would call the startUploadProcess function from ScanFab
      toast.success(`Selected file: ${file.name}`, "File Selected");
    }
    if (event.target) event.target.value = '';
  };

  // Determine which status to highlight based on priority
  const determineHighlightStatus = (event: EventWithStats) => {
    if (event.stats.needs_review > 0) return 'needs_review';
    if (event.stats.ready_for_export > 0) return 'ready';
    if (event.stats.exported > 0 && event.stats.exported === event.stats.total_cards) return 'exported';
    if (event.stats.archived > 0 && event.stats.archived === event.stats.total_cards) return 'archived';
    return null;
  };

  // Handle viewing an event's details
  const handleViewEvent = useCallback((event: EventWithStats) => {
    // Don't navigate if there are selected rows (we're in selection mode)
    if (Object.keys(rowSelection).length > 0) {
      return;
    }
    router(`/events/${event.id}`);
  }, [router, rowSelection]);

  // Split and filter events based on tab selection
  const { upcomingEvents, completedEvents, archivedEvents, filteredEvents } = useMemo(() => {
    if (!events) return { upcomingEvents: [], completedEvents: [], archivedEvents: [], filteredEvents: [] };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    // Filter events based on search query and hideExported
    const filtered = events.filter(event => {
      // Apply search filter
      if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Apply hideExported filter if enabled
      if (hideExported && event.stats.exported > 0 && event.stats.exported === event.stats.total_cards) {
        return false;
      }
      
      return true;
    });
    
    // Split events into categories
    const upcoming = filtered.filter(event => 
      new Date(event.date) >= today && event.status !== 'archived'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const completed = filtered.filter(event => 
      new Date(event.date) < today && event.status !== 'archived'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const archived = filtered.filter(event => 
      event.status === 'archived'
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Return events based on selected tab
    return { 
      upcomingEvents: upcoming, 
      completedEvents: completed,
      archivedEvents: archived,
      filteredEvents: selectedTab === 'upcoming' 
        ? upcoming 
        : selectedTab === 'completed'
          ? completed
          : archived // 'archived' tab
    };
  }, [events, searchQuery, hideExported, selectedTab]);

  // Update the archived events count in the tabs
  const archivedEventsCount = archivedEvents.length;

  // Handle actions for selected events
  const handleExportSelected = () => {
    setIsExporting(true);
    // Simulating API call
    setTimeout(() => {
      toast.success(`${Object.keys(rowSelection).length} events queued for export.`, "Export initiated");
      setRowSelection({});
      setIsExporting(false);
    }, 1000);
  };

  const handleArchiveSelected = async () => {
    console.log('Archive triggered with selected events:', selectedEvents); // Debug
    if (selectedEvents.length === 0) {
      toast.required("event selection");
      return;
    }

    try {
      await archiveEvents(selectedEvents);
      // Clear selection after successful archive
      setRowSelection({});
      setSelectedEvents([]);
      // Refresh the events list
      await fetchEvents();
    } catch (error) {
      console.error("Failed to archive events:", error);
      toast.error("Failed to archive selected events", "Archive failed");
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setRowSelection({});
    setSelectedEvents([]);
  };

  // Add handler for manual entry
  const handleManualEntry = () => {
    if (events.length === 0) {
      toast.warning("Please create an event first before adding contacts", "No Events");
      return;
    }
    
    // If there's only one event, pre-select it
    if (events.length === 1) {
      setSelectedEventForEntry(events[0].id);
    }
    
    setIsManualEntryModalOpen(true);
  };

  // Add handler for manual entry form changes
  const handleManualEntryChange = (field: string, value: string) => {
    setManualEntryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add handler for submitting the manual entry form
  const handleManualEntrySubmit = async () => {
    if (!manualEntryForm.name) {
      toast.required("name for the contact");
      return;
    }

    if (!selectedEventForEntry) {
      toast.required("event selection for this contact");
      return;
    }

    try {
      // Create manual card entry
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/cards/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: selectedEventForEntry,
          fields: {
            name: { value: manualEntryForm.name, confidence: 1.0 },
            email: { value: manualEntryForm.email, confidence: 1.0 },
            cell: { value: manualEntryForm.cell, confidence: 1.0 },
            date_of_birth: { value: manualEntryForm.date_of_birth, confidence: 1.0 }
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create manual entry");
      }

      toast.success("Contact added successfully");

      // Reset form and close modal
      setManualEntryForm({
        name: '',
        email: '',
        cell: '',
        date_of_birth: ''
      });
      setSelectedEventForEntry('');
      setIsManualEntryModalOpen(false);
      
      // Refresh events to update counts
      fetchEvents();
    } catch (error: any) {
      console.error("Manual entry failed:", error);
      toast.error(error.message || "Failed to create manual entry", "Error");
    }
  };

  // Delete event(s) handler
  const handleDeleteEvents = useCallback(async () => {
    setDeleteLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const selectedIds = Object.keys(rowSelection).map(index => filteredEvents[parseInt(index)].id);
      for (const eventId of selectedIds) {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        const response = await fetch(`${apiBaseUrl}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!response.ok && response.status !== 204) {
          throw new Error('Failed to delete event');
        }
      }
      setRowSelection({});
      await fetchEvents();
      toast.success('The selected event(s) and all associated cards have been deleted.', 'Event(s) deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event(s).', 'Delete Failed');
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  }, [rowSelection, filteredEvents, fetchEvents]);

  // Define columns for the table
  const columns = useMemo<ColumnDef<EventWithStats>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            ref={(input) => {
              if (input) {
                input.indeterminate = table.getIsSomeRowsSelected();
              }
            }}
            onChange={table.getToggleAllRowsSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 transition-colors hover:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 transition-colors hover:border-blue-500 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
          />
        </div>
      ),
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: "Event Name",
      accessorFn: (row) => row.name.toLowerCase(),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      enableSorting: true
    },
    {
      accessorKey: "date",
      header: "Event Date",
      accessorFn: (row) => new Date(row.date).getTime(),
      cell: ({ row }) => (
        <span className="text-gray-600">{new Date(row.getValue("date")).toLocaleDateString()}</span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "stats.total_cards",
      header: "Total Cards",
      accessorFn: (row) => row.stats.total_cards || 0,
      cell: ({ row }) => row.original.stats.total_cards,
      enableSorting: true,
    },
    {
      accessorKey: "stats.needs_review",
      header: "Needs Review",
      accessorFn: (row) => row.stats.needs_review || 0,
      cell: ({ row }) => (
        <div className={determineHighlightStatus(row.original) === 'needs_review' 
          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-indigo-700 border border-indigo-200 bg-white'
          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200 bg-white'
        }>
          {row.original.stats.needs_review}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "stats.ready_for_export",
      header: "Ready for Export",
      accessorFn: (row) => row.stats.ready_for_export || 0,
      cell: ({ row }) => (
        <div className={determineHighlightStatus(row.original) === 'ready' 
          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-blue-700 border border-blue-200 bg-white'
          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200 bg-white'
        }>
          {row.original.stats.ready_for_export}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "stats.exported",
      header: "Exported",
      accessorFn: (row) => row.stats.exported || 0,
      cell: ({ row }) => (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-slate-600 border border-slate-200 bg-white">
          {row.original.stats.exported || 0}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "stats.archived",
      header: "Archived",
      accessorFn: (row) => row.stats.archived || 0,
      cell: ({ row }) => (
        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 border border-gray-200 bg-white">
          {row.original.stats.archived || 0}
        </div>
      ),
      enableSorting: true,
    },
  ], []);

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && Object.keys(rowSelection).length > 0) {
        setRowSelection({});
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [rowSelection]);

  // Table configuration
  const table = useReactTable({
    data: filteredEvents,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: (newSelection) => {
      console.log('New Selection:', newSelection); // Debug the incoming selection
      setRowSelection(newSelection);
      
      // Convert the selection state to an array of selected event IDs
      if (typeof newSelection === 'function') {
        newSelection = newSelection(rowSelection);
      }
      
      const selectedIds = Object.entries(newSelection)
        .filter(([_, selected]) => selected)
        .map(([index]) => {
          const eventId = filteredEvents[parseInt(index)]?.id;
          console.log(`Row ${index} maps to event ID:`, eventId); // Debug the mapping
          return eventId;
        })
        .filter(Boolean); // Remove any undefined values
      
      console.log('Mapped to event IDs:', selectedIds); // Debug the final IDs
      setSelectedEvents(selectedIds);
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true, // Enable debug mode to see what's happening with sorting
  });

  // Debug effect to log selection changes
  useEffect(() => {
    console.log('Row Selection:', rowSelection);
    console.log('Selected Events:', selectedEvents);
  }, [rowSelection, selectedEvents]);

  // Selection action bar component
  const SelectionActionBar = () => {
    const selectedCount = Object.keys(rowSelection).length;
    if (selectedCount === 0) return null;
    return (
      <div className="bg-blue-50 border-b border-blue-200 transition-all duration-200 ease-in-out animate-in fade-in slide-in-from-top-2">
        <div className="px-4 py-3 flex justify-between items-center gap-4">
          <div className="text-sm font-medium text-foreground">
            {selectedCount} {selectedCount === 1 ? 'Event' : 'Events'} Selected
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedTab === 'archived' ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="text-white bg-red-600 hover:bg-red-700"
                disabled={deleteLoading}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {selectedCount === 1 ? 'Delete Event' : 'Delete Events'}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchiveSelected}
                className="text-gray-700 hover:text-gray-900"
              >
                <Archive className="mr-1 h-4 w-4" />
                Archive Selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-gray-500 hover:text-gray-700 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container max-w-6xl mx-auto py-6">
      {/* Hero-style header card */}
      <Card className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 sm:p-6 mb-8 shadow-sm">
        {/* Left: title + icon & subtitle row */}
        <div className="flex flex-col items-start w-full md:w-auto mb-4 md:mb-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight mb-2">
            Your Events
          </h1>
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-primary-600" />
            <p className="text-sm text-gray-500">
              Review and export cards for all of your events
            </p>
          </div>
        </div>

        {/* Right: status pills + Create button */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Badge variant="outline" className="flex items-center space-x-1">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <span>Upcoming: {upcomingEvents.length}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Completed: {completedEvents.length}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Archive className="w-4 h-4 text-gray-500" />
            <span>
              Archived: {archivedEventsCount}
            </span>
          </Badge>
        </div>
      </Card>

      {eventsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading events...</div>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            {/* Tabs */}
            <div className="flex justify-between items-center mb-6 border-b">
              <div className="flex gap-6">
                <button
                  onClick={() => setSelectedTab('upcoming')}
                  className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                    selectedTab === 'upcoming'
                      ? 'border-b-2 border-indigo-500 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Upcoming Events
                  <Badge variant="outline" className="ml-2 text-indigo-700 border-indigo-200 bg-white">
                    {upcomingEvents.length}
                  </Badge>
                </button>
                <button
                  onClick={() => setSelectedTab('completed')}
                  className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                    selectedTab === 'completed'
                      ? 'border-b-2 border-indigo-500 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Completed Events
                  <Badge variant="outline" className="ml-2 text-blue-700 border-blue-200 bg-white">
                    {completedEvents.length}
                  </Badge>
                </button>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedTab('archived')}
                  className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                    selectedTab === 'archived'
                      ? 'border-b-2 border-indigo-500 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Archived Events
                  <Badge variant="outline" className="ml-2 text-gray-600 border-gray-200 bg-white">
                    {archivedEventsCount}
                  </Badge>
                </button>
              </div>
            </div>

            {/* Table Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
              <div className="w-full md:w-auto md:flex-1 max-w-sm">
                <Input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setIsCreateEventModalOpen(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  <PlusCircle className="w-5 h-5" />
                  Create Event
                </Button>
              </div>
            </div>

            {/* Hidden file input for file upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,image/*"
              className="hidden"
            />

            {/* Selection Action Bar */}
            {Object.keys(rowSelection).length > 0 && (
              <SelectionActionBar />
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader className="bg-gray-50 sticky top-0 z-10">
                    {table.getHeaderGroups().map(headerGroup => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <TableHead
                            key={header.id}
                            onClick={header.column.getToggleSortingHandler()}
                            className={`py-3 px-4 whitespace-nowrap ${
                              header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: ' ▲',
                                desc: ' ▼'
                              }[header.column.getIsSorted() as string] ?? ''}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.length > 0 ? (
                      table.getRowModel().rows.map(row => (
                        <TableRow
                          key={row.id}
                          className={`hover:bg-gray-50 cursor-pointer ${row.getIsSelected() ? 'bg-blue-50' : ''}`}
                          onClick={(e) => {
                            // Don't navigate if user is selecting a checkbox
                            if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
                              return;
                            }
                            handleViewEvent(row.original);
                          }}
                          data-state={row.getIsSelected() ? 'selected' : undefined}
                        >
                          {row.getVisibleCells().map(cell => (
                            <TableCell key={cell.id} className="px-4 py-3 text-sm text-gray-700">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="h-24" colSpan={table.getAllColumns().length}>
                          <div className="flex flex-col items-center justify-center h-full gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {selectedTab === 'upcoming' 
                                ? 'No upcoming events found' 
                                : selectedTab === 'completed' 
                                  ? 'No completed events found' 
                                  : 'No archived events found'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {selectedTab === 'upcoming' 
                                ? 'Click "Create Event" to get started.' 
                                : selectedTab === 'completed' 
                                  ? 'Events that have passed will appear here.' 
                                  : 'Events that have been archived will appear here.'}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onEventCreated={() => {
          fetchEvents();
          setIsCreateEventModalOpen(false);
        }}
      />

      <Dialog open={isManualEntryModalOpen} onOpenChange={setIsManualEntryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Contact Information</DialogTitle>
            <DialogDescription>
              Manually enter a contact's information to add to an event.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="event-select">Event <span className="text-red-500">*</span></Label>
              <Select value={selectedEventForEntry} onValueChange={setSelectedEventForEntry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={manualEntryForm.name}
                onChange={(e) => handleManualEntryChange('name', e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={manualEntryForm.email}
                onChange={(e) => handleManualEntryChange('email', e.target.value)}
                placeholder="johndoe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cell">Phone</Label>
              <Input
                id="cell"
                value={manualEntryForm.cell}
                onChange={(e) => handleManualEntryChange('cell', e.target.value)}
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Birthday</Label>
              <Input
                id="dob"
                value={manualEntryForm.date_of_birth}
                onChange={(e) => handleManualEntryChange('date_of_birth', e.target.value)}
                placeholder="MM/DD/YYYY"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManualEntryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleManualEntrySubmit}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {Object.keys(rowSelection).length === 1 ? 'Event' : 'Events'}?</DialogTitle>
            <DialogDescription>
              This action will <span className="font-semibold text-red-600">permanently delete</span> the selected event{Object.keys(rowSelection).length > 1 ? 's' : ''} and <span className="font-semibold text-red-600">all associated cards</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteEvents} disabled={deleteLoading} className="text-white bg-red-600 hover:bg-red-700">
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardCopy;