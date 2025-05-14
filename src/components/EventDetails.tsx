// src/components/Dashboard.tsx (Reverted State - After useCards, Before useCardTable)

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
// Restore full Tanstack Table imports
import {
  ColumnDef,
  flexRender,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import { Badge } from "@/components/ui/badge"; // Restore Badge import
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Camera,
  Download,
  Trash2,
  CheckCircle,
  FileText,
  FolderOpen,
  Loader2,
  X,
  Info,
  Archive,
  CalendarDays,
  CheckCircle2,
  PlusCircle,
  Upload,
  UserPlus,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Pencil,
  Check,
} from "lucide-react";
// Custom Components and Hooks
import ScanFab from "@/components/ScanFab";
import { useToast } from "@/hooks/use-toast";
import { useCardsOverride } from "@/hooks/useCardsOverride";
import { useEvents } from "@/hooks/useEvents";
// Utilities and Types
import {
  formatPhoneNumber,
  formatBirthday,
  escapeCsvValue,
  formatDateOrTimeAgo,
} from "@/lib/utils";
import type { ProspectCard, FieldDetail, CardStatus } from "@/types/card";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import type { Event } from "@/types/event";
import { determineCardStatus } from "@/lib/cardUtils";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCardUpload } from "@/hooks/useCardUpload";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { supabase } from "@/lib/supabaseClient";
import { getSignedImageUrl } from "@/lib/imageUtils";
import ReviewImagePanel from "@/components/review/ReviewImagePanel";
import ReviewForm from "@/components/review/ReviewForm";
import ArchiveConfirmDialog from "@/components/modals/ArchiveConfirmDialog";
import MoveConfirmDialog from "@/components/modals/MoveConfirmDialog";
import DeleteConfirmDialog from "@/components/modals/DeleteConfirmDialog";
import ManualEntryModal from "@/components/modals/ManualEntryModal";
import EventHeader from "@/components/events/EventHeader";
import CardTable from "@/components/cards/CardTable";

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

  // Add getStatusCount function locally
  const getStatusCount = useCallback(
    (status: string) => {
      if (!cards) return 0;
      return cards.filter((card) => {
        const c = card as ProspectCard & { deleted?: boolean };
        return determineCardStatus(c) === status && !c.deleted;
      }).length;
    },
    [cards]
  );

  // --- State ---
  const [selectedTab, setSelectedTab] = useState<string>("needs_human_review");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedCardForReview, setSelectedCardForReview] =
    useState<ProspectCard | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] =
    useState<boolean>(false);
  const [reviewedCards, setReviewedCards] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hideExported, setHideExported] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(0.47);

  // Add a ref to track the selected card ID
  const selectedCardIdRef = useRef<string | null>(null);

  // Add a ref to track the image key
  const imageKeyRef = useRef<string>(`image-${Date.now()}`);

  // Add a ref to store the image URL
  const imageUrlRef = useRef<string>("");

  // Add a ref to store a local copy of the selected card that won't be affected by updates
  const localCardRef = useRef<ProspectCard | null>(null);

  // Add debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Add a ref to track which fields have shown a toast
  const fieldsWithToastRef = useRef<Set<string>>(new Set());

  // Add a ref to track the events object
  const eventsRef = useRef<{ fetchEvents: () => Promise<void> } | null>(null);

  // Add a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new state for the manual entry modal
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] =
    useState<boolean>(false);
  // Add state for the manual entry form
  const [manualEntryForm, setManualEntryForm] = useState({
    name: "",
    email: "",
    cell: "",
    date_of_birth: "",
  });

  // Add a new state for the debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // Add the reviewProgress memo after reviewFieldOrder declaration
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

  // --- Memos ---
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
      // imageUrlRef.current = card.image_path || '';
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

  // Update the debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(query);
    }, 300);
  }, []);

  // Update filteredCards to use debouncedSearchQuery instead of searchQuery
  const filteredCards = useMemo(() => {
    if (!cards) return [];

    return cards.filter((card) => {
      // Always filter by event if eventId is provided
      if (selectedEvent && card.event_id !== selectedEvent.id) {
        return false;
      }

      const currentStatus = determineCardStatus(card);

      // Apply hideExported filter if enabled
      if (hideExported && card.exported_at) {
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
          return currentStatus === "archived";
        default:
          return true;
      }
    });
  }, [cards, selectedTab, selectedEvent, hideExported, debouncedSearchQuery]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      const selectedIds = Object.keys(rowSelection).map((index) => {
        const card = filteredCards[parseInt(index)];
        return card.id;
      });

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/delete-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_ids: selectedIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete cards");
      }

      setRowSelection({});
      await fetchCards();

      toast({
        title: "Success",
        description: "Selected cards have been deleted",
      });
    } catch (error) {
      console.error("Error deleting cards:", error);
      toast({
        title: "Error",
        description: "Failed to delete cards",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  // Restore columns definition directly in Dashboard
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

  // --- Table Instance ---
  // Restore useReactTable call
  const table = useReactTable({
    data: filteredCards,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: (updater) => {
      setRowSelection((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        // Map selected row indices to card IDs using filteredCards
        const ids = Object.keys(next)
          .filter((key) => next[key])
          .map((key) => {
            const idx = parseInt(key, 10);
            return filteredCards[idx]?.id;
          })
          .filter(Boolean);
        setSelectedCardIds(ids as string[]);
        return next;
      });
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // --- Callbacks & Effects ---
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
  const startUploadProcess = useCallback(
    async (file: File) => {
      if (!selectedEvent?.id) {
        toast({
          title: "Event Required",
          description: "Please select an event before uploading a card.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Define the onUploadStart callback to show the toast
        const onUploadStart = () => {
          toast({
            title: "Card Processing",
            description:
              "Your card is being processed. You can continue scanning more cards.",
            variant: "default",
            duration: 4000,
            className:
              "bg-white border-green-200 shadow-md rounded-lg animate-in fade-in-0 slide-in-from-top-2",
            action: (
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-4 w-4" />
              </div>
            ),
          });
        };

        // Use the new uploadCard hook with the callback
        const data = await uploadCard(
          file,
          selectedEvent.id,
          selectedEvent.school_id,
          onUploadStart
        );

        // Handle successful upload
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 200);

        // Fetch updated cards list
        await fetchCards();
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedEvent, uploadCard, fetchCards, toast]
  );
  const handleReviewSave = async () => {
    if (!selectedCardForReview) return;

    setIsSaving(true);
    try {
      toast({
        title: "Saving Changes",
        description: "Updating card information...",
        variant: "default",
      });

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      // Prepare the updated fields
      const updatedFields = Object.fromEntries(
        Object.entries(selectedCardForReview.fields).map(([key, field]) => [
          key,
          {
            ...field,
            value: formData[key] || field.value,
            reviewed: true,
            requires_human_review: false,
            review_notes: "Manually reviewed",
          },
        ])
      );

      // Check if all fields have been reviewed
      const allFieldsReviewed = Object.values(updatedFields).every(
        (field) =>
          field.reviewed === true && field.requires_human_review === false
      );

      // Save all field updates at once
      const response = await fetch(
        `${apiBaseUrl}/save-review/${selectedCardForReview.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: updatedFields,
            status: allFieldsReviewed ? "reviewed" : "needs_human_review",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      const result = await response.json();

      // Update UI based on the response
      await fetchCards();
      setIsReviewModalOpen(false);
      setSelectedCardForReview(null);
      toast({
        title: "Review Complete",
        description: allFieldsReviewed
          ? "All fields have been reviewed and saved."
          : "Changes saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error saving review:", error);
      toast({
        title: "Save Failed",
        description: "Unable to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleArchiveCard = useCallback(() => {
    if (!selectedCardForReview) return;
    // Set the archive confirm modal open
    setIsArchiveConfirmOpen(true);
  }, [selectedCardForReview]);
  const confirmArchiveAction = useCallback(async () => {
    if (!selectedCardForReview) return;

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/archive-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: [selectedCardForReview.id] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to archive card (${response.status})`
        );
      }

      // Close both modals
      setIsArchiveConfirmOpen(false);
      setIsReviewModalOpen(false);
      setReviewModalState(false);

      // Refresh the cards list
      await fetchCards();

      toast({
        title: "Card Archived",
        description: "Card has been successfully archived",
        variant: "default",
      });
    } catch (error: unknown) {
      console.error("Error archiving card:", error);
      toast({
        title: "Archive Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to archive card. Please try again.",
        variant: "destructive",
      });
      setIsArchiveConfirmOpen(false);
    }
  }, [selectedCardForReview, fetchCards, toast]);
  const downloadCSV = useCallback(async () => {
    try {
      const selectedRows = table
        .getRowModel()
        .rows.filter((row) => rowSelection[row.id]);
      if (selectedRows.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to export.",
          variant: "destructive",
        });
        return;
      }

      const selectedIds = selectedRows.map((row) => row.original.id);

      toast({
        title: "Exporting Cards",
        description: "Processing your export request...",
        variant: "default",
      });

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/mark-exported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to mark cards as exported (${response.status})`
        );
      }

      // Generate CSV content
      const headers = ["Event", ...Array.from(dataFieldsMap.values())];
      const csvContent = [
        headers.map(escapeCsvValue).join(","),
        ...selectedRows.map((row) => {
          const eventName = selectedEvent?.name || "Unknown Event";
          return [
            escapeCsvValue(eventName),
            ...Array.from(dataFieldsMap.keys()).map((key) =>
              escapeCsvValue(row.original.fields?.[key]?.value ?? "")
            ),
          ].join(",");
        }),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `card_data_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clear selection and refresh cards
      setRowSelection({});
      await fetchCards();

      toast({
        title: "Export Successful",
        description: `${selectedIds.length} ${
          selectedIds.length === 1 ? "card" : "cards"
        } exported successfully.`,
        variant: "default",
      });
    } catch (error: unknown) {
      console.error("Error exporting cards:", error);
      toast({
        title: "Export Failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while exporting cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [rowSelection, table, dataFieldsMap, toast, fetchCards, selectedEvent]);

  // Add state for selected card IDs
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const handleArchiveSelected = useCallback(async () => {
    try {
      if (selectedCardIds.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to archive.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/archive-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedCardIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to archive cards");
      }
      setRowSelection({});
      setSelectedCardIds([]);
      await fetchCards();
      toast({
        title: "Success",
        description: "Selected cards have been archived",
      });
    } catch (error) {
      console.error("Error archiving cards:", error);
      toast({
        title: "Error",
        description: "Failed to archive cards",
        variant: "destructive",
      });
    }
  }, [selectedCardIds, toast, fetchCards]);

  const handleExportSelected = useCallback(async () => {
    try {
      if (selectedCardIds.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to export.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/mark-exported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedCardIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark cards as exported");
      }
      // ... existing CSV export logic ...
      setRowSelection({});
      setSelectedCardIds([]);
      await fetchCards();
      toast({
        title: "Export Successful",
        description: `${selectedCardIds.length} ${
          selectedCardIds.length === 1 ? "card" : "cards"
        } exported successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting cards:", error);
      toast({
        title: "Export Failed",
        description:
          "Something went wrong while exporting cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedCardIds, toast, fetchCards, selectedEvent, dataFieldsMap]);

  // Update the modal open/close handlers
  const handleModalOpenChange = useCallback(
    (open: boolean) => {
      // Set the review modal state first
      setReviewModalState(open);

      // Use a small timeout to ensure the state is updated before changing the modal state
      if (!open) {
        // Reset zoom when modal closes
        setZoom(0.47);
        setTimeout(() => {
          setIsReviewModalOpen(open);
        }, 50);
      } else {
        setIsReviewModalOpen(open);
      }
    },
    [setReviewModalState]
  );

  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && Object.keys(rowSelection).length > 0) {
        setRowSelection({});
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [rowSelection, setRowSelection]);

  // Handler for capturing a card
  const handleCaptureCard = () => {
    // Implementation would open the camera modal
    toast({
      title: "Capture Card",
      description: "Camera capture functionality would be triggered here",
    });
    // We would typically open a camera modal here, similar to ScanFab
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
      startUploadProcess(file);
    }
    if (event.target) event.target.value = "";
  };

  // Add handler for opening the manual entry modal
  const handleManualEntry = () => {
    setIsManualEntryModalOpen(true);
  };

  // Add handler for manual entry form changes
  const handleManualEntryChange = (field: string, value: string) => {
    setManualEntryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Add handler for submitting the manual entry form
  const handleManualEntrySubmit = async () => {
    if (!manualEntryForm.name) {
      toast({
        title: "Name Required",
        description: "Please enter at least a name for the contact",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create manual card entry
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/cards/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          fields: {
            name: { value: manualEntryForm.name, confidence: 1.0 },
            email: { value: manualEntryForm.email, confidence: 1.0 },
            cell: { value: manualEntryForm.cell, confidence: 1.0 },
            date_of_birth: {
              value: manualEntryForm.date_of_birth,
              confidence: 1.0,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create manual entry");
      }

      toast({
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium">
              Contact added successfully
            </span>
          </div>
        ),
        duration: 3000,
      });

      // Reset form and close modal
      setManualEntryForm({
        name: "",
        email: "",
        cell: "",
        date_of_birth: "",
      });
      setIsManualEntryModalOpen(false);

      // Refresh cards list
      fetchCards();
    } catch (error: unknown) {
      console.error("Manual entry failed:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create manual entry",
        variant: "destructive",
      });
    }
  };

  // Add zoom functions
  const zoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.2, 2)), []);
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(z / 1.2, 0.47)),
    []
  );

  const [isMoveConfirmOpen, setIsMoveConfirmOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] =
    useState<boolean>(false);

  const handleMoveSelected = useCallback(async () => {
    try {
      const selectedIds = Object.keys(rowSelection).map((index) => {
        const card = filteredCards[parseInt(index)];
        return card.id;
      });

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      // Update each card's status to 'reviewed'
      for (const documentId of selectedIds) {
        const response = await fetch(
          `${apiBaseUrl}/save-review/${documentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "reviewed",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to move cards");
        }
      }

      setRowSelection({});
      await fetchCards();

      toast({
        title: "Success",
        description: "Selected cards have been moved to Ready to Export",
      });
    } catch (error) {
      console.error("Error moving cards:", error);
      toast({
        title: "Error",
        description: "Failed to move cards",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  const [imageUrlState, setImageUrlState] = useState("");

  // Update the image URL when the selected card changes
  useEffect(() => {
    console.log("useEffect: selectedCardForReview", selectedCardForReview);

    async function updateImageUrl() {
      if (selectedCardForReview?.image_path) {
        console.log(
          "updateImageUrl: Calling getSignedImageUrl with:",
          selectedCardForReview.image_path
        );
        const signedUrl = await getSignedImageUrl(
          selectedCardForReview.image_path
        );
        setImageUrlState(signedUrl);
        console.log("updateImageUrl: setImageUrlState to", signedUrl);
      } else {
        setImageUrlState("");
        console.log(
          "updateImageUrl: No image_path, setImageUrlState to empty string"
        );
      }
    }
    updateImageUrl();
  }, [selectedCardForReview?.image_path, getSignedImageUrl]);

  const [isEditingEventName, setIsEditingEventName] = useState(false);
  const [eventNameInput, setEventNameInput] = useState(
    selectedEvent?.name || ""
  );
  const [eventNameLoading, setEventNameLoading] = useState(false);
  const [eventNameError, setEventNameError] = useState<string | null>(null);

  useEffect(() => {
    setEventNameInput(selectedEvent?.name || "");
  }, [selectedEvent]);

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
    } catch (error: unknown) {
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

  // Add this effect after the hideExported state declaration
  const prevHideExported = useRef(hideExported);
  useEffect(() => {
    if (prevHideExported.current && !hideExported) {
      setSorting([{ id: "status", desc: true }]);
    }
    prevHideExported.current = hideExported;
  }, [hideExported]);

  const [cardFieldPrefs, setCardFieldPrefs] = useState<Record<
    string,
    boolean
  > | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!selectedEvent) return;
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

  const fieldsToShow = selectedCardForReview
    ? cardFieldPrefs && Object.keys(cardFieldPrefs).length > 0
      ? Object.keys(selectedCardForReview.fields).filter((fieldKey) => {
          const actualName =
            selectedCardForReview.fields[fieldKey]?.actual_field_name;
          return cardFieldPrefs[actualName] !== false; // show if true or undefined
        })
      : reviewFieldOrder.filter(
          (fieldKey) => selectedCardForReview.fields[fieldKey]
        )
    : [];

  // --- JSX ---
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

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-5">
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
              getStatusCount={getStatusCount}
              hideExported={hideExported}
              setHideExported={setHideExported}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              debouncedSearch={debouncedSearch}
              isUploading={isUploading}
              handleExportSelected={handleExportSelected}
              handleArchiveSelected={handleArchiveSelected}
              handleMoveSelected={handleMoveSelected}
              handleDeleteSelected={handleDeleteSelected}
              setIsArchiveConfirmOpen={setIsArchiveConfirmOpen}
              setIsMoveConfirmOpen={setIsMoveConfirmOpen}
              setIsDeleteConfirmOpen={setIsDeleteConfirmOpen}
              dataFieldsMap={dataFieldsMap}
              reviewFieldOrder={reviewFieldOrder}
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
              handleCaptureCard={handleCaptureCard}
              handleImportFile={handleImportFile}
              handleManualEntry={handleManualEntry}
            />
          </div>
        </div>

        {/* Review Modal Dialog */}
        <Dialog open={isReviewModalOpen} onOpenChange={handleModalOpenChange}>
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
                <div className="bg-gray-50 rounded-lg p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {selectedCardForReview ? (
                      fieldsToShow.map((fieldKey) => {
                        const fieldData =
                          selectedCardForReview.fields?.[fieldKey];
                        const label =
                          fieldData?.actual_field_name ||
                          dataFieldsMap.get(fieldKey) ||
                          fieldKey.replace(/_/g, " ");
                        const needsReview =
                          fieldData?.requires_human_review === true;
                        const isReviewed = fieldData?.reviewed === true;
                        const reviewNotes = fieldData?.review_notes;

                        // Show review indicators only for fields that need review
                        const showIcon = needsReview;

                        let formattedValue = fieldData?.value ?? "";
                        if (fieldKey === "cell")
                          formattedValue = formatPhoneNumber(fieldData?.value);
                        if (fieldKey === "date_of_birth")
                          formattedValue = formatBirthday(fieldData?.value);

                        const tooltipContent =
                          reviewNotes ||
                          (needsReview ? "Needs human review" : null);

                        return (
                          <div
                            key={fieldKey}
                            className="grid grid-cols-5 items-center gap-x-4 gap-y-1"
                          >
                            <Label
                              htmlFor={fieldKey}
                              className="text-right col-span-2 text-xs font-medium text-gray-600 flex items-center justify-end gap-1"
                            >
                              {showIcon && !isReviewed && (
                                <TooltipProvider delayDuration={100}>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-400 flex-shrink-0 text-white text-[8px] font-bold leading-none">
                                        !
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <p>{tooltipContent}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {label}:
                            </Label>
                            <div className="col-span-3 flex items-center gap-2">
                              {fieldKey === "cell" ? (
                                <PhoneNumberInput
                                  id={fieldKey}
                                  value={formData[fieldKey] ?? ""}
                                  onChange={(value) =>
                                    handleFormChange(fieldKey, value)
                                  }
                                  className={`h-8 text-sm flex-1 ${
                                    isReviewed &&
                                    selectedTab === "needs_human_review"
                                      ? "border-green-300 focus-visible:ring-green-400 bg-green-50"
                                      : showIcon
                                      ? "border-red-300 focus-visible:ring-red-400"
                                      : ""
                                  }`}
                                />
                              ) : (
                                <Input
                                  id={fieldKey}
                                  value={formData[fieldKey] ?? ""}
                                  onChange={(e) =>
                                    handleFormChange(fieldKey, e.target.value)
                                  }
                                  className={`h-8 text-sm flex-1 ${
                                    isReviewed &&
                                    selectedTab === "needs_human_review"
                                      ? "border-green-300 focus-visible:ring-green-400 bg-green-50"
                                      : showIcon
                                      ? "border-red-300 focus-visible:ring-red-400"
                                      : ""
                                  }`}
                                />
                              )}
                              {showIcon &&
                                selectedTab === "needs_human_review" && (
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className={`h-8 w-8 p-1 ${
                                            isReviewed
                                              ? "text-green-500"
                                              : "text-gray-400 hover:text-gray-600"
                                          }`}
                                          onClick={(e) =>
                                            handleFieldReview(fieldKey, e)
                                          }
                                        >
                                          <CheckCircle className="h-5 w-5" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
                                        <p>
                                          {isReviewed
                                            ? "Mark as needing review"
                                            : "Mark as reviewed"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-gray-500 text-center mt-4">
                        No card selected for review.
                      </p>
                    )}
                  </div>
                </div>
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
          onConfirm={handleMoveSelected}
          count={Object.keys(rowSelection).length}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={handleDeleteSelected}
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
