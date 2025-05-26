import { useCallback, useState } from 'react';
import { toast } from '@/lib/toast';
import { authFetch } from "@/lib/authFetch";

interface UseArchiveCardsReturn {
  archiveCards: (documentIds: string[]) => Promise<void>;
  isArchiving: boolean;
}

export function useArchiveCards(): UseArchiveCardsReturn {
  const [isArchiving, setIsArchiving] = useState(false);

  const archiveCards = useCallback(async (documentIds: string[]) => {
    if (!documentIds.length) {
      toast.required("at least one card selection");
      return;
    }

    setIsArchiving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      toast.info("Processing your archive request...", "Archiving Cards");

      const response = await authFetch(`${apiBaseUrl}/archive-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_ids: documentIds })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive cards');
      }

      toast.success(`Successfully archived ${documentIds.length} ${documentIds.length === 1 ? 'card' : 'cards'}.`, "Archive Complete");
    } catch (error) {
      console.error('Error archiving cards:', error);
      toast.error("Failed to archive cards. Please try again.", "Archive Failed");
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return {
    archiveCards,
    isArchiving
  };
} 