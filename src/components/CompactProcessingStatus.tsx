import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, X, Pause } from "lucide-react";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";
import { toast } from "@/lib/toast";

interface CompactProcessingStatusProps {
  eventId: string;
  className?: string;
  onRetryFailed?: () => Promise<void> | void;
  onStopProcessing?: () => Promise<void> | void;
  onDismissFailure?: () => Promise<void> | void;
}

export function CompactProcessingStatus({ 
  eventId, 
  className = "",
  onRetryFailed,
  onStopProcessing,
  onDismissFailure
}: CompactProcessingStatusProps) {
  const { status, loading, refresh } = useProcessingStatus(eventId);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isStopping, setStopping] = useState(false);

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
  const hasActiveProcessing = totalActive > 0;

  // Handle retry failed cards
  const handleRetry = async () => {
    if (!onRetryFailed || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await Promise.resolve(onRetryFailed());
      toast.success(`Retrying ${status.failed} failed cards`);
    } catch (error) {
      console.error('Failed to retry processing:', error);
      toast.error('Failed to retry processing');
    } finally {
      setIsRetrying(false);
    }
  };

  // Handle stop processing
  const handleStop = async () => {
    if (!onStopProcessing || isStopping) return;
    
    setStopping(true);
    try {
      await Promise.resolve(onStopProcessing());
      toast.success('Processing stopped');
    } catch (error) {
      console.error('Failed to stop processing:', error);
      toast.error('Failed to stop processing');
    } finally {
      setStopping(false);
    }
  };

  // Handle dismiss failure
  const handleDismiss = async () => {
    if (!onDismissFailure) return;
    
    try {
      console.log('🗑️ Dismissing failure state...');
      await Promise.resolve(onDismissFailure());
      
      // Small delay to ensure database changes propagate
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force refresh the processing status to update UI immediately
      console.log('🔄 Refreshing processing status after dismiss...');
      await refresh();
      
      toast.success('Failure dismissed');
    } catch (error) {
      console.error('Failed to dismiss failure:', error);
      toast.error('Failed to dismiss failure');
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 ${className}`}>
      {/* Main Status Line */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Loader2 className={`h-4 w-4 ${showFailedState ? 'text-red-500' : 'text-blue-500'} ${showFailedState ? '' : 'animate-spin'}`} />
          </div>
          <span className={`text-sm font-medium ${showFailedState ? 'text-red-700' : 'text-gray-700'}`}>
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
        
        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Stop button for active processing */}
          {hasActiveProcessing && onStopProcessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              disabled={isStopping}
              className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Stop processing"
            >
              {isStopping ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pause className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {/* Retry button for failed state */}
          {showFailedState && onRetryFailed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Retry failed processing"
            >
              {isRetrying ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
            </Button>
          )}
          
          {/* Dismiss button for failed state */}
          {showFailedState && onDismissFailure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 px-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              title="Dismiss failure"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
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