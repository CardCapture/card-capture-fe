import React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";

interface ProcessingStatusBarProps {
  eventId: string;
  eventName: string;
  onRetryFailed?: () => void;
  className?: string;
}

export function ProcessingStatusBar({ 
  eventId, 
  eventName, 
  onRetryFailed,
  className = ""
}: ProcessingStatusBarProps) {
  const { status, loading } = useProcessingStatus(eventId);

  // Don't render if no processing is happening
  if (!status.isProcessing && !loading) {
    return null;
  }

  // Calculate progress from all processing jobs
  const activeJobs = status.total; // queued + processing + failed
  const completedJobs = status.completed;
  const totalJobs = activeJobs + completedJobs;
  const progressPercentage = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}>
      {/* Main Status Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            Processing cards for {eventName}
          </span>
        </div>
        
        {/* Retry button for failed cards */}
        {status.failed > 0 && onRetryFailed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetryFailed}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry {status.failed} failed
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <Progress 
          value={progressPercentage} 
          className="h-2 bg-blue-100"
        />
      </div>

      {/* Status Details */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-blue-700">
          <span>
            {completedJobs} of {totalJobs} processed
          </span>
          
          {status.processing > 0 && (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              {status.processing} processing
            </span>
          )}
          
          {status.queued > 0 && (
            <span>
              {status.queued} queued
            </span>
          )}
          
          {status.failed > 0 && (
            <span className="flex items-center gap-1 text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {status.failed} failed
            </span>
          )}
        </div>

        {/* Time Remaining */}
        {status.timeRemaining && (
          <span className="text-blue-600 font-medium">
            {status.timeRemaining}
          </span>
        )}
      </div>
    </div>
  );
} 