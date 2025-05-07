import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
// Restore full Tanstack Table imports
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Download, Trash2, CheckCircle, FileText, FolderOpen, Loader2, Archive } from 'lucide-react';
// Custom Components and Hooks
import ScanFab from '@/components/ScanFab';
import { useToast } from "@/hooks/use-toast";
import { useCardsOverride } from '@/hooks/useCardsOverride';
import { useEvents } from '@/hooks/useEvents';
// Utilities and Types
import {
  formatPhoneNumber,
  formatBirthday,
  escapeCsvValue,
  formatDateOrTimeAgo
} from '@/lib/utils';
import type { ProspectCard, FieldDetail, CardStatus } from '@/types/card';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LoadingState } from '@/components/LoadingState';
import type { Event } from '@/types/event';
import { determineCardStatus } from '@/lib/cardUtils';
import { CreateEventModal } from '@/components/CreateEventModal';
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ProspectCard as ProspectCardType } from "@/types/card";

// === Component Definition ===
const EventDetailsPage = () => {
  // Get eventId from URL params
  const { eventId } = useParams();
  
  // --- Hooks ---
  const { toast } = useToast();
  const { events, loading: eventsLoading, fetchEvents } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { cards, fetchCards, getStatusCount, isLoading, setReviewModalState } = useCardsOverride(eventId);

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Update selected event when events are loaded
  useEffect(() => {
    if (events && eventId) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [events, eventId]);

  // --- State ---
  const [selectedTab, setSelectedTab] = useState<string>('needs_human_review');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedCardForReview, setSelectedCardForReview] = useState<ProspectCardType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState<boolean>(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hideExported, setHideExported] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add a ref to track the selected card ID
  const selectedCardIdRef = useRef<string | null>(null);

  // Add a ref to track the image key
  const imageKeyRef = useRef<string>(`image-${Date.now()}`);
  
  // Add a ref to store the image URL
  const imageUrlRef = useRef<string>('');

  // Add a ref to store a local copy of the selected card that won't be affected by updates
  const localCardRef = useRef<ProspectCardType | null>(null);

  // --- Memos ---
  const dataFieldsMap = useMemo(() => { 
    const map = new Map<string, string>(); 
    [
      { key: 'name', label: 'Name' }, 
      { key: 'preferred_first_name', label: 'Preferred Name' }, 
      { key: 'email', label: 'Email' }, 
      { key: 'cell', label: 'Phone Number' }, 
      { key: 'date_of_birth', label: 'Birthday' }, 
      { key: 'address', label: 'Address' }, 
      { key: 'city', label: 'City' }, 
      { key: 'state', label: 'State' }, 
      { key: 'zip_code', label: 'Zip Code' }, 
      { key: 'high_school', label: 'High School/College' }, 
      { key: 'student_type', label: 'Student Type' }, 
      { key: 'entry_term', label: 'Entry Term' }, 
      { key: 'gpa', label: 'GPA' }, 
      { key: 'class_rank', label: 'Class Rank' }, 
      { key: 'students_in_class', label: 'Students in Class' }, 
      { key: 'major', label: 'Major' }, 
      { key: 'permission_to_text', label: 'Permission to Text' }
    ].forEach(field => map.set(field.key, field.label)); 
    return map; 
  }, []);

  const reviewFieldOrder = useMemo(() => [
    'name', 
    'preferred_first_name', 
    'date_of_birth', 
    'email', 
    'cell', 
    'permission_to_text', 
    'address', 
    'city', 
    'state', 
    'zip_code', 
    'high_school', 
    'class_rank', 
    'students_in_class', 
    'gpa', 
    'student_type', 
    'entry_term', 
    'major'
  ], []);

  const reviewProgress = useMemo(() => {
    if (!selectedCardForReview) return { reviewedCount: 0, totalFields: 0, allReviewed: false };
    
    // If the card is already in reviewed state, show as all reviewed
    if (determineCardStatus(selectedCardForReview) === 'reviewed') {
      return { reviewedCount: 0, totalFields: 0, allReviewed: true };
    }
    
    let fieldsNeedingReview = new Set<string>();

    // First pass: collect all fields that need or needed review
    Object.entries(selectedCardForReview.fields).forEach(([key, field]) => {
      // Include fields that either currently need review or have been reviewed
      if (field.requires_human_review === true || field.reviewed === true) {
        fieldsNeedingReview.add(key);
      }
    });

    // Count how many of these fields have been reviewed
    const reviewedCount = Array.from(fieldsNeedingReview).filter(key => 
      selectedCardForReview.fields[key as keyof typeof selectedCardForReview.fields]?.reviewed === true
    ).length;

    const totalFields = fieldsNeedingReview.size;
    const allReviewed = reviewedCount === totalFields && totalFields > 0;

    return {
      reviewedCount,
      totalFields,
      allReviewed
    };
  }, [selectedCardForReview]);

  // Add table columns definition
  const columns = useMemo<ColumnDef<ProspectCardType>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      id: 'date',
      header: 'Date added',
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      cell: ({ row }) => formatDateOrTimeAgo(row.original.createdAt),
      enableSorting: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorFn: (row) => {
        const status = determineCardStatus(row);
        switch(status) {
          case 'needs_human_review': return 0;
          case 'reviewed': return 1;
          case 'exported': return 2;
          case 'archived': return 3;
          default: return 4;
        }
      },
      cell: ({ row }) => {
        const status = determineCardStatus(row.original);
        return (
          <Badge variant={status === 'exported' ? 'secondary' : 'outline'}>
            {status === 'exported' ? 'Exported' : 'Ready for Export'}
          </Badge>
        );
      },
      enableSorting: true,
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => row.fields.name?.value?.toLowerCase() || '',
      cell: ({ row }) => {
        const name = row.original.fields.name?.value || '';
        return <span className="font-medium">{name}</span>;
      },
      enableSorting: true,
    },
    {
      id: 'preferred_name',
      header: 'Preferred Name',
      accessorFn: (row) => row.fields.preferred_first_name?.value?.toLowerCase() || '',
      cell: ({ row }) => row.original.fields.preferred_first_name?.value || '',
      enableSorting: true,
    },
    {
      id: 'date_of_birth',
      header: 'Birthday',
      accessorFn: (row) => {
        const dateStr = row.fields.date_of_birth?.value;
        if (!dateStr) return '';
        
        // Try to parse as a full date first
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
        
        // If it's just a month name, convert to a sortable number (1-12)
        const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthIndex = months.indexOf(dateStr.trim().toUpperCase());
        if (monthIndex !== -1) {
          return monthIndex + 1;
        }
        
        // For partial dates (MM/DD), convert to a sortable number
        const parts = dateStr.split('/');
        if (parts.length >= 2) {
          const month = parseInt(parts[0]);
          const day = parseInt(parts[1]);
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            return (month * 100) + day;
          }
        }
        
        return dateStr.toLowerCase();
      },
      cell: ({ row }) => formatBirthday(row.original.fields.date_of_birth?.value || ''),
      enableSorting: true,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const card = row.original;
        return (
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(card);
            }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        );
      },
      enableSorting: false,
    },
  ], []);

  // Add filtered cards logic
  const filteredCards = useMemo(() => {
    if (!cards) return [];
    
    let filtered = cards.filter(card => {
      // Always filter by event if eventId is provided
      if (eventId && card.event_id !== eventId) {
        return false;
      }

      const currentStatus = determineCardStatus(card);
      
      // Apply hideExported filter if enabled
      if (hideExported && card.exported_at) {
        return false;
      }

      // Apply search filter if query exists
      if (searchQuery) {
        const name = card.fields?.name?.value?.toLowerCase() || '';
        const email = card.fields?.email?.value?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        if (!name.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // Filter by tab
      switch (selectedTab) {
        case 'ready_to_export':
          return currentStatus === 'reviewed' || currentStatus === 'exported';
        case 'needs_human_review': 
          return currentStatus === 'needs_human_review';
        case 'exported': 
          return currentStatus === 'exported';
        case 'archived': 
          return currentStatus === 'archived';
        default: 
          return true;
      }
    });

    return filtered;
  }, [cards, eventId, hideExported, searchQuery, selectedTab]);

  // Initialize table
  const table = useReactTable({
    data: filteredCards,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableMultiSort: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  // Add download CSV handler
  const handleDownloadCSV = useCallback(async () => {
    if (!Object.keys(rowSelection).length) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Mark cards as exported
      const selectedIds = Object.keys(rowSelection).map(index => filteredCards[parseInt(index)].id);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      toast({
        title: "Exporting Cards",
        description: "Processing your export request...",
        variant: "default",
      });

      const response = await fetch(`${apiBaseUrl}/mark-exported`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: selectedIds })
      });

      if (!response.ok) {
        throw new Error('Failed to mark cards as exported');
      }

      // Generate CSV content
      const csvRows = ['Name,Email,Phone,Birthday,High School,GPA,Class Rank,Students in Class'];
      Object.keys(rowSelection).forEach(index => {
        const card = filteredCards[parseInt(index)];
        const row = [
          escapeCsvValue(card.fields.name?.value || ''),
          escapeCsvValue(card.fields.email?.value || ''),
          escapeCsvValue(formatPhoneNumber(card.fields.cell?.value || '')),
          escapeCsvValue(formatBirthday(card.fields.date_of_birth?.value || '')),
          escapeCsvValue(card.fields.high_school?.value || ''),
          escapeCsvValue(card.fields.gpa?.value || ''),
          escapeCsvValue(card.fields.class_rank?.value || ''),
          escapeCsvValue(card.fields.students_in_class?.value || '')
        ].join(',');
        csvRows.push(row);
      });

      // Download CSV
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `card-capture-export-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Clear selection and refresh cards
      setRowSelection({});
      await fetchCards();

      toast({
        title: "Export Complete",
        description: `Successfully exported ${Object.keys(rowSelection).length} cards.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting cards:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  // Add archive handler
  const handleArchiveSelected = useCallback(async () => {
    if (!Object.keys(rowSelection).length) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to archive.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the selected IDs directly from the rowSelection object
      const selectedIds = Object.entries(rowSelection)
        .filter(([_, isSelected]) => isSelected)
        .map(([index]) => {
          const cardIndex = parseInt(index);
          if (isNaN(cardIndex) || cardIndex < 0 || cardIndex >= filteredCards.length) {
            console.error('Invalid card index:', { index, cardIndex, totalCards: filteredCards.length });
            return null;
          }
          const card = filteredCards[cardIndex];
          if (!card || !card.id) {
            console.error('Invalid card or missing ID:', { index, cardIndex, card });
            return null;
          }
          return card.id;
        })
        .filter((id): id is string => id !== null);

      if (selectedIds.length === 0) {
        toast({
          title: "Invalid Selection",
          description: "No valid cards were selected to archive.",
          variant: "destructive",
        });
        return;
      }

      console.log('Archiving cards with IDs:', selectedIds);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      toast({
        title: "Archiving Cards",
        description: "Processing your archive request...",
        variant: "default",
      });

      const response = await fetch(`${apiBaseUrl}/archive-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: selectedIds })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Archive failed:', { status: response.status, error: errorData });
        throw new Error(errorData.error || 'Failed to archive cards');
      }

      // Clear selection before fetching to prevent stale state
      setRowSelection({});
      
      // Force a refresh of the cards data
      await fetchCards();
      
      // Close the archive confirmation dialog
      setIsArchiveConfirmOpen(false);

      toast({
        title: "Archive Complete",
        description: `Successfully archived ${selectedIds.length} cards.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error archiving cards:', error);
      toast({
        title: "Archive Failed",
        description: error instanceof Error ? error.message : "Failed to archive cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  // Add handlers for review modal
  const handleRowClick = (card: ProspectCardType) => {
    setSelectedCardForReview(card);
    setFormData(Object.fromEntries(
      Object.entries(card.fields).map(([key, field]) => [key, field?.value || ''])
    ));
    imageUrlRef.current = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/images/${card.id}`;
    imageKeyRef.current = `image-${card.id}-${Date.now()}`;
    setIsReviewModalOpen(true);
  };

  const handleFieldReview = async (fieldKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedCardForReview) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/review-field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: selectedCardForReview.id,
          field_key: fieldKey,
          value: formData[fieldKey] || selectedCardForReview.fields[fieldKey]?.value || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to review field');
      }

      toast({
        title: "Field Reviewed",
        description: "Successfully marked field as reviewed.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error reviewing field:', error);
      toast({
        title: "Review Failed",
        description: "Failed to mark field as reviewed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFormChange = (fieldKey: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleReviewSave = async () => {
    if (!selectedCardForReview) return;

    setIsSaving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/update-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: selectedCardForReview.id,
          fields: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      await fetchCards();
      setIsReviewModalOpen(false);
      toast({
        title: "Changes Saved",
        description: "Successfully updated card information.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Save Failed",
        description: "Failed to update card information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || eventsLoading || !selectedEvent) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-0">{selectedEvent.name}</h1>
          <p className="text-sm text-muted-foreground">
            Event Date: {formatDateOrTimeAgo(selectedEvent.date)}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cards.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('needs_human_review')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('reviewed')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exported</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatusCount('exported')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="w-full sm:w-auto space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[300px]"
          />
          <div className="flex items-center space-x-2">
            <Switch
              id="hide-exported"
              checked={hideExported}
              onCheckedChange={setHideExported}
            />
            <Label htmlFor="hide-exported">Hide Exported</Label>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsArchiveConfirmOpen(true)}
            disabled={!Object.keys(rowSelection).length}
            className="w-full sm:w-auto"
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            disabled={!Object.keys(rowSelection).length}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
        </div>
      </div>

      {/* Table Section */}
      <div className="rounded-md border">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="w-full max-w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="needs_human_review" className="flex-shrink-0">
              Needs Review ({getStatusCount('needs_human_review')})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex-shrink-0">
              Reviewed ({getStatusCount('reviewed')})
            </TabsTrigger>
            <TabsTrigger value="exported" className="flex-shrink-0">
              Exported ({getStatusCount('exported')})
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex-shrink-0">
              Archived ({getStatusCount('archived')})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead 
                              key={header.id}
                              className={`whitespace-nowrap ${
                                header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="flex items-center gap-1">
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
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
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            onClick={() => handleRowClick(row.original)}
                            className="cursor-pointer hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell 
                                key={cell.id}
                                className="py-3"
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No cards found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] max-w-7xl h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)] rounded-lg overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex-shrink-0">
            <div className="flex justify-between items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b">
              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-2xl font-semibold">Review Card Data</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  Review and edit the extracted information from the card image.
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <div className="flex items-center gap-1 text-sm font-medium transition-all duration-200">
                  {selectedTab === 'ready_to_export' ? (
                    <div className="flex items-center gap-1 text-green-600 animate-in fade-in duration-300">
                      <CheckCircle className="h-5 w-5" />
                      <span>All fields reviewed!</span>
                    </div>
                  ) : (
                    <span className="text-primary-600">
                      {reviewProgress.reviewedCount} / {reviewProgress.totalFields} fields reviewed
                    </span>
                  )}
                </div>
                {selectedTab !== 'ready_to_export' && (
                  <div className="transition-all duration-300">
                    <Progress
                      className="w-32 h-1"
                      value={(reviewProgress.reviewedCount / reviewProgress.totalFields) * 100}
                    />
                  </div>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form fields */}
              <div className="space-y-4">
                {Object.entries(selectedCardForReview?.fields || {}).map(([key, field]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                      {field.requires_human_review && (
                        <span className="text-yellow-500">Needs Review</span>
                      )}
                    </Label>
                    <Input
                      id={key}
                      value={formData[key] || field.value || ''}
                      onChange={(e) => handleFormChange(key, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Card image */}
              <div className="relative h-[400px] sm:h-[500px] bg-gray-100 rounded-lg overflow-hidden">
                {selectedCardForReview?.image_path && (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/images/${selectedCardForReview.image_path}`}
                    alt="Business card"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t p-4 sm:p-6">
            <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center w-full gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <Button
                  type="button"
                  onClick={handleReviewSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will archive {Object.keys(rowSelection).length} cards. Archived cards can still be viewed but cannot be modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchiveSelected}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EventDetailsPage; 