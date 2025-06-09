import React from "react";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";

interface CompactProcessingStatusProps {
  eventId: string;
  className?: string;
}

export function CompactProcessingStatus({ 
  eventId, 
  className = ""
}: CompactProcessingStatusProps) {
  const { status, loading } = useProcessingStatus(eventId);

  // Don't render if no processing is happening
  if (!status.isProcessing && !loading) {
    return null;
  }

  // Calculate progress: processing cards out of total active cards (queued + processing)
  const totalActive = status.total; // queued + processing
  const currentlyProcessing = status.processing;
  const progressPercentage = totalActive > 0 ? (currentlyProcessing / totalActive) * 100 : 0;

  // Handle edge case: if we have failed cards but no active cards
  const hasFailedCards = status.failed > 0;
  const showFailedState = hasFailedCards && totalActive === 0;

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 ${className}`}>
      {/* Main Status Line */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        </div>
        <span className="text-sm font-medium text-gray-700">
          {showFailedState ? 'Processing Failed' : 'Processing'}
        </span>
        {!showFailedState && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span className="font-medium text-gray-900">{currentlyProcessing}</span>
            <span>of</span>
            <span className="font-medium text-gray-900">{totalActive}</span>
          </div>
        )}
        {showFailedState && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <span className="font-medium">{status.failed} failed</span>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
              showFailedState ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: showFailedState ? '100%' : `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      {/* Time Estimate Below */}
      {status.timeRemaining && (
        <div className="text-center">
          <span className="text-xs text-gray-500 font-medium">
            {status.timeRemaining}
          </span>
        </div>
      )}
    </div>
  );
} 