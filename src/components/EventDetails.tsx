// src/components/Dashboard.tsx (Reverted State - After useCards, Before useCardTable)

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
// Restore full Tanstack Table imports
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from "@tanstack/react-table";
// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
  DialogDescription,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge"; // Restore Badge import
import { Card, CardContent } from "@/components/ui/card";
import {
  Download,
  CheckCircle,
  Loader2,
  X,
  Info,
  Archive,
  CheckCircle2,
  ChevronRight,
  Pencil,
  Check,
} from "lucide-react";
// Custom Components and Hooks
import { useToast } from "@/hooks/use-toast";
import { useCardsOverride } from "@/hooks/useCardsOverride";
import { useEvents } from "@/hooks/useEvents";
// Utilities and Types
import {
  formatPhoneNumber,
  formatBirthday,
  formatDateOrTimeAgo,
  escapeCsvValue,
} from "@/lib/utils";
import type { ProspectCard } from "@/types/card";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Event } from "@/types/event";
import { determineCardStatus } from "@/lib/cardUtils";
import { useCardUpload } from "@/hooks/useCardUpload";
import { supabase } from "@/lib/supabaseClient";
import { getSignedImageUrl } from "@/lib/imageUtils";
import ReviewImagePanel from "@/components/review/ReviewImagePanel";
import ReviewForm from "@/components/review/ReviewForm";
import ArchiveConfirmDialog from "@/components/modals/ArchiveConfirmDialog";
import MoveConfirmDialog from "@/components/modals/MoveConfirmDialog";
import DeleteConfirmDialog from "@/components/modals/DeleteConfirmDialog";
import ManualEntryModal from "@/components/modals/ManualEntryModal";
import CardTable from "@/components/cards/CardTable";
import { useEventName } from "@/hooks/useEventName";
import { useCardReviewModal } from "@/hooks/useCardReviewModal";
import { useCardTableActions } from "@/hooks/useCardTableActions";
import { useManualEntryModal } from "@/hooks/useManualEntryModal";
import { useCardUploadActions } from "@/hooks/useCardUploadActions";
import { useZoom } from "@/hooks/useZoom";
import { useStatusTabs } from "@/hooks/useStatusTabs";

