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
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <div className="flex-1">
        <AlertDescription className="text-amber-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <p className="font-medium mb-1">AI Processing Failed</p>
              <p className="text-sm text-amber-700">
                {errorMessage || defaultMessage}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="border-amber-300 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
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
                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 p-1"
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