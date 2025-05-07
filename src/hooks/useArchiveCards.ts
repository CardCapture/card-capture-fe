import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from "@/lib/authFetch";

interface UseArchiveCardsReturn {
  archiveCards: (documentIds: string[]) => Promise<void>;
  isArchiving: boolean;
}

export function useArchiveCards(): UseArchiveCardsReturn {
  const { toast } = useToast();
  const [isArchiving, setIsArchiving] = useState(false);

  const archiveCards = useCallback(async (documentIds: string[]) => {
    if (!documentIds.length) {
      toast({
        title: "No Cards Selected",
        description: "Please select at least one card to archive.",
        variant: "destructive",
      });
      return;
    }

    setIsArchiving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      
      toast({
        title: "Archiving Cards",
        description: "Processing your archive request...",
        variant: "default",
      });

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

      toast({
        title: "Archive Complete",
        description: `Successfully archived ${documentIds.length} ${documentIds.length === 1 ? 'card' : 'cards'}.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error archiving cards:', error);
      toast({
        title: "Archive Failed",
        description: "Failed to archive cards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsArchiving(false);
    }
  }, [toast]);

  return {
    archiveCards,
    isArchiving
  };
} 