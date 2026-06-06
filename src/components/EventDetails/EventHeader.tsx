import React, { memo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, CalendarDays, Download, Pencil } from "lucide-react";
import { StatusPill } from "@/components/status/StatusPill";
import { CompactProcessingStatus } from "@/components/CompactProcessingStatus";
import { ProcessingService } from "@/services/processingService";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";

interface EventHeaderProps {
  selectedEvent: { id: string; name: string; school_id?: string; date?: string; slate_event_id?: string | null } | null;
  getStatusCount: (status: string) => number;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  setHideExported: (hide: boolean) => void;
  hideExported: boolean;
  onEditEvent: () => void;
  onRefreshCards?: () => void;
  processingRefreshRef?: React.MutableRefObject<((force?: boolean) => void) | null>;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  selectedEvent,
  getStatusCount,
  selectedTab,
  setSelectedTab,
  setHideExported,
  hideExported,
  onEditEvent,
  onRefreshCards,
  processingRefreshRef,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Single processing status hook shared by both desktop and mobile instances
  const { status: processingStatus, loading: processingLoading, refresh: processingRefresh } =
    useProcessingStatus(selectedEvent?.id, onRefreshCards);

  // Expose refresh to parent via ref (for triggering after upload)
  useEffect(() => {
    if (processingRefreshRef) {
      processingRefreshRef.current = processingRefresh;
    }
  }, [processingRefreshRef, processingRefresh]);

  // Get the previous tab from location state (passed when navigating to this event)
  const previousTab = (location.state as { previousTab?: string })?.previousTab;

  // Handler for breadcrumb back navigation
  const handleBackToEvents = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Navigate back to events list, preserving the tab if available
    navigate('/events', { state: { previousTab } });
  }, [navigate, previousTab]);

  // Memoize tab click handlers to prevent unnecessary re-renders
  const handleNeedsReviewClick = useCallback(() => {
    setSelectedTab("needs_review");
  }, [setSelectedTab]);

  const handleReadyToExportClick = useCallback(() => {
    setSelectedTab("ready_to_export");
    setHideExported(true);
  }, [setSelectedTab, setHideExported]);

  const handleExportedClick = useCallback(() => {
    setSelectedTab("ready_to_export");
    setHideExported(false);
  }, [setSelectedTab, setHideExported]);

  const handleArchivedClick = useCallback(() => {
    setSelectedTab("archived");
  }, [setSelectedTab]);

  // Processing handlers
  const handleRetryFailed = useCallback(async () => {
    if (!selectedEvent?.id) return;

    await ProcessingService.retryFailedJobs(selectedEvent.id);
    if (onRefreshCards) {
      onRefreshCards();
    }
  }, [selectedEvent?.id, onRefreshCards]);

  const handleStopProcessing = useCallback(async () => {
    if (!selectedEvent?.id) return;

    await ProcessingService.stopActiveJobs(selectedEvent.id);
    if (onRefreshCards) {
      onRefreshCards();
    }
  }, [selectedEvent?.id, onRefreshCards]);

  const handleDismissFailure = useCallback(async () => {
    if (!selectedEvent?.id) return;

    await ProcessingService.clearFailedJobs(selectedEvent.id);
    if (onRefreshCards) {
      onRefreshCards();
    }
  }, [selectedEvent?.id, onRefreshCards]);

  // Ring highlight on the active status chip
  const chipRing = (active: boolean) =>
    cn("rounded-full transition-shadow", active && "ring-2 ring-blue-400/70 ring-offset-1");

  // Parse YYYY-MM-DD as a local date (avoids timezone shifting) and format short.
  const formatEventDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="space-y-4">
        <nav
          aria-label="Breadcrumb"
          className="mb-2 text-xs sm:text-sm text-gray-500"
        >
          <ol className="flex items-center space-x-1">
            <li className="flex items-center">
              <a
                href="/events"
                onClick={handleBackToEvents}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Events
              </a>
              <ChevronRight className="mx-1 w-3 h-3 text-gray-400" />
            </li>
            <li className="font-medium text-gray-900 truncate">
              {selectedEvent?.name}
            </li>
          </ol>
        </nav>
      </div>

      {/* Tinted header band — the level delineator between the events grid
          and this card-review screen. */}
      <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="relative mb-4 rounded-[18px] border border-status-exported-border bg-[linear-gradient(120deg,#EFF6FF,#F4F8FF)] p-5 sm:mb-6 sm:p-6">
          {/* Title + Export */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                <span className="break-words">
                  {selectedEvent ? selectedEvent.name : "All Events"}
                </span>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-blue-600"
                  onClick={onEditEvent}
                  aria-label="Edit event"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </h1>
              {selectedEvent && (
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                  {selectedEvent.date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      {formatEventDate(selectedEvent.date)}
                    </span>
                  )}
                  {selectedEvent.slate_event_id && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="font-medium">Event UUID:</span>
                      <span className="font-mono text-xs">
                        {selectedEvent.slate_event_id}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {selectedEvent && (
              <Button
                onClick={handleReadyToExportClick}
                disabled={getStatusCount("reviewed") === 0}
                className="min-h-[44px] gap-2 self-start bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Go to cards ready to export"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>

          {/* Status chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleNeedsReviewClick}
              className={chipRing(selectedTab === "needs_review")}
              aria-label="Show Needs Review"
            >
              <StatusPill
                status="review"
                label="Needs Review"
                count={getStatusCount("needs_review")}
              />
            </button>
            <button
              type="button"
              onClick={handleReadyToExportClick}
              className={chipRing(selectedTab === "ready_to_export" && hideExported)}
              aria-label="Show Ready"
            >
              <StatusPill
                status="ready"
                label="Ready"
                count={getStatusCount("reviewed")}
              />
            </button>
            <button
              type="button"
              onClick={handleExportedClick}
              className={chipRing(selectedTab === "ready_to_export" && !hideExported)}
              aria-label="Show Exported"
            >
              <StatusPill
                status="exported"
                label="Exported"
                count={getStatusCount("exported")}
              />
            </button>
            <button
              type="button"
              onClick={handleArchivedClick}
              className={chipRing(selectedTab === "archived")}
              aria-label="Show Archived"
            >
              <StatusPill
                status="archived"
                label="Archived"
                count={getStatusCount("archived")}
              />
            </button>
          </div>

          {/* Processing status (renders only while jobs are active) */}
          {selectedEvent && (
            <CompactProcessingStatus
              status={processingStatus}
              loading={processingLoading}
              refresh={processingRefresh}
              className="mt-4 w-full sm:max-w-md"
              onRetryFailed={handleRetryFailed}
              onStopProcessing={handleStopProcessing}
              onDismissFailure={handleDismissFailure}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default memo(EventHeader);
export { EventHeader };
