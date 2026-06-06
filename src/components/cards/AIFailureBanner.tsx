import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AIFailureBannerProps {
  onRetry: () => void;
  isRetrying: boolean;
  errorMessage?: string;
  onDismiss?: () => void;
  className?: string;
}

export const AIFailureBanner: React.FC<AIFailureBannerProps> = ({
  onRetry,
  isRetrying,
  errorMessage,
  onDismiss,
  className = '',
}) => {
  const defaultMessage = "AI processing failed for this card. We're showing the basic OCR results. You can still edit the information manually or try processing again.";
  
  return (
    <Alert className={`border-status-review-border bg-status-review-soft ${className}`}>
      <AlertTriangle className="h-4 w-4 text-status-review-solid" />
      <div className="flex-1">
        <AlertDescription className="text-status-review-ink">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium mb-1">AI Processing Failed</p>
              <p className="text-sm text-status-review-ink/90">
                {errorMessage || defaultMessage}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="border-status-review-border text-status-review-ink hover:bg-status-review-soft"
              >
                {isRetrying ? (
                  <>
                    <RotateCcw className="h-3 w-3 mr-1 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Retry AI
                  </>
                )}
              </Button>
              {onDismiss && (
                <Button
                  onClick={onDismiss}
                  size="sm"
                  variant="ghost"
                  className="text-status-review-ink hover:bg-status-review-soft p-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default AIFailureBanner; 