// === Component Definition ===
const Dashboard = () => {
  // --- Hooks ---
  const { toast } = useToast();
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { events, loading: eventsLoading, fetchEvents } = useEvents();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { cards, fetchCards, setReviewModalState } = useCardsOverride(
    selectedEvent?.id
  );
  const { uploadCard } = useCardUpload();

  // Status Tabs
  const { selectedTab, setSelectedTab, getStatusCount } = useStatusTabs(
    cards,
    determineCardStatus
  );

  // Event Name
  const eventName = useEventName(selectedEvent, fetchEvents, (args) =>
    toast({ ...args, variant: args.variant as "default" | "destructive" })
  );

  // Review Field Order (don't modify this)
  const reviewFieldOrder: string[] = useMemo(
    () => [
      "name",
      "preferred_first_name",
      "date_of_birth",
      "email",
      "cell",
      "permission_to_text",
      "address",
      "city",
      "state",
      "zip_code",
      "high_school",
      "class_rank",
      "students_in_class",
      "gpa",
      "student_type",
      "entry_term",
      "major",
    ],
    []
  );

  // Field mapping (don't modify this)
  const dataFieldsMap = useMemo(() => {
    const map = new Map<string, string>();
    [
      { key: "name", label: "Name" },
      { key: "preferred_first_name", label: "Preferred Name" },
      { key: "email", label: "Email" },
      { key: "cell", label: "Phone Number" },
      { key: "date_of_birth", label: "Birthday" },
      { key: "address", label: "Address" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "zip_code", label: "Zip Code" },
      { key: "high_school", label: "High School/College" },
      { key: "student_type", label: "Student Type" },
      { key: "entry_term", label: "Entry Term" },
      { key: "gpa", label: "GPA" },
      { key: "class_rank", label: "Class Rank" },
      { key: "students_in_class", label: "Students in Class" },
      { key: "major", label: "Major" },
      { key: "permission_to_text", label: "Permission to Text" },
    ].forEach((field) => map.set(field.key, field.label));
    return map;
  }, []);

  // --- State Declarations (consolidated here) ---
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Upload/processing state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Review modal state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedCardForReview, setSelectedCardForReview] =
    useState<ProspectCard | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Confirmation dialogs
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] =
    useState<boolean>(false);
  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] =
    useState<boolean>(false);

  // Card selection and filtering
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [hideExported, setHideExported] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Image and zoom
  const [zoom, setZoom] = useState(0.47);
  const [imageUrlState, setImageUrlState] = useState("");

  // Event editing
  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [eventNameInput, setEventNameInput] = useState(
    selectedEvent?.name || ""
  );
  const [eventNameLoading, setEventNameLoading] = useState(false);
  const [eventNameError, setEventNameError] = useState<string | null>(null);

  // Manual entry
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] =
    useState<boolean>(false);
  const [manualEntryForm, setManualEntryForm] = useState({
    name: "",
    preferred_first_name: "",
    date_of_birth: "",
    email: "",
    cell: "",
    permission_to_text: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    high_school: "",
    class_rank: "",
    students_in_class: "",
    gpa: "",
    student_type: "",
    entry_term: "",
    major: "",
  });

  // Settings/preferences
  const [cardFieldPrefs, setCardFieldPrefs] = useState<Record<
    string,
    boolean
  > | null>(null);

  // --- Refs ---
  const selectedCardIdRef = useRef<string | null>(null);
  const imageKeyRef = useRef<string>(`image-${Date.now()}`);
  const imageUrlRef = useRef<string>("");
  const localCardRef = useRef<ProspectCard | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const fieldsWithToastRef = useRef<Set<string>>(new Set());
  const eventsRef = useRef<{ fetchEvents: () => Promise<void> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevHideExported = useRef(hideExported);

  // --- Custom Hooks ---
  const zoomState = useZoom();
  const { handleFileSelect, handleCaptureCard, handleImportFile } = useCardUploadActions(
    selectedEvent,
    uploadCard,
    fetchCards,
    (args) => toast({ ...args, variant: args.variant as "default" | "destructive" }),
    fileInputRef
  );
  const { handleReviewSave } = useCardReviewModal(
    cards,
    reviewFieldOrder,
    fetchCards,
    (args) => toast({ ...args, variant: args.variant as "default" | "destructive" }),
    dataFieldsMap
  );
  const { handleManualEntry, handleManualEntryChange, handleManualEntrySubmit } = useManualEntryModal(
    eventId,
    fetchCards,
    (args) => toast({ ...args, variant: args.variant as "default" | "destructive" })
  );

  // --- Callbacks ---
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(query);
    }, 300);
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // Default page size

  // --- Filtered Cards ---
  useEffect(() => {
    if (cards) {
      console.log('All cards review_status:', cards.map(card => ({id: card.id, review_status: card.review_status})));
      console.log(
        'Archived cards event_id:',
        cards.filter(card => card.review_status === 'archived').map(card => ({
          id: card.id,
          event_id: card.event_id
        })),
        'Selected event id:', selectedEvent?.id
      );
    }
  }, [cards, selectedEvent]);

  const filteredCards = useMemo(() => {
    if (!cards) return [];

    return cards.filter((card) => {
      // Always filter by event if eventId is provided
      if (selectedEvent && card.event_id !== selectedEvent.id) {
        return false;
      }

      // Exclude archived cards from all tabs except the archived tab
      if (selectedTab !== "archived" && card.review_status === "archived") {
        return false;
      }

      const currentStatus = determineCardStatus(card);

      // Only apply hideExported in the ready_to_export tab
      if (selectedTab === "ready_to_export" && hideExported && currentStatus === "exported") {
        return false;
      }

      // Apply search filter if query exists
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const searchableFields = [
          card.fields?.name?.value,
          card.fields?.email?.value,
          card.fields?.cell?.value,
          card.fields?.preferred_first_name?.value,
          card.fields?.high_school?.value,
          card.fields?.address?.value,
          card.fields?.city?.value,
          card.fields?.state?.value,
          card.fields?.zip_code?.value,
          card.fields?.major?.value,
        ];

        // Check if any field contains the search query
        const matchesSearch = searchableFields.some((field) =>
          field?.toLowerCase().includes(query)
        );

        if (!matchesSearch) {
          return false;
        }
      }

      switch (selectedTab) {
        case "ready_to_export":
          return currentStatus === "reviewed" || currentStatus === "exported";
        case "needs_human_review":
          return currentStatus === "needs_human_review";
        case "exported":
          return currentStatus === "exported";
        case "archived":
          return card.review_status === "archived";
        default:
          return true;
      }
    });
  }, [cards, selectedTab, selectedEvent, hideExported, debouncedSearchQuery]);

  // Now that filteredCards is defined, we can use it in useCardTableActions
  const { handleExportSelected, handleMoveSelected, handleArchiveSelected, handleDeleteSelected, downloadCSV } = useCardTableActions(
    filteredCards,
    fetchCards,
    (args) => toast({ ...args, variant: args.variant as "default" | "destructive" }),
    selectedEvent,
    dataFieldsMap
  );

  // --- Pagination Logic ---
  const totalCards = filteredCards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / pageSize));
  const paginatedCards = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCards.slice(start, start + pageSize);
  }, [filteredCards, currentPage, pageSize]);

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredCards]);

  // Review Progress
  const reviewProgress = useMemo(() => {
    if (!selectedCardForReview)
      return { reviewedCount: 0, totalFields: 0, allReviewed: false };

    const fieldsNeedingReview = new Set<string>();

    // First pass: collect all fields that need or needed review
    Object.entries(selectedCardForReview.fields).forEach(([key, field]) => {
      // Include fields that either currently need review or have been reviewed
      if (field.requires_human_review === true || field.reviewed === true) {
        fieldsNeedingReview.add(key);
      }
    });

    // Count how many of these fields have been reviewed
    const reviewedCount = Array.from(fieldsNeedingReview).filter(
      (key) =>
        selectedCardForReview.fields[
          key as keyof typeof selectedCardForReview.fields
        ]?.reviewed === true
    ).length;

    const totalFields = fieldsNeedingReview.size;
    const allReviewed = reviewedCount === totalFields && totalFields > 0;

    return {
      reviewedCount,
      totalFields,
      allReviewed,
    };
  }, [selectedCardForReview]);

  // Effect to fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Effect to handle event selection based on URL params
  useEffect(() => {
    if (events.length > 0) {
      if (eventId) {
        // Find event matching URL param
        const event = events.find((e) => e.id === eventId);
        if (event) {
          setSelectedEvent(event);
        } else {
          // If event not found, redirect to first event
          const firstEvent = events[0];
          navigate(`/events/${firstEvent.id}`);
          toast({
            title: "Event Not Found",
            description:
              "The requested event could not be found. Redirected to the first available event.",
            variant: "destructive",
          });
        }
      } else {
        // No eventId in URL, redirect to first event
        const firstEvent = events[0];
        navigate(`/events/${firstEvent.id}`);
      }
    }
  }, [eventId, events, navigate, toast]);

  // Effect to refetch cards when selected event changes
  useEffect(() => {
    fetchCards();
  }, [selectedEvent, fetchCards]);

  // Add this after filteredCards is defined and before JSX return
  useEffect(() => {
    setRowSelection((prev) => {
      const validIds = new Set(filteredCards.map((card) => card.id));
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => validIds.has(id))
      );
      // Only update if changed
      return Object.keys(next).length === Object.keys(prev).length
        ? prev
        : next;
    });
  }, [filteredCards]);

  // Add effect to update selected card IDs when row selection changes
  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
    console.log('Selected card IDs:', selectedIds);
  }, [rowSelection]);

  // --- Callbacks & Effects ---
  const handleFieldReview = useCallback(
    (fieldKey: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedCardForReview) return;

      // Update the local state immediately
      const updatedCard = { ...selectedCardForReview };
      const currentValue =
        formData[fieldKey] ??
        selectedCardForReview.fields[fieldKey]?.value ??
        "";

      // Update the field in the local copy
      if (updatedCard.fields[fieldKey]) {
        updatedCard.fields[fieldKey] = {
          ...updatedCard.fields[fieldKey],
          value: currentValue,
          reviewed: true,
          requires_human_review: false,
          review_notes: "Manually Reviewed",
        };
      }

      // Update the local state
      setSelectedCardForReview(updatedCard);
      localCardRef.current = updatedCard;

      // Update the formData to reflect the reviewed state
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: currentValue,
      }));

      // Show success toast
      toast({
        title: "Field Reviewed",
        description: `${
          dataFieldsMap.get(fieldKey) || fieldKey
        } has been marked as reviewed.`,
        variant: "default",
      });
    },
    [selectedCardForReview, formData, toast, dataFieldsMap]
  );

  const handleRowClick = useCallback(
    (card: ProspectCard) => {
      // Store a local copy of the card that won't be affected by updates
      localCardRef.current = card;
      setSelectedCardForReview(card);
      selectedCardIdRef.current = card.id;
      imageKeyRef.current = `image-${card.id}-${Date.now()}`;
      // Initialize formData with the card's field values
      const initialFormData: Record<string, string> = {};
      Object.entries(card.fields).forEach(([fieldKey, fieldData]) => {
        initialFormData[fieldKey] = fieldData.value || '';
      });
      setFormData(initialFormData);
      setIsReviewModalOpen(true);
      setReviewModalState(true);
    },
    [setReviewModalState]
  );

  const handleFormChange = (field: string, value: string) => {
    // Update form data
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Update local card state
    if (selectedCardForReview) {
      setSelectedCardForReview((prev) => {
        if (!prev) return prev;
        const updatedFields = { ...prev.fields };
        if (updatedFields[field]) {
          updatedFields[field] = {
            ...updatedFields[field],
            value,
            reviewed: true,
            requires_human_review: false,
            review_notes: "Manually reviewed",
          };
        }
        return {
          ...prev,
          fields: updatedFields,
        };
      });
    }
  };

  // Reset the fields with toast when the modal is closed
  useEffect(() => {
    if (!isReviewModalOpen) {
      fieldsWithToastRef.current.clear();
    }
  }, [isReviewModalOpen]);

  // Add an effect to update the selected card when cards are refreshed
  useEffect(() => {
    if (selectedCardIdRef.current && cards.length > 0) {
      const updatedCard = cards.find(
        (card) => card.id === selectedCardIdRef.current
      );
      if (updatedCard) {
        // Only update if we're not in the review modal
        if (!isReviewModalOpen) {
          setSelectedCardForReview(updatedCard);
        }
      }
    }
  }, [cards, isReviewModalOpen]);

  // Add more detailed logging when modal opens
  useEffect(() => {
    if (selectedCardForReview) {
      console.log("Modal opened with card state:", {
        id: selectedCardForReview.id,
        status: determineCardStatus(selectedCardForReview),
        fields: selectedCardForReview.fields,
        fieldKeys: Object.keys(selectedCardForReview.fields),
      });
    }
  }, [selectedCardForReview]);

  // Add an effect to update the image key when the selected card changes
  useEffect(() => {
    if (selectedCardForReview?.id) {
      imageKeyRef.current = `image-${selectedCardForReview.id}-${Date.now()}`;
      // imageUrlRef.current = selectedCardForReview.image_path || '';
    }
  }, [selectedCardForReview?.id]);

  // Table definition
  const columns = useMemo<ColumnDef<ProspectCard>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={table.getIsAllRowsSelected()}
              ref={(input) => {
                if (input) {
                  input.indeterminate = table.getIsSomeRowsSelected();
                }
              }}
              onChange={table.getToggleAllRowsSelectedHandler()}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
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
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
            />
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Date added",
        cell: ({ row }) => formatDateOrTimeAgo(row.original.createdAt),
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const card = row.original;
          const currentStatus = determineCardStatus(card);
          const exportedAt = card.exported_at;
          let displayText: string;
          if (currentStatus === "needs_human_review") {
            displayText = "Needs Review";
          } else if (currentStatus === "reviewed") {
            displayText = "Ready for Export";
          } else if (currentStatus === "exported") {
            displayText = "Exported";
          } else if (currentStatus === "archived") {
            displayText = "Archived";
          } else {
            displayText = currentStatus
              ? currentStatus.charAt(0).toUpperCase() +
                currentStatus.slice(1).replace(/_/g, " ")
              : "Unknown";
          }
          const getBadgeClasses = () => {
            switch (currentStatus) {
              case "needs_human_review":
                return "text-indigo-700 border border-indigo-200 bg-white rounded-full px-3 py-1";
              case "reviewed":
                return "text-blue-700 border border-blue-200 bg-white rounded-full px-3 py-1";
              case "exported":
                return "text-slate-600 border border-slate-200 bg-white rounded-full px-3 py-1";
              case "archived":
                return "text-gray-600 border border-gray-200 bg-white rounded-full px-3 py-1";
              default:
                return "text-gray-600 border border-gray-200 bg-white rounded-full px-3 py-1";
            }
          };
          if (currentStatus === "exported" && exportedAt) {
            return (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="text-slate-600 border border-slate-200 bg-white rounded-full px-3 py-1 text-xs font-medium">
                      Exported
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exported at {formatDateOrTimeAgo(exportedAt)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return (
            <div className="flex flex-col gap-1">
              <Badge className={getBadgeClasses()}>{displayText}</Badge>
            </div>
          );
        },
        enableSorting: true,
        sortDescFirst: true,
        sortingFn: (rowA, rowB) => {
          const getStatusValue = (row) => {
            const status = determineCardStatus(row.original);
            if (status === "reviewed") return 1; // Ready to Export
            if (status === "exported") return 0;
            return -1; // All others
          };
          return getStatusValue(rowA) - getStatusValue(rowB);
        },
      },
      ...reviewFieldOrder.map((fieldKey) => ({
        accessorKey: fieldKey,
        header: dataFieldsMap.get(fieldKey) || fieldKey.replace(/_/g, " "),
        accessorFn: (row) => row.fields?.[fieldKey]?.value ?? "",
        cell: ({ getValue, row }) => {
          const value = getValue();
          const fieldData = row.original.fields?.[fieldKey];
          const needsReview = fieldData?.requires_human_review === true;
          const isReviewed = fieldData?.reviewed === true;
          const reviewNotes = fieldData?.review_notes;
          const showIcon = needsReview;
          let formattedValue = value ?? "";
          if (fieldKey === "cell") formattedValue = formatPhoneNumber(value);
          if (fieldKey === "date_of_birth")
            formattedValue = formatBirthday(value);
          const tooltipContent =
            reviewNotes || (needsReview ? "Needs human review" : null);
          return (
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-1.5">
                {showIcon && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-400 flex-shrink-0 text-white text-[8px] font-bold leading-none">
                        !
                      </div>
                    </TooltipTrigger>
                    {tooltipContent && (
                      <TooltipContent side="top">
                        <p>{tooltipContent}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                )}
                <span>{formattedValue}</span>
              </div>
            </TooltipProvider>
          );
        },
        enableSorting: true,
      })),
      ...(selectedTab === "exported"
        ? [
            {
              accessorKey: "exported_at",
              header: "Exported at",
              cell: ({ row }) => formatDateOrTimeAgo(row.original.exported_at),
              enableSorting: true,
            },
          ]
        : []),
    ],
    [selectedTab, dataFieldsMap, reviewFieldOrder]
  );

  // Table instance
  const table = useReactTable({
    data: filteredCards,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Fields to show in the review panel
  const fieldsToShow = selectedCardForReview
    ? reviewFieldOrder.filter(
        (fieldKey) =>
          selectedCardForReview.fields[fieldKey] &&
          cardFieldPrefs?.[fieldKey] !== false
      )
    : [];

  // --- Row Selection and Card Actions ---
  const handleArchiveCard = () => {
    if (selectedCardForReview) {
      setIsArchiveConfirmOpen(true);
    }
  };

  const confirmArchiveAction = () => {
    if (selectedCardForReview) {
      handleArchiveSelected([selectedCardForReview.id]);
      setIsReviewModalOpen(false);
      setSelectedCardForReview(null);
    } else {
      const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
      if (selectedIds.length > 0) {
        handleArchiveSelected(selectedIds);
      } else {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to archive.",
          variant: "destructive",
        });
      }
    }
    setIsArchiveConfirmOpen(false);
  };

  // Replace handleExportToSlate with handleExportSelected
  const handleExportToSlate = handleExportSelected;

  // --- Zoom Functions ---
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.2, 2)), []);
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z / 1.2, 0.47)),
    []
  );

  // --- useEffect for hiding exported cards & sorting ---
  useEffect(() => {
    if (prevHideExported.current && !hideExported) {
      setSorting([{ id: "status", desc: true }]);
    }
    prevHideExported.current = hideExported;
  }, [hideExported]);

  // --- useEffect for event name ---
  useEffect(() => {
    setEventNameInput(selectedEvent?.name || "");
  }, [selectedEvent]);

  // --- useEffect for card field preferences ---
  useEffect(() => {
    async function fetchSettings() {
      if (!selectedEvent || !selectedEvent.school_id) return;
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const { data, error } = await supabase
        .from("settings")
        .select("preferences")
        .eq("user_id", user.id)
        .eq("school_id", selectedEvent.school_id)
        .single();
      if (!error && data?.preferences?.card_fields) {
        setCardFieldPrefs(data.preferences.card_fields);
      } else {
        setCardFieldPrefs(null);
      }
    }
    fetchSettings();
  }, [selectedEvent]);

  // --- useEffect for initializing form data ---
  useEffect(() => {
    if (selectedCardForReview && reviewFieldOrder) {
      const initialFormData: Record<string, string> = {};
      reviewFieldOrder.forEach((fieldKey) => {
        initialFormData[fieldKey] =
          selectedCardForReview.fields?.[fieldKey]?.value ?? "";
      });
      setFormData(initialFormData);
    } else {
      setFormData({});
    }
  }, [selectedCardForReview, reviewFieldOrder]);

  // --- useEffect for image URL ---
  useEffect(() => {
    async function updateImageUrl() {
      if (selectedCardForReview?.image_path) {
        const signedUrl = await getSignedImageUrl(
          selectedCardForReview.image_path
        );
        setImageUrlState(signedUrl);
      } else {
        setImageUrlState("");
      }
    }
    updateImageUrl();
  }, [selectedCardForReview?.image_path, getSignedImageUrl]);

  // --- useEffect for keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsReviewModalOpen(false);
        setSelectedCardForReview(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Replace openBulkArchiveDialog to just open the dialog
  const openBulkArchiveDialog = useCallback(() => {
    setIsArchiveConfirmOpen(true);
  }, []);

  // Restore missing event name editing handlers
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
      setSelectedEvent((ev) =>
        ev ? { ...ev, name: eventNameInput.trim() } : ev
      );
      fetchEvents();
    } catch (error) {
      setEventNameError(
        error instanceof Error ? error.message : "Failed to update event name"
      );
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update event name",
        variant: "destructive",
      });
    } finally {
      setEventNameLoading(false);
    }
  };

  // --- JSX ---
  useEffect(() => {
    console.log("Cards after fetch:", cards);
  }, [cards]);

  return (
    <ErrorBoundary>
      <div className="w-full p-4 md:p-8 relative pb-20">
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="mb-2 text-sm text-gray-500">
            <ol className="flex items-center space-x-1">
              <li className="flex items-center">
                <a href="/events" className="text-blue-600 hover:underline">
                  Events
                </a>
                <ChevronRight className="mx-1 w-3 h-3 text-gray-400" />
              </li>
              <li className="font-medium text-gray-900">
                {selectedEvent?.name}
              </li>
            </ol>
          </nav>
        </div>

        {/* Header Section */}
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <Card className="mb-6">
            <CardContent className="flex flex-col md:flex-row items-start justify-between gap-4 p-6">
              <div className="flex flex-col text-left w-full md:w-auto">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-left flex items-center gap-2">
                  {isEditingEventName ? (
                    <>
                      <input
                        className="border rounded px-2 py-1 text-lg font-semibold w-64 max-w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={eventNameInput}
                        onChange={(e) => setEventNameInput(e.target.value)}
                        disabled={eventNameLoading}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEventName();
                          if (e.key === "Escape") handleCancelEditEventName();
                        }}
                      />
                      <button
                        className="ml-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                        onClick={handleSaveEventName}
                        disabled={eventNameLoading || !eventNameInput.trim()}
                        aria-label="Save event name"
                      >
                        {eventNameLoading ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        className="ml-1 text-gray-500 hover:text-red-600"
                        onClick={handleCancelEditEventName}
                        disabled={eventNameLoading}
                        aria-label="Cancel edit"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedEvent ? selectedEvent.name : "All Events"}
                      </span>
                      <button
                        className="ml-1 text-gray-400 hover:text-blue-600"
                        onClick={handleEditEventName}
                        aria-label="Edit event name"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </h1>
                {eventNameError && (
                  <div className="text-sm text-red-600 mt-1">
                    {eventNameError}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 mt-2 md:mt-0">
                <Badge
                  variant="outline"
                  className="inline-flex items-center text-indigo-700 border-indigo-200 bg-indigo-50"
                >
                  <Info className="w-4 h-4 mr-1 text-indigo-500" />
                  Need Review: {getStatusCount("needs_human_review")}
                </Badge>
                <Badge
                  variant="outline"
                  className="inline-flex items-center text-green-700 border-green-200 bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                  Ready for Export: {getStatusCount("reviewed")}
                </Badge>
                <Badge
                  variant="outline"
                  className="inline-flex items-center text-slate-700 border-slate-200 bg-slate-50"
                >
                  <Download className="w-4 h-4 mr-1 text-slate-500" />
                  Exported: {getStatusCount("exported")}
                </Badge>
                <Badge
                  variant="outline"
                  className="inline-flex items-center text-gray-600 border-gray-200 bg-gray-50"
                >
                  <Archive className="w-4 h-4 mr-1 text-gray-500" />
                  Archived: {getStatusCount("archived")}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              {/* Tabs */}
              <div className="flex justify-between items-center mb-6 border-b">
                <div className="flex gap-6">
                  <button
                    onClick={() => setSelectedTab("needs_human_review")}
                    className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                      selectedTab === "needs_human_review"
                        ? "border-b-2 border-indigo-500 text-gray-900 font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Needs Review
                    <Badge
                      variant="outline"
                      className="ml-2 text-indigo-700 border-indigo-200 bg-white"
                    >
                      {getStatusCount("needs_human_review")}
                    </Badge>
                  </button>
                  <button
                    onClick={() => setSelectedTab("ready_to_export")}
                    className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                      selectedTab === "ready_to_export"
                        ? "border-b-2 border-indigo-500 text-gray-900 font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Ready to Export
                    <Badge
                      variant="outline"
                      className="ml-2 text-blue-700 border-blue-200 bg-white"
                    >
                      {getStatusCount("reviewed")}
                    </Badge>
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedTab("archived")}
                    className={`px-4 py-2.5 -mb-px flex items-center transition-colors ${
                      selectedTab === "archived"
                        ? "border-b-2 border-indigo-500 text-gray-900 font-semibold"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Archived
                    <Badge
                      variant="outline"
                      className="ml-2 text-gray-600 border-gray-200 bg-white"
                    >
                      {getStatusCount("archived")}
                    </Badge>
                  </button>
                </div>
              </div>
              <CardTable
                table={table}
                rowSelection={rowSelection}
                handleRowClick={handleRowClick}
                selectedTab={selectedTab}
                filteredCards={filteredCards}
                paginatedCards={paginatedCards}
                currentPage={currentPage}
                totalPages={totalPages}
                setCurrentPage={setCurrentPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                getStatusCount={getStatusCount}
                hideExported={hideExported}
                setHideExported={setHideExported}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                debouncedSearch={debouncedSearch}
                isUploading={isUploading}
                handleExportSelected={handleExportSelected}
                handleArchiveSelected={handleArchiveSelected}
                handleMoveSelected={() => {
                  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
                  handleMoveSelected(selectedIds);
                }}
                handleDeleteSelected={() => {
                  const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
                  handleDeleteSelected(selectedIds);
                }}
                setIsArchiveConfirmOpen={openBulkArchiveDialog}
                setIsMoveConfirmOpen={setIsMoveConfirmOpen}
                setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
                dataFieldsMap={dataFieldsMap}
                reviewFieldOrder={reviewFieldOrder}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleCaptureCard={handleCaptureCard}
                handleImportFile={handleImportFile}
                handleManualEntry={handleManualEntry}
                handleExportToSlate={handleExportToSlate}
              />
            </CardContent>
          </Card>
        </div>

        {/* Review Modal Dialog */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-7xl w-[calc(100%-4rem)] h-[calc(100vh-8rem)] rounded-lg overflow-hidden flex flex-col p-0">
            <DialogHeader className="flex-shrink-0">
              <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b">
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-semibold">
                    Review Card Data
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    Review and edit the extracted information from the card
                    image.
                  </DialogDescription>
                </div>
                <div className="flex flex-col items-end space-y-1">
                  <div className="flex items-center gap-1 text-sm font-medium transition-all duration-200">
                    {reviewProgress.allReviewed ? (
                      <div className="flex items-center gap-1 text-green-600 animate-in fade-in duration-300">
                        <CheckCircle2 className="h-5 w-5" />
                        <span>All fields reviewed!</span>
                      </div>
                    ) : (
                      <span className="text-primary-600">
                        {reviewProgress.reviewedCount} /{" "}
                        {reviewProgress.totalFields} fields reviewed
                      </span>
                    )}
                  </div>
                  {!reviewProgress.allReviewed && (
                    <div className="transition-all duration-300">
                      <Progress
                        className="w-32 h-1"
                        value={
                          (reviewProgress.reviewedCount /
                            reviewProgress.totalFields) *
                          100
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Image Panel - removed unnecessary div wrapper */}
                <ReviewImagePanel
                  imagePath={selectedCardForReview?.image_path || ""}
                  zoom={zoom}
                  zoomIn={zoomIn}
                  zoomOut={zoomOut}
                  selectedCardId={selectedCardForReview?.id}
                />
                {/* Form Fields Panel */}
                <ReviewForm
                  selectedCardForReview={selectedCardForReview}
                  fieldsToShow={fieldsToShow}
                  formData={formData}
                  handleFormChange={handleFormChange}
                  handleFieldReview={handleFieldReview}
                  selectedTab={selectedTab}
                  dataFieldsMap={dataFieldsMap}
                />
              </div>
            </div>
            <DialogFooter className="px-6 py-3 border-t flex-shrink-0">
              <div className="flex gap-2 w-full justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchiveCard}
                  disabled={!selectedCardForReview?.id}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                >
                  Archive Card
                </Button>
                <Button
                  type="button"
                  onClick={handleReviewSave}
                  disabled={!selectedCardForReview?.id || isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <ArchiveConfirmDialog
          open={isArchiveConfirmOpen}
          onOpenChange={setIsArchiveConfirmOpen}
          onConfirm={confirmArchiveAction}
          count={selectedCardForReview ? 1 : Object.keys(rowSelection).length}
          singleCard={!!selectedCardForReview}
        />

        {/* Move Confirmation Dialog */}
        <MoveConfirmDialog
          open={isMoveConfirmOpen}
          onOpenChange={setIsMoveConfirmOpen}
          onConfirm={() => {
            const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
            handleMoveSelected(selectedIds);
          }}
          count={Object.keys(rowSelection).length}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={() => {
            const selectedIds = Object.keys(rowSelection).filter(id => rowSelection[id]);
            handleDeleteSelected(selectedIds);
          }}
          count={Object.keys(rowSelection).length}
        />

        {/* Add the Manual Entry Modal */}
        <ManualEntryModal
          open={isManualEntryModalOpen}
          onOpenChange={setIsManualEntryModalOpen}
          form={manualEntryForm}
          onChange={handleManualEntryChange}
          onSubmit={handleManualEntrySubmit}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
