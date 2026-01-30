import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { CardService } from '@/services/CardService';
import { toast } from '@/lib/toast';

interface UseAIRetryReturn {
  retryCard: (documentId: string) => Promise<void>;
  isRetrying: boolean;
  retryError: string | null;
  clearRetryError: () => void;
}

export function useAIRetry(onSuccess?: () => void): UseAIRetryReturn {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const retryCard = useCallback(async (documentId: string) => {
    if (!documentId) {
      const errorMsg = 'Document ID is required for retry';
      setRetryError(errorMsg);
      toast.error(errorMsg, 'Retry Failed');
      return;
    }

    setIsRetrying(true);
    setRetryError(null);

    try {
      await CardService.retryAIProcessing(documentId);
      toast.success('AI processing retry initiated successfully', 'Retry Started');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry AI processing';
      setRetryError(errorMessage);
      toast.error(errorMessage, 'Retry Failed');
      logger.error('AI retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [onSuccess]);

  const clearRetryError = useCallback(() => {
    setRetryError(null);
  }, []);

  return {
    retryCard,
    isRetrying,
    retryError,
    clearRetryError,
  };
}

export default useAIRetry; 