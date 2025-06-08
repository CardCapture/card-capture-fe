import React, { memo, useCallback } from "react";
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

interface EventHeaderProps {
  selectedEvent: { id: string; name: string; school_id?: string } | null;
  getStatusCount: (status: string) => number;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  setHideExported: (hide: boolean) => void;
  hideExported: boolean;
  isEditingEventName: boolean;
  eventNameInput: string;
  setEventNameInput: (name: string) => void;
  eventNameLoading: boolean;
  eventNameError: string;
  handleEditEventName: () => void;
  handleSaveEventName: () => void;
  handleCancelEditEventName: () => void;
}

const EventHeader: React.FC<EventHeaderProps> = ({
  selectedEvent,
  getStatusCount,
  selectedTab,
  setSelectedTab,
  setHideExported,
  hideExported,
  isEditingEventName,
  eventNameInput,
  setEventNameInput,
  eventNameLoading,
  eventNameError,
  handleEditEventName,
  handleSaveEventName,
  handleCancelEditEventName,
}) => {
  // Memoize tab click handlers to prevent unnecessary re-renders
  const handleNeedsReviewClick = useCallback(() => {
    setSelectedTab("needs_human_review");
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
              <a href="/events" className="text-blue-600 hover:underline">
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
            {/* Event Name Section */}
            <div className="flex flex-col text-left w-full">
              <div className="flex flex-col text-left min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-2 text-left flex items-center gap-2 flex-wrap">
                {isEditingEventName ? (
                  <>
                    <input
                      className="border rounded px-2 py-1 text-base sm:text-lg font-semibold w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={eventNameInput}
                      onChange={(e) => setEventNameInput(e.target.value)}
                      disabled={eventNameLoading}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEventName();
                        if (e.key === "Escape") handleCancelEditEventName();
                      }}
                    />
                    <div className="flex items-center gap-1">
                      <button
                        className="text-green-600 hover:text-green-800 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
                        className="text-gray-500 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        onClick={handleCancelEditEventName}
                        disabled={eventNameLoading}
                        aria-label="Cancel edit"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="break-words">
                      {selectedEvent ? selectedEvent.name : "All Events"}
                    </span>
                    <button
                      className="text-gray-400 hover:text-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            </div>
            
            {/* Processing Status - Absolutely positioned to not affect header height */}
            {selectedEvent && (
              <div className="absolute top-4 right-4 sm:top-6 sm:right-6 hidden sm:block">
                <CompactProcessingStatus 
                  eventId={selectedEvent.id}
                  className="min-w-[240px]"
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
                    selectedTab === "needs_human_review"
                      ? "border-2 border-indigo-500 text-indigo-700 bg-indigo-50"
                      : ""
                  }`}
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
                  <span className="hidden sm:inline">Needs Review:</span>
                  <span>{getStatusCount("needs_human_review")}</span>
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
