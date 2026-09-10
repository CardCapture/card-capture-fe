import { useCallback } from "react";
import type { ProspectCard } from "@/types/card";
import { authFetch } from "@/lib/authFetch";
import { logger } from '@/utils/logger';

export function useCardTableActions(
  filteredCards: ProspectCard[],
  fetchCards: () => void,
  toast: (args: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  selectedEvent: { name: string; id: string; school_id: string; slate_event_id?: string | null } | null
) {
  const handleArchiveSelected = useCallback(async (idsToArchive: string[]) => {
    try {
      if (!idsToArchive || idsToArchive.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to archive.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(`${apiBaseUrl}/archive-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_ids: idsToArchive,
          status: "archived",
          review_status: "archived"
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to archive cards");
      }
      await fetchCards();
      toast({
        title: "Success",
        description: `${idsToArchive.length} card${idsToArchive.length === 1 ? '' : 's'} have been archived`,
      });
    } catch (error) {
      logger.error("Error archiving cards:", error);
      toast({
        title: "Error",
        description: "Failed to archive cards",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards]);

  const handleExportSelected = useCallback(async (idsToExport: string[]) => {
    try {
      if (!idsToExport || idsToExport.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to export.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(`${apiBaseUrl}/mark-exported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: idsToExport }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark cards as exported");
      }
      await fetchCards();
      toast({
        title: "Export Successful",
        description: `${idsToExport.length} ${idsToExport.length === 1 ? "card" : "cards"} exported successfully.`,
        variant: "default",
      });
    } catch (error) {
      logger.error("Error exporting cards:", error);
      toast({
        title: "Export Failed",
        description: "Something went wrong while exporting cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards]);

  const handleExportToSlate = useCallback(async (idsToExport: string[]) => {
    try {
      if (!idsToExport || idsToExport.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to export to Slate.",
          variant: "destructive",
        });
        return;
      }

      if (!selectedEvent?.school_id) {
        toast({
          title: "Missing School Information",
          description: "Cannot export to Slate without school configuration.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Exporting to Slate",
        description: "Preparing data for Slate export...",
        variant: "default",
      });

      // Find the selected cards from filteredCards
      const selectedCards = filteredCards.filter((card) => 
        idsToExport.includes(card.document_id) // Use document_id for consistency
      );

      if (selectedCards.length === 0) {
        toast({
          title: "No Cards Found",
          description: "Selected cards could not be found for export.",
          variant: "destructive",
        });
        return;
      }

      // Prepare the data in the format expected by the Slate export service
      const exportData = selectedCards.map((card) => ({
        id: card.document_id, // Use document_id for the backend
        event_name: selectedEvent.name,
        slate_event_id: selectedEvent.slate_event_id,
        fields: card.fields
      }));

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(`${apiBaseUrl}/export-to-slate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_id: selectedEvent.school_id,
          rows: exportData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to export to Slate (${response.status})`);
      }

      const result = await response.json();

      // Mark cards as exported in the database
      const markExportedResponse = await authFetch(`${apiBaseUrl}/mark-exported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: idsToExport }),
      });
      
      if (!markExportedResponse.ok) {
        logger.warn("Failed to mark cards as exported, but Slate export was successful");
        // Don't throw error here since Slate export succeeded
      }
      
      // Refresh the cards data to reflect any status changes
      await fetchCards();
      
      toast({
        title: "Slate Export Successful",
        description: `${selectedCards.length} ${selectedCards.length === 1 ? "card" : "cards"} exported to Slate successfully.`,
        variant: "default",
      });

      logger.log("Slate export result:", result);

    } catch (error) {
      logger.error("Error exporting to Slate:", error);
      toast({
        title: "Slate Export Failed",
        description: error instanceof Error ? error.message : "Something went wrong while exporting to Slate. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards, selectedEvent, filteredCards]);

  const handleDeleteSelected = useCallback(async (idsToDelete: string[]) => {
    try {
      if (!idsToDelete || idsToDelete.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to delete.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await authFetch(`${apiBaseUrl}/delete-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: idsToDelete }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete cards");
      }
      await fetchCards();
      toast({
        title: "Success",
        description: `${idsToDelete.length} card${idsToDelete.length === 1 ? '' : 's'} have been deleted`,
      });
    } catch (error) {
      logger.error("Error deleting cards:", error);
      toast({
        title: "Error",
        description: "Failed to delete cards",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards]);

  const handleMoveSelected = useCallback(async (idsToMove: string[]) => {
    try {
      if (!idsToMove || idsToMove.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to move.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      // Send a single batch request to move all cards at once
      const response = await authFetch(`${apiBaseUrl}/move-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: idsToMove, status: "reviewed" }),
      });
      if (!response.ok) {
        throw new Error("Failed to move cards");
      }
      await fetchCards();
      toast({
        title: "Success",
        description: `${idsToMove.length} card${idsToMove.length === 1 ? '' : 's'} have been moved to Ready to Export`,
      });
    } catch (error) {
      logger.error("Error moving cards:", error);
      toast({
        title: "Error",
        description: "Failed to move cards",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards]);


  return {
    handleArchiveSelected,
    handleExportSelected,
    handleExportToSlate,
    handleDeleteSelected,
    handleMoveSelected,
  };
}
