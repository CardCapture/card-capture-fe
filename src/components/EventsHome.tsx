// src/components/EventsHome.tsx — events board (card grid)

import { useEffect, useMemo, useState, useCallback, memo } from "react";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/useEvents";
import type { EventWithStats } from "@/types/event";
import { CreateEventModal } from "./CreateEventModal";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PlusCircle,
  Archive,
  Trash2,
  X,
  Loader2,
  Search,
  CheckSquare,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { EventService } from "@/services/EventService";
import { Segmented } from "@/components/events/Segmented";
import { EventCard } from "@/components/events/EventCard";

// Tab type for event filtering
type EventTab = "upcoming" | "completed" | "archived";
type SortKey = "date" | "name" | "needs_review";

const DEFAULT_VISIBLE = 12;

const DashboardCopy = () => {
  const router = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useAuth();
  const { schoolId } = useProfile();
  const { events, loading: eventsLoading, fetchEvents, archiveEvents } =
    useEvents(schoolId);

  // State
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<EventTab>("upcoming");
  const [sort, setSort] = useState<SortKey>("date");
  const [expanded, setExpanded] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isVerifyingPurchase, setIsVerifyingPurchase] = useState(false);

  // Restore the previously selected tab when returning from event details
  useEffect(() => {
    const state = location.state as { previousTab?: EventTab };
    if (state?.previousTab) {
      setSelectedTab(state.previousTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch events on mount and when schoolId changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, schoolId]);

  // Handle purchase verification after returning from Stripe checkout
  useEffect(() => {
    const purchaseStatus = searchParams.get("purchase");
    const sessionId = searchParams.get("session_id");

    if (
      purchaseStatus === "success" &&
      sessionId &&
      session?.access_token &&
      !isVerifyingPurchase
    ) {
      setIsVerifyingPurchase(true);

      const verifyPurchase = async () => {
        try {
          const apiBaseUrl =
            import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
          const response = await fetch(
            `${apiBaseUrl}/events/verify-purchase/${sessionId}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            },
          );

          if (response.ok) {
            const result = await response.json();
            if (result.status === "completed") {
              toast.success(
                result.message || "Events added successfully!",
                "Purchase Complete",
              );
              fetchEvents();
            }
          } else {
            logger.error("Purchase verification failed:", await response.text());
          }
        } catch (error) {
          logger.error("Error verifying purchase:", error);
        } finally {
          setSearchParams({});
          setIsVerifyingPurchase(false);
        }
      };

      verifyPurchase();
    }
  }, [
    searchParams,
    session?.access_token,
    isVerifyingPurchase,
    setSearchParams,
    fetchEvents,
  ]);

  // Navigate to an event's detail
  const handleViewEvent = useCallback(
    (event: EventWithStats) => {
      router(`/events/${event.id}`, { state: { previousTab: selectedTab } });
    },
    [router, selectedTab],
  );

  // Helper to get a local date (year/month/day) for consistent comparison
  function getDateOnly(dateStr: string) {
    if (typeof dateStr === "string" && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
    const d = new Date(dateStr);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }

  const today = useMemo(() => getDateOnly(new Date().toISOString()), []);

  // Split events into tab categories (each pre-sorted by date)
  const { upcomingEvents, completedEvents, archivedEvents } = useMemo(() => {
    if (!events) {
      return { upcomingEvents: [], completedEvents: [], archivedEvents: [] };
    }

    const filtered = events.filter((event) =>
      searchQuery
        ? event.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true,
    );

    const upcoming = filtered
      .filter((event) => {
        const d = getDateOnly(event.date);
        return d >= today && event.status !== "archived";
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const completed = filtered
      .filter((event) => {
        const d = getDateOnly(event.date);
        return d < today && event.status !== "archived";
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const archived = filtered
      .filter((event) => event.status === "archived")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      upcomingEvents: upcoming,
      completedEvents: completed,
      archivedEvents: archived,
    };
  }, [events, searchQuery, today]);

  const tabEvents =
    selectedTab === "upcoming"
      ? upcomingEvents
      : selectedTab === "completed"
        ? completedEvents
        : archivedEvents;

  // Apply the chosen sort on top of the date-ordered tab events
  const sortedEvents = useMemo(() => {
    if (sort === "name") {
      return [...tabEvents].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "needs_review") {
      return [...tabEvents].sort(
        (a, b) => (b.stats.needs_review || 0) - (a.stats.needs_review || 0),
      );
    }
    return tabEvents; // "date" — keep per-tab date order
  }, [tabEvents, sort]);

  const visibleEvents = expanded
    ? sortedEvents
    : sortedEvents.slice(0, DEFAULT_VISIBLE);
  const hasMore = sortedEvents.length > DEFAULT_VISIBLE;

  // Reset transient view state when the filter changes
  useEffect(() => {
    setExpanded(false);
    setSelectedIds(new Set());
  }, [selectedTab, searchQuery]);

  // --- Selection (Select mode) ---
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds(new Set());
  }, []);

  // Escape exits select mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectMode) exitSelectMode();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectMode, exitSelectMode]);

  const handleArchiveSelected = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) {
      toast.required("event selection");
      return;
    }
    try {
      await archiveEvents(ids);
      exitSelectMode();
      await fetchEvents();
    } catch (error: unknown) {
      logger.error("Failed to archive events:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to archive selected events",
        "Archive failed",
      );
    }
  };

  const handleDeleteEvents = useCallback(async () => {
    setDeleteLoading(true);
    try {
      for (const eventId of selectedIds) {
        await EventService.deleteEvent(eventId);
      }
      exitSelectMode();
      await fetchEvents();
      toast.success(
        "The selected event(s) and all associated cards have been deleted.",
        "Event(s) deleted",
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete event(s).",
        "Delete Failed",
      );
    } finally {
      setDeleteLoading(false);
      setIsDeleteConfirmOpen(false);
    }
  }, [selectedIds, exitSelectMode, fetchEvents]);

  const selectedCount = selectedIds.size;

  const segmentTabs = [
    { value: "upcoming", label: "Upcoming", count: upcomingEvents.length },
    { value: "completed", label: "Completed", count: completedEvents.length },
    { value: "archived", label: "Archived", count: archivedEvents.length },
  ];

  return (
    <div className="container mx-auto max-w-[1180px] px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Your Events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-[15px]">
            Browse events and jump in to review &amp; export cards.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateEventModalOpen(true)}
          className="min-h-[44px] gap-2 self-start bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-5 w-5" />
          Create Event
        </Button>
      </div>

      {/* Controls row */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          tabs={segmentTabs}
          value={selectedTab}
          onChange={(v) => setSelectedTab(v as EventTab)}
          className="w-full overflow-x-auto sm:w-auto"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-11 w-full sm:w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort: Date</SelectItem>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="needs_review">Sort: Needs review</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "h-11 w-full pl-9",
                searchQuery && "border-status-exported-border",
              )}
            />
          </div>
          <Button
            type="button"
            variant={selectMode ? "secondary" : "outline"}
            onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
            className="h-11 gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            {selectMode ? "Done" : "Select"}
          </Button>
        </div>
      </div>

      {/* Selection action bar */}
      {selectMode && selectedCount > 0 && (
        <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-xl border border-status-exported-border bg-status-exported-soft px-4 py-3 sm:flex-row sm:items-center">
          <span className="text-sm font-semibold text-status-exported-ink">
            {selectedCount} {selectedCount === 1 ? "Event" : "Events"} Selected
          </span>
          <div className="flex items-center gap-2">
            {selectedTab === "archived" ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={deleteLoading}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                {selectedCount === 1 ? "Delete Event" : "Delete Events"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleArchiveSelected}
                className="gap-1.5 text-gray-700 hover:text-gray-900"
              >
                <Archive className="h-4 w-4" />
                Archive Selected
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              className="px-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Grid / loading / empty */}
      {eventsLoading ? (
        <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[188px] rounded-2xl" />
          ))}
        </div>
      ) : sortedEvents.length === 0 ? (
        <EmptyState tab={selectedTab} hasSearch={!!searchQuery} onCreate={() => setIsCreateEventModalOpen(true)} onClearSearch={() => setSearchQuery("")} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onOpen={handleViewEvent}
                selectMode={selectMode}
                selected={selectedIds.has(event.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setExpanded((v) => !v)}
                className="rounded-full"
              >
                {expanded ? "Show less" : `Show all ${sortedEvents.length} events`}
              </Button>
            </div>
          )}
        </>
      )}

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        onEventCreated={() => {
          fetchEvents();
          setIsCreateEventModalOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {selectedCount === 1 ? "Event" : "Events"}?
            </DialogTitle>
            <DialogDescription>
              This action will{" "}
              <span className="font-semibold text-red-600">permanently delete</span>{" "}
              the selected event{selectedCount > 1 ? "s" : ""} and{" "}
              <span className="font-semibold text-red-600">all associated cards</span>.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvents}
              disabled={deleteLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/** Empty / no-results state for the board grid. */
function EmptyState({
  tab,
  hasSearch,
  onCreate,
  onClearSearch,
}: {
  tab: EventTab;
  hasSearch: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">
          No events match your search
        </p>
        <Button variant="outline" className="mt-4" onClick={onClearSearch}>
          Clear search
        </Button>
      </div>
    );
  }

  const copy: Record<EventTab, { title: string; sub: string; showCreate: boolean }> = {
    upcoming: {
      title: "No upcoming events",
      sub: "Create an event to start scanning and reviewing cards.",
      showCreate: true,
    },
    completed: {
      title: "You have no completed events right now.",
      sub: "Events that have passed will appear here.",
      showCreate: false,
    },
    archived: {
      title: "You have no archived events right now.",
      sub: "Events you archive will appear here.",
      showCreate: false,
    },
  };
  const c = copy[tab];

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-status-exported-soft">
        <PlusCircle className="h-6 w-6 text-status-exported-solid" />
      </div>
      <p className="text-sm font-medium text-foreground">{c.title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{c.sub}</p>
      {c.showCreate && (
        <Button
          onClick={onCreate}
          className="mt-4 gap-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" />
          Create event
        </Button>
      )}
    </div>
  );
}

export default memo(DashboardCopy);
