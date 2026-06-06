// src/components/Dashboard.tsx (Reverted State - After useCards, Before useCardTable)

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { logger } from '@/utils/logger';
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
import { SuggestedFields } from "@/components/SuggestedFields";
import { useCardsOverride } from "@/hooks/useCardsOverride";
import { useSchool } from "@/hooks/useSchool";
import { useEvent } from "@/hooks/useEvent";
import { useAuth } from "@/contexts/AuthContext";
// Utilities and Types
import {
  formatPhoneNumber,
  formatBirthday,
  formatDateOrTimeAgo,
  escapeCsvValue,
  normalizeFieldValue,
  cn,
} from "@/lib/utils";
import type { ProspectCard } from "@/types/card";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Event } from "@/types/event";
import { determineCardStatus } from "@/lib/cardUtils";
import { useCardUpload } from "@/hooks/useCardUpload";
import { EventService } from "@/services/EventService";
import { SchoolService } from "@/services/SchoolService";
import { getSignedImageUrl } from "@/lib/imageUtils";
import ReviewImagePanel from "@/components/review/ReviewImagePanel";
import ReviewForm from "@/components/review/ReviewForm";
import ArchiveConfirmDialog from "@/components/modals/ArchiveConfirmDialog";
import MoveConfirmDialog from "@/components/modals/MoveConfirmDialog";
import DeleteConfirmDialog from "@/components/modals/DeleteConfirmDialog";
import ManualEntryModal from "@/components/modals/ManualEntryModal";
import CardTable from "@/components/cards/CardTable";
import { StudentCell } from "@/components/cards/StudentCell";
import { FilterPillTabs, type FilterPillTab } from "@/components/status/FilterPillTabs";
import { useEventName } from "@/hooks/useEventName";
import { useCardReviewModal } from "@/hooks/useCardReviewModal";
import { useCardTableActions } from "@/hooks/useCardTableActions";
import { IntegrationsService } from "@/services/IntegrationsService";
import { useManualEntryModal } from "@/hooks/useManualEntryModal";
import { useCardUploadActions } from "@/hooks/useCardUploadActions";
import { useZoom } from "@/hooks/useZoom";
import { useStatusTabs } from "@/hooks/useStatusTabs";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useBulkActions } from "@/hooks/useBulkActions";
import { toast } from "@/lib/toast"; // Updated import
import CameraCapture from "@/components/card-scanner/CameraCapture";
import { useLoader } from "@/contexts/LoaderContext";
import { EventHeader } from "./EventDetails/EventHeader";
import { SignupSheetUpload } from "@/components/SignupSheetUpload";
import { SignupSheetProcessing } from "@/components/SignupSheetProcessing";
import { CreateEventModal } from "@/components/CreateEventModal";

// Name fields are consolidated into the Student cell, so they are not
// rendered as their own table columns.
const NAME_FIELD_KEYS = new Set([
  "first_name",
  "last_name",
  "preferred_first_name",
  "name",
]);

