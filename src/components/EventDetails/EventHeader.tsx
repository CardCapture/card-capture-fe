import React, { memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Info,
  CheckCircle,
  Download,
  Archive,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { CompactProcessingStatus } from "@/components/CompactProcessingStatus";
import { ProcessingService } from "@/services/processingService";

interface EventHeaderProps {
  selectedEvent: { id: string; name: string; school_id?: string; date?: string; slate_event_id?: string | null } | null;
  getStatusCount: (status: string) => number;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  setHideExported: (hide: boolean) => void;
  hideExported: boolean;
  onEditEvent: () => void;
  onRefreshCards?: () => void;
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
}) => {
  const navigate = useNavigate();
  const location = useLocation();

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

      {/* Header Section - Mobile Responsive */}
      <div className="container max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Card className="mb-4 sm:mb-6">
          <CardContent className="relative flex flex-col gap-4 p-4 sm:p-6">
            {/* Event Details Section */}
            <div className="flex flex-col text-left w-full">
              <div className="flex flex-col text-left min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-1 text-left flex items-center gap-2">
                      <span className="break-words">
                        {selectedEvent ? selectedEvent.name : "All Events"}
                      </span>
                      <button
                        className="text-gray-400 hover:text-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        onClick={onEditEvent}
                        aria-label="Edit event"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </h1>
                    {selectedEvent && (
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        {selectedEvent.date && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Date:</span>
                            <span>{(() => {
                              // Parse date as local date to avoid timezone issues
                              const [year, month, day] = selectedEvent.date.split('-').map(Number);
                              const date = new Date(year, month - 1, day);
                              return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                            })()}</span>
                          </div>
                        )}
                        {selectedEvent.slate_event_id && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Event UUID:</span>
                            <span className="font-mono text-xs">{selectedEvent.slate_event_id}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Processing Status - Absolutely positioned to not affect header height */}
            {selectedEvent && (
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 hidden sm:block">
                <CompactProcessingStatus 
                  eventId={selectedEvent.id}
                  className="min-w-[240px]"
                  onRetryFailed={handleRetryFailed}
                  onStopProcessing={handleStopProcessing}
                  onDismissFailure={handleDismissFailure}
                />
              </div>
            )}

            {/* Status Badges - Mobile Responsive Grid */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleNeedsReviewClick}
                className="focus:outline-none rounded cursor-pointer"
                style={{ touchAction: "manipulation" }}
                aria-label="Show Needs Review"
              >
                <Badge
                  variant="outline"
                  className={`flex items-center space-x-1 text-xs py-1 w-fit transition-colors duration-150 cursor-pointer ${
                    selectedTab === "needs_review"
                      ? "border-2 border-indigo-500 text-indigo-700 bg-indigo-50"
                      : ""
                  }`}
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Needs Review:</span>
                  <span>{getStatusCount("needs_review")}</span>
                </Badge>
              </button>
              <button
                type="button"
                onClick={handleReadyToExportClick}
                className="focus:outline-none rounded cursor-pointer"
                style={{ touchAction: "manipulation" }}
                aria-label="Show Ready to Export"
              >
                <Badge
                  variant="outline"
                  className={`flex items-center space-x-1 text-xs py-1 w-fit transition-colors duration-150 cursor-pointer ${
                    selectedTab === "ready_to_export" && hideExported
                      ? "border-2 border-green-500 text-green-700 bg-green-50"
                      : ""
                  }`}
                >
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  <span className="hidden sm:inline">Ready:</span>
                  <span>{getStatusCount("reviewed")}</span>
                </Badge>
              </button>
              <button
                type="button"
                onClick={handleExportedClick}
                className="focus:outline-none rounded cursor-pointer"
                style={{ touchAction: "manipulation" }}
                aria-label="Show Exported"
              >
                <Badge
                  variant="outline"
                  className={`flex items-center space-x-1 text-xs py-1 w-fit transition-colors duration-150 cursor-pointer ${
                    selectedTab === "ready_to_export" && !hideExported
                      ? "border-2 border-blue-500 text-blue-700 bg-blue-50"
                      : ""
                  }`}
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                  <span className="hidden sm:inline">Exported:</span>
                  <span>{getStatusCount("exported")}</span>
                </Badge>
              </button>
              <button
                type="button"
                onClick={handleArchivedClick}
                className="focus:outline-none rounded cursor-pointer"
                style={{ touchAction: "manipulation" }}
                aria-label="Show Archived"
              >
                <Badge
                  variant="outline"
                  className={`flex items-center space-x-1 text-xs py-1 w-fit transition-colors duration-150 cursor-pointer ${
                    selectedTab === "archived"
                      ? "border-2 border-gray-500 text-gray-700 bg-gray-50"
                      : ""
                  }`}
                >
                  <Archive className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                  <span className="hidden sm:inline">Archived:</span>
                  <span>{getStatusCount("archived")}</span>
                </Badge>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default memo(EventHeader);
export { EventHeader };
