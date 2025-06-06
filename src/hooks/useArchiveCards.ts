import { useCallback, useState } from "react";
import { toast } from "@/lib/toast";
import { CardService } from "@/services/CardService";

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
      toast.info("Processing your archive request...", "Archiving Cards");

      await CardService.archiveCards(documentIds);

      toast.success(
        `Successfully archived ${documentIds.length} ${
          documentIds.length === 1 ? "card" : "cards"
        }.`,
        "Archive Complete"
      );
    } catch (error) {
      console.error("Error archiving cards:", error);
      toast.error(
        "Failed to archive cards. Please try again.",
        "Archive Failed"
      );
    } finally {
      setIsArchiving(false);
    }
  }, []);

  return {
    archiveCards,
    isArchiving,
  };
}