// === Component Definition ===
const Dashboard = () => {
  // --- Hooks ---
  const { toast: oldToast } = useToast(); // Keep for hooks compatibility
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { profile, session } = useAuth();
  const {
    event: selectedEvent,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useEvent(eventId);
  const { school, loading: schoolLoading, refetch: refetchSchool } = useSchool(profile?.school_id);
  
  // Debug school loading
  useEffect(() => {
    logger.log('🔍 School loading debug:', {
      schoolLoading,
      hasSchool: !!school,
      schoolId: profile?.school_id,
      schoolName: school?.name,
      cardFieldsLength: school?.card_fields?.length
    });
  }, [school, schoolLoading, profile?.school_id]);
  const {
    cards,
    fetchCards,
    setReviewModalState,
    isLoading: cardsLoading,
  } = useCardsOverride(selectedEvent?.id);
  const { uploadCard } = useCardUpload();

  // Global loader for full page when events are loading
  const { showFullPageLoader, hideFullPageLoader } = useLoader();

  // Status Tabs
  const { selectedTab, setSelectedTab, getStatusCount } = useStatusTabs(
    cards,
    determineCardStatus
  );

  // Event Name
  const eventName = useEventName(selectedEvent, refetchEvent);

  // --- State Declarations (consolidated here) ---
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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
  const [zoom, setZoom] = useState(0.85);
  const [imageUrlState, setImageUrlState] = useState("");

  // Event editing modal
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);

  // Settings/preferences
  const [cardFieldPrefs, setCardFieldPrefs] = useState<Record<
    string,
    boolean
  > | null>(null);

  // Use shared school hook (already defined above with profile?.school_id)

  // Extract cardFields from school data first (moved up for dependency)
  const cardFields = useMemo(() => {
    logger.log('🔍 Debug cardFields:', {
      hasSchool: !!school,
      cardFieldsRaw: school?.card_fields,
      cardFieldsLength: school?.card_fields?.length || 0
    });
    
    if (!school?.card_fields) {
      logger.log('🚨 No school or card_fields found');
      return [];
    }

    // Use the SchoolService transformation to apply proper field type inference
    const transformed = SchoolService.transformCardFieldsForUI(school.card_fields);
    logger.log('🔍 Transformed cardFields:', transformed);
    return transformed;
  }, [school?.card_fields]);

  // Base field order from school configuration (without dynamic card data)
  const baseReviewFieldOrder: string[] = useMemo(() => {
    // Get fields from school configuration
    const configuredFields = cardFields
      .filter((field) => field.visible)
      .map((field) => field.key);
    
    // Fields to exclude (duplicates or legacy fields that should never show)
    const fieldsToExclude = new Set([
      'name', // Hide combined name when split fields are available
      'name_of_high_school', // Duplicate of high_school
      'name_of_high_school_college', // Duplicate of high_school
      'name_of_high_school_/college', // Duplicate of high_school (variant with slash)
      'high_school_name', // Duplicate of high_school
      'name_of_high_school_/_college', // Duplicate of high_school
      'city_state', // Duplicate when separate city/state exist
      'city/state', // Duplicate when separate city/state exist
      'entry_term_year', // Redundant with entry_term
      'major_academic_program_of_interest', // Redundant with major/mapped_major
    ]);

    // Use only the configured fields from the school's card_fields configuration
    // No hardcoded canonical fields - just use what the school has configured
    return configuredFields.filter(field => !fieldsToExclude.has(field));
  }, [cardFields]);
  
  // Use base field order for hook initialization (dynamic enhancement happens in the hook)
  const reviewFieldOrder: string[] = baseReviewFieldOrder;

  // Dynamic field mapping using labels from school configuration + canonical field labels
  const dataFieldsMap = useMemo(() => {
    const map = new Map<string, string>();
    
    // Add labels from school configuration
    cardFields.forEach((field) => {
      const label = (field as any).label || field.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      map.set(field.key, label);
    });
    
    // Add canonical field labels for fields that might not be in school config
    const canonicalLabels = {
      'first_name': 'First Name',
      'last_name': 'Last Name', 
      'preferred_first_name': 'Preferred Name',
      'date_of_birth': 'Birthday',
      'email': 'Email',
      'cell': 'Phone Number',
      'permission_to_text': 'Permission to Text',
      'address': 'Address',
      'city': 'City',
      'state': 'State', 
      'zip_code': 'Zip Code',
      'high_school': 'High School',
      'class_rank': 'Class Rank',
      'students_in_class': 'Students in Class',
      'gpa': 'GPA',
      'student_type': 'Student Type',
      'entry_term': 'Entry Term',
      'major': 'Major',
      'mapped_major': 'Mapped Major'
    };
    
    // Add canonical labels if not already present
    Object.entries(canonicalLabels).forEach(([key, label]) => {
      if (!map.has(key)) {
        map.set(key, label);
      }
    });
    
    return map;
  }, [cardFields]);

  // --- Refs ---
  const imageUrlRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevHideExported = useRef(hideExported);
  const processingRefreshRef = useRef<((force?: boolean) => void) | null>(null);

  // --- Custom Hooks ---
  const zoomState = useZoom();

  // Callback to refresh processing status after upload
  const handleUploadComplete = useCallback(() => {
    processingRefreshRef.current?.(true);
    setTimeout(() => processingRefreshRef.current?.(true), 1500);
  }, []);

  const {
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    handleCaptureCard,
    handleImageCaptured,
    handleImportFile,
    handleFileSelect,
    startUploadProcess,
    isCameraModalOpen,
    setIsCameraModalOpen,
  } = useCardUploadActions(selectedEvent, uploadCard, fetchCards, fileInputRef, handleUploadComplete);
  const {
    isReviewModalOpen,
    setIsReviewModalOpen,
    selectedCardForReview,
    setSelectedCardForReview,
    formData,
    setFormData,
    handleFieldReview,
    handleReviewSave,
    handleFormChange,
    handleFormBatchChange,
    localCardRef,
    selectedCardIdRef,
    imageKeyRef,
    fieldsWithToastRef,
    isSaving,
    setIsSaving,
  } = useCardReviewModal(cards, baseReviewFieldOrder, fetchCards, dataFieldsMap);

  const {
    isManualEntryModalOpen,
    setIsManualEntryModalOpen,
    manualEntryForm,
    setManualEntryForm,
    handleManualEntry,
    handleManualEntrySubmit,
    handleManualEntryChange,
  } = useManualEntryModal(selectedEvent, fetchCards, cardFields);

  // Signup sheet modal state
  const [isSignupSheetModalOpen, setIsSignupSheetModalOpen] = useState(false);
  const [isSignupSheetProcessing, setIsSignupSheetProcessing] = useState(false);
  
  // Handler for signup sheet upload
  const handleSignupSheet = useCallback(() => {
    setIsSignupSheetModalOpen(true);
  }, []);

  // Handler for signup sheet upload completion
  const handleSignupSheetComplete = useCallback(async () => {
    setIsSignupSheetModalOpen(false);
    setIsSignupSheetProcessing(true);
    
    // Wait a bit then refresh and hide processing
    setTimeout(async () => {
      await fetchCards(); // Refresh cards after upload
      setIsSignupSheetProcessing(false);
    }, 2000); // Show processing for 2 seconds minimum
  }, [fetchCards]);

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

  // ✅ REMOVED: Heavy debug logging causing unnecessary re-renders
  // useEffect(() => {
  //   if (cards) {
  //     logger.log("Cards loaded:", cards.length);
  //   }
  // }, [cards]);

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
      if (
        selectedTab === "ready_to_export" &&
        hideExported &&
        currentStatus === "exported"
      ) {
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
        case "needs_review":
          return currentStatus === "needs_review";
        case "exported":
          return currentStatus === "exported";
        case "archived":
          return card.review_status === "archived";
        case "ai_failed":
          return card.review_status === "ai_failed";
        default:
          return true;
      }
    });
  }, [cards, selectedTab, selectedEvent, hideExported, debouncedSearchQuery]);

  // Now that filteredCards is defined, we can use bulk selection hooks
  const bulkSelection = useBulkSelection(filteredCards);
  const bulkActions = useBulkActions(fetchCards, bulkSelection.clearSelection);

  // Now that filteredCards is defined, we can use it in useCardTableActions
  const {
    handleExportSelected,
    handleExportToSlate,
    handleMoveSelected,
    handleArchiveSelected,
    handleDeleteSelected,
  } = useCardTableActions(
    filteredCards,
    fetchCards,
    oldToast,
    selectedEvent,
    dataFieldsMap
  );

  // Whether this school has Slate (SFTP) export configured — drives the
  // CSV-only button vs CSV/Slate dropdown on the header Export action.
  const [hasSlateIntegration, setHasSlateIntegration] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const checkSlate = async () => {
      if (!selectedEvent?.school_id) {
        setHasSlateIntegration(false);
        return;
      }
      try {
        const sftp = await IntegrationsService.getSftpConfig(selectedEvent.school_id);
        if (!cancelled) setHasSlateIntegration(!!(sftp && sftp.host && sftp.username));
      } catch {
        if (!cancelled) setHasSlateIntegration(false);
      }
    };
    checkSlate();
    return () => {
      cancelled = true;
    };
  }, [selectedEvent?.school_id]);

  // Header Export actions operate on the currently selected rows.
  const handleHeaderExportCSV = useCallback(() => {
    if (bulkSelection.selectedCount === 0) {
      toast.required("at least one card selection");
      return;
    }
    handleExportSelected(bulkSelection.selectedIds);
  }, [bulkSelection.selectedCount, bulkSelection.selectedIds, handleExportSelected]);

  const handleHeaderExportSlate = useCallback(() => {
    if (bulkSelection.selectedCount === 0) {
      toast.required("at least one card selection");
      return;
    }
    handleExportToSlate(bulkSelection.selectedIds);
  }, [bulkSelection.selectedCount, bulkSelection.selectedIds, handleExportToSlate]);

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


  // Effect to control full page loader for event loading
  useEffect(() => {
    if (eventLoading) {
      showFullPageLoader("Loading event...");
    } else {
      hideFullPageLoader();
    }
  }, [eventLoading, showFullPageLoader, hideFullPageLoader]);

  // Effect to handle missing eventId in URL
  useEffect(() => {
    if (!eventId) {
      // No eventId in URL, redirect to home or show error
      navigate('/events');
    }
  }, [eventId, navigate]);

  // ✅ REMOVED: useCardsOverride already handles event changes
  // useEffect(() => {
  //   fetchCards();
  // }, [selectedEvent]);

  // Add this after filteredCards is defined and before JSX return
  useEffect(() => {
    setRowSelection((prev) => {
      const validIds = new Set(paginatedCards.map((card) => card.id));
      const next = Object.fromEntries(
        Object.entries(prev).filter(([id]) => validIds.has(id))
      );
      // Only update if changed
      return Object.keys(next).length === Object.keys(prev).length
        ? prev
        : next;
    });
  }, [paginatedCards]);

  // ✅ REMOVED: Heavy debug logging causing performance issues
  // useEffect(() => {
  //   // Debug row selection changes
  //   if (process.env.NODE_ENV === 'development') {
  //     logger.log("Row selection changed:", Object.keys(rowSelection).length);
  //   }
  // }, [rowSelection]);

  // --- Callbacks & Effects ---
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
        initialFormData[fieldKey] = fieldData.value || "";
      });
      setFormData(initialFormData);
      setIsReviewModalOpen(true);
      setReviewModalState(true);
    },
    [
      setReviewModalState,
      localCardRef,
      setSelectedCardForReview,
      selectedCardIdRef,
      imageKeyRef,
      setFormData,
      setIsReviewModalOpen,
    ]
  );

  // Reset the fields with toast when the modal is closed
  useEffect(() => {
    if (!isReviewModalOpen) {
      fieldsWithToastRef.current.clear();
    }
  }, [isReviewModalOpen, fieldsWithToastRef]);

  // Reset zoom level when modal is closed
  useEffect(() => {
    if (!isReviewModalOpen) {
      setZoom(0.85); // Reset to default zoom level
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
  }, [cards, isReviewModalOpen, selectedCardIdRef, setSelectedCardForReview]);

  // ✅ REMOVED: Debug logging causing re-renders
  // useEffect(() => {
  //   if (process.env.NODE_ENV === 'development' && selectedCardForReview) {
  //     logger.log("Card selected for review:", selectedCardForReview.id);
  //   }
  // }, [selectedCardForReview]);

  // Add an effect to update the image key when the selected card changes
  useEffect(() => {
    if (selectedCardForReview?.id) {
      imageKeyRef.current = `image-${selectedCardForReview.id}-${Date.now()}`;
      // imageUrlRef.current = selectedCardForReview.image_path || '';
    }
  }, [selectedCardForReview?.id, imageKeyRef]);

  // Field columns exclude the name fields (now consolidated into the Student cell)
  const columnFieldOrder = useMemo(
    () => reviewFieldOrder.filter((key) => !NAME_FIELD_KEYS.has(key)),
    [reviewFieldOrder]
  );

  // Table definition
  const columns = useMemo<ColumnDef<ProspectCard>[]>(
    () => [
      {
        id: "select",
        meta: {
          stickyClass: "sticky left-0",
          cellClass: "text-center",
          headClass: "text-center",
        },
        header: ({ table }) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={bulkSelection.isAllSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = bulkSelection.isSomeSelected;
                }
              }}
              onChange={bulkSelection.toggleAll}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={bulkSelection.isSelected(row.original.document_id)}
              onChange={() =>
                bulkSelection.toggleSelection(row.original.document_id)
              }
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 transition-colors hover:border-primary-500 focus:ring-2 focus:ring-primary-600 focus:ring-offset-0"
            />
          </div>
        ),
      },
      {
        id: "student",
        header: "Student",
        meta: { stickyClass: "sticky left-12 border-r border-border" },
        cell: ({ row }) => <StudentCell card={row.original} />,
        enableSorting: false,
      },
      ...columnFieldOrder.map((fieldKey) => ({
        accessorKey: fieldKey,
        header: dataFieldsMap.get(fieldKey) || fieldKey.replace(/_/g, " "),
        accessorFn: (row) => row.fields?.[fieldKey]?.value ?? "",
        cell: ({ getValue, row }) => {
          const value = getValue();
          const fieldData = row.original.fields?.[fieldKey];
          const isReviewed = fieldData?.reviewed === true;
          const isSignupSheet = row.original.upload_type === "signup_sheet";
          // Flagged = AI unsure, not yet resolved, and not a signup-sheet import
          const needsReview =
            fieldData?.requires_human_review === true &&
            !isReviewed &&
            !isSignupSheet;
          const reviewNotes = fieldData?.review_notes;

          // Ensure value is always a string - handle objects gracefully
          let stringValue = "";
          if (typeof value === "string") {
            stringValue = value;
          } else if (typeof value === "object" && value !== null) {
            // If it's an object, try to extract a meaningful string
            if (value.formatted_address) {
              stringValue = value.formatted_address;
            } else if (value.city && value.state) {
              stringValue = `${value.city}, ${value.state}`;
            } else {
              stringValue = JSON.stringify(value);
            }
          } else {
            stringValue = String(value ?? "");
          }

          let formattedValue = normalizeFieldValue(stringValue, fieldKey);
          if (fieldKey === "cell") formattedValue = formatPhoneNumber(formattedValue);
          if (fieldKey === "date_of_birth")
            formattedValue = formatBirthday(formattedValue);
          const numeric = fieldKey === "cell" || fieldKey === "date_of_birth";

          // Flagged cells get an amber tint that fills the cell (negative
          // margins cancel the TableCell padding, then re-add it).
          return (
            <span
              className={cn(
                "block -mx-2 -my-3 px-2 py-3 sm:-mx-4 sm:px-4",
                numeric && "tabular-nums",
                // Only tint flagged cells that actually have a value — an empty
                // amber bar looks like a stray highlight.
                needsReview &&
                  Boolean(formattedValue) &&
                  "bg-status-review-soft font-semibold text-status-review-ink"
              )}
              title={needsReview ? reviewNotes || "Needs review" : undefined}
            >
              {formattedValue}
            </span>
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
    [selectedTab, dataFieldsMap, columnFieldOrder, bulkSelection]
  );

  // Table instance
  const table = useReactTable({
    data: paginatedCards,
    columns,
    state: {
      sorting,
    },
    enableRowSelection: false, // Disable built-in row selection
    getRowId: (row) => row.document_id, // Use document_id as the row ID
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Fields to show in the review panel with dynamic canonical field support
  const fieldsToShow = useMemo(() => {
    if (!selectedCardForReview) return [];
    
    logger.log('🔍 Debug fieldsToShow:', {
      hasSelectedCard: !!selectedCardForReview,
      cardFields: cardFields,
      cardFieldsCount: cardFields.length,
      schoolData: school,
      hasSchoolCardFields: !!school?.card_fields
    });
    
    // Fields to exclude (duplicates or legacy fields)
    const fieldsToExclude = new Set([
      'name', // Hide combined name when split fields are available
      'name_of_high_school', // Duplicate of high_school
      'name_of_high_school_college', // Duplicate of high_school
      'name_of_high_school_/college', // Duplicate of high_school (variant with slash)
      'high_school_name', // Duplicate of high_school
      'name_of_high_school_/_college', // Duplicate of high_school
      'city_state', // Duplicate when separate city/state exist
      'city/state', // Duplicate when separate city/state exist
      'entry_term_year', // Redundant with entry_term
      'major_academic_program_of_interest', // Redundant with major/mapped_major
    ]);
    
    // Use only the configured fields from the school's card_fields configuration
    // Don't add any fields just because they exist in card data
    const result = cardFields
      .filter((f) => f.visible && !fieldsToExclude.has(f.key))
      .map((f) => f.key);
    
    logger.log('🔍 fieldsToShow result:', result);
    return result;
  }, [cardFields, selectedCardForReview, school]);

  // --- Row Selection and Card Actions ---
  const handleArchiveCard = () => {
    if (selectedCardForReview) {
      setIsArchiveConfirmOpen(true);
    }
  };

  const confirmArchiveAction = () => {
    if (selectedCardForReview) {
      // Archive the single card from the review modal
      handleArchiveSelected([selectedCardForReview.document_id]);
      setIsReviewModalOpen(false);
    } else {
      // Archive multiple selected cards from the table
      const selectedIds = Object.keys(rowSelection).filter(
        (id) => rowSelection[id]
      );
      if (selectedIds.length > 0) {
        handleArchiveSelected(selectedIds);
      } else {
        toast.required("at least one card selection");
      }
    }
    setIsArchiveConfirmOpen(false);
  };

  // --- Zoom Functions ---
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.2, 3)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.2, 0.3)), []);

  // --- Event Editing ---
  const handleEditEvent = useCallback(() => {
    setIsEditEventModalOpen(true);
  }, []);

  const handleEventUpdated = useCallback(async () => {
    logger.log("Refetching event data after update...");
    await refetchEvent();
    logger.log("Event data refetched successfully");
  }, [refetchEvent]);

  // --- useEffect for hiding exported cards & sorting ---
  useEffect(() => {
    if (prevHideExported.current && !hideExported) {
      setSorting([{ id: "status", desc: true }]);
    }
    prevHideExported.current = hideExported;
  }, [hideExported]);

  // --- useEffect for card field preferences ---
  // ✅ OPTIMIZED: Use existing school data instead of duplicate API call
  useEffect(() => {
    if (!school?.card_fields) {
      setCardFieldPrefs(null);
      return;
    }

    // Transform the card fields to the expected format
    const transformedPrefs: Record<string, boolean> = {};

    if (Array.isArray(school.card_fields)) {
      // Handle array format - use transformCardFieldsForUI to get proper CardField format
      const transformedFields = SchoolService.transformCardFieldsForUI(school.card_fields);
      transformedFields.forEach((field) => {
        transformedPrefs[field.key] = field.visible;
      });
    } else if (typeof school.card_fields === "object") {
      // Handle object format - use transformCardFieldsForUI to get proper CardField format
      const transformedFields = SchoolService.transformCardFieldsForUI(school.card_fields);
      transformedFields.forEach((field) => {
        transformedPrefs[field.key] = field.visible;
      });
    }

    setCardFieldPrefs(transformedPrefs);
  }, [school?.card_fields]); // ✅ Depend only on school data, not selectedEvent

  // --- useEffect for initializing form data ---
  useEffect(() => {
    if (selectedCardForReview && reviewFieldOrder) {
      const initialFormData: Record<string, string> = {};
      reviewFieldOrder.forEach((fieldKey) => {
        let fieldValue = selectedCardForReview.fields?.[fieldKey]?.value ?? "";
        
        // Fallback: if city or state fields are empty but city_state exists, parse it
        if ((fieldKey === "city" || fieldKey === "state") && !fieldValue) {
          const cityStateValue = selectedCardForReview.fields?.city_state?.value;
          if (cityStateValue && typeof cityStateValue === "string") {
            const match = cityStateValue.match(/^([^,]+),\s*([A-Z]{2})$/);
            if (match) {
              if (fieldKey === "city") {
                fieldValue = match[1].trim();
              } else if (fieldKey === "state") {
                fieldValue = match[2].trim();
              }
            }
          }
        }
        
        initialFormData[fieldKey] = fieldValue;
      });
      setFormData(initialFormData);
    } else {
      setFormData({});
    }
  }, [selectedCardForReview, reviewFieldOrder, setFormData]);

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
  }, [selectedCardForReview?.image_path]);

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
  }, [setIsReviewModalOpen, setSelectedCardForReview]);

  // Replace openBulkArchiveDialog to just open the dialog
  const openBulkArchiveDialog = useCallback(() => {
    setIsArchiveConfirmOpen(true);
  }, []);

  // Check if there are any cards that need retry
  const needsRetryCount = getStatusCount("ai_failed");
  const showNeedsRetryTab = needsRetryCount > 0;

  // Auto-switch away from ai_failed tab if no cards need retry
  useEffect(() => {
    if (selectedTab === "ai_failed" && needsRetryCount === 0) {
      setSelectedTab("needs_review");
    }
  }, [selectedTab, needsRetryCount, setSelectedTab]);

  // ✅ REMOVED: Debug logging
  // useEffect(() => {
  //   logger.log("Cards after fetch:", cards);
  // }, [cards]);

  // --- State Declarations (consolidated here) ---
  const [majorsList, setMajorsList] = useState<string[]>([]);
  const [loadingMajors, setLoadingMajors] = useState(false);

  // --- Dynamic viewport zoom control for mobile ---
  // Disables zoom when review modal is open to prevent scroll/zoom conflicts
  useEffect(() => {
    if (isReviewModalOpen) {
      const viewport = document.querySelector('meta[name="viewport"]');
      const originalContent = viewport?.getAttribute('content') || 'width=device-width, initial-scale=1.0';

      // Disable zoom while modal is open
      viewport?.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');

      return () => {
        // Restore original viewport on cleanup
        viewport?.setAttribute('content', originalContent);
      };
    }
  }, [isReviewModalOpen]);

  // --- Fetch majors for mapped_major dropdown ---
  // ✅ OPTIMIZED: Memoize school_id and fetch only when needed
  const schoolIdForMajors = selectedEvent?.school_id;
  useEffect(() => {
    async function fetchMajors() {
      if (!schoolIdForMajors) return;
      setLoadingMajors(true);
      try {
        const majors = await SchoolService.getMajors(schoolIdForMajors);
        setMajorsList(majors || []);
      } catch (error) {
        setMajorsList([]);
        toast.error("Failed to load majors");
      } finally {
        setLoadingMajors(false);
      }
    }
    // Only fetch if review modal is open and majors are enabled
    if (
      isReviewModalOpen &&
      cardFieldPrefs?.major !== false &&
      schoolIdForMajors
    ) {
      fetchMajors();
    }
  }, [isReviewModalOpen, schoolIdForMajors, cardFieldPrefs?.major]); // ✅ More specific dependencies

  return (
    <ErrorBoundary>
      <div className="w-full p-2 sm:p-4 md:p-8 relative pb-20">
        <EventHeader
          selectedEvent={selectedEvent}
          getStatusCount={getStatusCount}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          setHideExported={setHideExported}
          hideExported={hideExported}
          onEditEvent={handleEditEvent}
          onRefreshCards={fetchCards}
          processingRefreshRef={processingRefreshRef}
          selectedCount={bulkSelection.selectedCount}
          hasSlateIntegration={hasSlateIntegration}
          onExportCSV={handleHeaderExportCSV}
          onExportSlate={handleHeaderExportSlate}
        />

        {/* Main Content - Mobile Responsive */}
        <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
          {/* Signup Sheet Processing Indicator */}
          <SignupSheetProcessing show={isSignupSheetProcessing} />
          
          <Card className="overflow-hidden rounded-[18px]">
            <CardContent className="p-3 sm:p-6">
              {/* Status filter pills */}
              <div className="mb-6">
                <FilterPillTabs
                  value={selectedTab}
                  onChange={(val) => {
                    setSelectedTab(val);
                    if (val === "ready_to_export") setHideExported(true);
                  }}
                  tabs={
                    [
                      {
                        value: "needs_review",
                        label: "Needs Review",
                        tone: "review",
                        count: getStatusCount("needs_review"),
                      },
                      {
                        value: "ready_to_export",
                        label: "Ready to Export",
                        tone: "ready",
                        count: getStatusCount("reviewed"),
                      },
                      ...(showNeedsRetryTab
                        ? [
                            {
                              value: "ai_failed",
                              label: "Needs Retry",
                              tone: "review" as const,
                              count: needsRetryCount,
                            },
                          ]
                        : []),
                      {
                        value: "archived",
                        label: "Archived",
                        tone: "archived",
                        count: getStatusCount("archived"),
                      },
                    ] as FilterPillTab[]
                  }
                />
              </div>
              <CardTable
                table={table}
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
                selectedEvent={selectedEvent}
                dataFieldsMap={dataFieldsMap}
                reviewFieldOrder={reviewFieldOrder}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                handleCaptureCard={handleCaptureCard}
                handleImportFile={handleImportFile}
                handleSignupSheet={handleSignupSheet}
                handleManualEntry={handleManualEntry}
                fetchCards={fetchCards}
                bulkSelection={bulkSelection}
                isLoading={cardsLoading}
                school={school} // Add school data for feature flags
              />
            </CardContent>
          </Card>
        </div>

        {/* Review Modal Dialog */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="fixed inset-x-0 bottom-0 top-auto left-0 translate-x-0 translate-y-0 w-full max-w-full h-[92dvh] rounded-t-2xl rounded-b-none border-x-0 border-b-0 sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-7xl sm:w-[calc(100%-2rem)] md:w-[calc(100%-4rem)] sm:h-[calc(100dvh-4rem)] md:h-[calc(100dvh-8rem)] sm:rounded-lg sm:border overflow-hidden flex flex-col p-0">
            <DialogHeader className="flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b gap-3 sm:gap-0">
                <div className="space-y-1">
                  <DialogTitle className="text-lg sm:text-xl md:text-2xl font-semibold">
                    Review Card Data
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-gray-500">
                    Review and edit the extracted information from the card
                    image.
                  </DialogDescription>
                </div>
                <div className="flex items-center w-full sm:w-auto sm:justify-end">
                  {(() => {
                    const attentionCount = Math.max(
                      0,
                      reviewProgress.totalFields - reviewProgress.reviewedCount
                    );
                    return attentionCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-status-review-border bg-status-review-soft px-3 py-1 text-xs sm:text-sm font-semibold text-status-review-ink animate-in fade-in duration-300">
                        <Info className="h-4 w-4" />
                        {attentionCount} field{attentionCount === 1 ? "" : "s"} need
                        attention
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-status-ready-border bg-status-ready-soft px-3 py-1 text-xs sm:text-sm font-semibold text-status-ready-ink animate-in fade-in duration-300">
                        <CheckCircle className="h-4 w-4" />
                        All fields look good
                      </span>
                    );
                  })()}
                </div>
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 overscroll-contain">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 min-h-0 px-3 sm:px-6 pb-4">
                {/* Image Panel - Mobile: Full width with height constraint, Desktop: Half width */}
                <div className="min-w-0 overflow-x-hidden max-h-[40dvh] lg:max-h-none">
                  <ReviewImagePanel
                    imagePath={(() => {
                      // Always use original image - trimming has been removed from pipeline
                      const originalPath = selectedCardForReview?.image_path;
                      const finalPath = originalPath || "";
                      // Debug logging removed for production
                      return finalPath;
                    })()}
                    zoom={zoom}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    selectedCardId={selectedCardForReview?.id}
                  />
                </div>
                {/* Form Fields Panel - Mobile: Full width, Desktop: Half width */}
                <div className="min-w-0 overflow-x-hidden">
                  {school?.id &&
                  school?.suggested_card_fields?.length &&
                  selectedCardForReview?.fields ? (
                    <div className="mb-3">
                      <SuggestedFields
                        schoolId={school.id}
                        suggestions={school.suggested_card_fields}
                        onChange={refetchSchool}
                        variant="banner"
                        filterKeys={Object.keys(selectedCardForReview.fields)}
                      />
                    </div>
                  ) : null}
                  <ReviewForm
                    selectedCardForReview={selectedCardForReview}
                    fieldsToShow={fieldsToShow}
                    formData={formData}
                    handleFormChange={handleFormChange}
                    handleFormBatchChange={handleFormBatchChange}
                    handleFieldReview={handleFieldReview}
                    selectedTab={selectedTab}
                    dataFieldsMap={dataFieldsMap}
                    majorsList={majorsList}
                    loadingMajors={loadingMajors}
                    onCardUpdated={fetchCards}
                    cardFields={cardFields}
                    isModalOpen={isReviewModalOpen}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="px-4 sm:px-6 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] border-t flex-shrink-0 bg-white sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleArchiveCard}
                  disabled={!selectedCardForReview?.id}
                  className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 w-full sm:w-auto min-h-[44px]"
                >
                  Archive Card
                </Button>
                <Button
                  type="button"
                  onClick={handleReviewSave}
                  disabled={!selectedCardForReview?.id || isSaving}
                  className="w-full sm:w-auto min-h-[44px]"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Camera Capture Modal */}
        <Dialog open={isCameraModalOpen} onOpenChange={setIsCameraModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Capture Card</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <CameraCapture
                onCapture={handleImageCaptured}
                onCancel={() => setIsCameraModalOpen(false)}
              />
            </div>
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
            const selectedIds = Object.keys(rowSelection).filter(
              (id) => rowSelection[id]
            );
            handleMoveSelected(selectedIds);
          }}
          count={Object.keys(rowSelection).length}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={() => {
            const selectedIds = Object.keys(rowSelection).filter(
              (id) => rowSelection[id]
            );
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
          cardFields={cardFields}
        />

        {/* Signup Sheet Upload Modal */}
        <Dialog open={isSignupSheetModalOpen} onOpenChange={setIsSignupSheetModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Sign-up Sheet</DialogTitle>
              <DialogDescription>
                Upload a photo of a sign-up sheet to digitize the student information
              </DialogDescription>
            </DialogHeader>
            <SignupSheetUpload
              eventId={eventId!}
              schoolId={selectedEvent?.school_id || ''}
              onUploadComplete={handleSignupSheetComplete}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <CreateEventModal
          isOpen={isEditEventModalOpen}
          onClose={() => setIsEditEventModalOpen(false)}
          onEventCreated={handleEventUpdated}
          existingEvent={selectedEvent ? {
            id: selectedEvent.id,
            name: selectedEvent.name,
            date: selectedEvent.date || '',
            slate_event_id: selectedEvent.slate_event_id
          } : null}
        />
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
