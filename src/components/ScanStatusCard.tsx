import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  RotateCcw,
  Loader2
} from "lucide-react";
import { useUserCardStats } from "@/hooks/useUserCardStats";
import { ProcessingStatusBar } from "@/components/ProcessingStatusBar";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";

interface ScanStatusCardProps {
  eventId: string;
  eventName: string;
  onRetryFailed?: () => void;
  className?: string;
  forceShow?: boolean; // Force show processing status even if no user cards yet
}

export function ScanStatusCard({
  eventId,
  eventName,
  onRetryFailed,
  className = "",
  forceShow = false
}: ScanStatusCardProps) {
  const { userStats, isLoading, refreshStats } = useUserCardStats(eventId);
  // Pass refreshStats as onComplete callback so cards refresh immediately when processing finishes
  const { status: processingStatus } = useProcessingStatus(eventId, refreshStats);

  // Show if user has scanned cards OR if there are cards being processed OR forced
  // This ensures the processing status shows immediately after upload
  const hasUserCards = userStats.total_user_cards > 0;
  const hasProcessingCards = processingStatus.isProcessing;

  // Don't show anything if no user cards, no processing, not loading, and not forced
  // Keep showing if loading to prevent UI flash (we expect data to come back)
  const shouldShow = hasUserCards || hasProcessingCards || forceShow || isLoading;
  if (!shouldShow) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Processing Status Bar - always show if there's processing */}
      <ProcessingStatusBar
        eventId={eventId}
        eventName={eventName}
        onRetryFailed={onRetryFailed}
        onComplete={refreshStats}
      />

      {/* User Stats Card - only show if user has completed cards OR is loading with previous data */}
      {(hasUserCards || isLoading) && (
        <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Your Cards for {eventName}
              </h3>
              <p className="text-xs text-gray-500">
                {userStats.total_user_cards} total scanned
                {userStats.archived > 0 && (
                  <span className="text-gray-400"> ({userStats.archived} archived)</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              )}
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Stats Layout - Flexible layout that fills available space */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Ready to Export */}
            {userStats.ready_for_export > 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg flex-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900">
                    {userStats.ready_for_export}
                  </div>
                  <div className="text-xs text-green-700">Ready</div>
                </div>
              </div>
            )}

            {/* Needs Review */}
            {userStats.needs_review > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg flex-1">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">
                    {userStats.needs_review}
                  </div>
                  <div className="text-xs text-yellow-700">Review</div>
                </div>
              </div>
            )}

            {/* Exported */}
            {userStats.exported > 0 && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg flex-1">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">
                    {userStats.exported}
                  </div>
                  <div className="text-xs text-blue-700">Exported</div>
                </div>
              </div>
            )}

            {/* Note: Archived cards (deleted cards) are not shown as "failed" on scan page
                 Only actual processing failures should be shown here */}
          </div>

        </CardContent>
      </Card>
      )}
    </div>
  );
}