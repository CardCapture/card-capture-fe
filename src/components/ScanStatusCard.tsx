import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  RotateCcw
} from "lucide-react";
import { useUserCardStats } from "@/hooks/useUserCardStats";
import { ProcessingStatusBar } from "@/components/ProcessingStatusBar";

interface ScanStatusCardProps {
  eventId: string;
  eventName: string;
  onRetryFailed?: () => void;
  className?: string;
}

export function ScanStatusCard({
  eventId,
  eventName,
  onRetryFailed,
  className = ""
}: ScanStatusCardProps) {
  const { userStats, isLoading } = useUserCardStats(eventId);

  if (isLoading) {
    return null;
  }

  // Don't show if user hasn't scanned any cards yet
  if (userStats.total_user_cards === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Processing Status Bar - reuse existing component */}
      <ProcessingStatusBar
        eventId={eventId}
        eventName={eventName}
        onRetryFailed={onRetryFailed}
      />

      {/* User Stats Card */}
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
            <FileText className="h-5 w-5 text-gray-400" />
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
    </div>
  );
}