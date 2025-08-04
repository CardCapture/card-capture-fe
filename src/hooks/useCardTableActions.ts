import { useState, useCallback, useEffect } from "react";
import type { ProspectCard } from "@/types/card";
import { standardizeState } from "@/utils/stateUtils";

export function useCardTableActions(
  filteredCards: ProspectCard[],
  fetchCards: () => void,
  toast: (args: {
    title: string;
    description: string;
    variant?: "default" | "destructive";
  }) => void,
  selectedEvent: { name: string; id: string; school_id: string; slate_event_id?: string | null } | null,
  dataFieldsMap: Map<string, string>
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
      const response = await fetch(`${apiBaseUrl}/archive-cards`, {
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
      console.error("Error archiving cards:", error);
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
      const response = await fetch(`${apiBaseUrl}/mark-exported`, {
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
      console.error("Error exporting cards:", error);
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
      const response = await fetch(`${apiBaseUrl}/export-to-slate`, {
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
      
      // Refresh the cards data to reflect any status changes
      await fetchCards();
      
      toast({
        title: "Slate Export Successful",
        description: `${selectedCards.length} ${selectedCards.length === 1 ? "card" : "cards"} exported to Slate successfully.`,
        variant: "default",
      });

      console.log("Slate export result:", result);

    } catch (error) {
      console.error("Error exporting to Slate:", error);
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
      const response = await fetch(`${apiBaseUrl}/delete-cards`, {
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
      console.error("Error deleting cards:", error);
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
      const response = await fetch(`${apiBaseUrl}/move-cards`, {
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
      console.error("Error moving cards:", error);
      toast({
        title: "Error",
        description: "Failed to move cards",
        variant: "destructive",
      });
    }
  }, [toast, fetchCards]);

  const downloadCSV = useCallback(
    async (selectedIds: string[], table) => {
      try {
        if (!selectedIds || selectedIds.length === 0) {
          toast({
            title: "No Cards Selected",
            description: "Please select at least one card to export.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('=== downloadCSV Debug ===');
        console.log('selectedIds:', selectedIds);
        console.log('filteredCards length:', filteredCards.length);
        
        toast({
          title: "Exporting Cards",
          description: "Processing your export request...",
          variant: "default",
        });
        const apiBaseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/mark-exported`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ document_ids: selectedIds }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to mark cards as exported (${response.status})`
          );
        }
        
        // Find the selected cards from filteredCards instead of table rows
        const selectedCards = filteredCards.filter((card) => selectedIds.includes(card.id));
        console.log('selectedCards found:', selectedCards.length);
        
        // Helper function to split names
        const splitName = (fullName: string): { firstName: string; lastName: string } => {
          if (!fullName || typeof fullName !== 'string') {
            return { firstName: '', lastName: '' };
          }

          const trimmedName = fullName.trim();
          if (!trimmedName) {
            return { firstName: '', lastName: '' };
          }

          const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
          
          if (nameParts.length === 0) {
            return { firstName: '', lastName: '' };
          } else if (nameParts.length === 1) {
            return { firstName: nameParts[0], lastName: '' };
          } else if (nameParts.length === 2) {
            return { firstName: nameParts[0], lastName: nameParts[1] };
          } else {
            return { 
              firstName: nameParts[0], 
              lastName: nameParts.slice(1).join(' ') 
            };
          }
        };

        // Create modified field keys and headers that replace 'name' with 'first_name' and 'last_name'
        const modifiedFieldKeys: string[] = [];
        const modifiedHeaders: string[] = ["Event", "Slate Event ID"];
        
        Array.from(dataFieldsMap.keys()).forEach(key => {
          if (key === 'name') {
            modifiedFieldKeys.push('first_name', 'last_name');
            modifiedHeaders.push('First Name', 'Last Name');
          } else {
            modifiedFieldKeys.push(key);
            modifiedHeaders.push(dataFieldsMap.get(key) || key);
          }
        });

        const headers = modifiedHeaders;
        const csvContent = [
          headers.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
          ...selectedCards.map((card) => {
            const eventName = String(selectedEvent?.name || "Unknown Event");
            const fields = card.fields as Record<
              string,
              { value: string }
            >;
            return [
              `"${eventName.replace(/"/g, '""')}"`,
              `"${(selectedEvent?.slate_event_id || "").replace(/"/g, '""')}"`,
              ...modifiedFieldKeys.map((key) => {
                let value = "";
                if (key === 'first_name' || key === 'last_name') {
                  // Handle name splitting
                  const fullName = String(fields?.['name']?.value ?? "");
                  const { firstName, lastName } = splitName(fullName);
                  value = key === 'first_name' ? firstName : lastName;
                } else {
                  value = String(fields?.[key]?.value ?? "");
                  // Standardize state values for consistent CSV output
                  if (key === 'state') {
                    value = standardizeState(value);
                  }
                }
                return `"${value.replace(/"/g, '""')}"`;
              }),
            ].join(",");
          }),
        ].join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `card_data_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        await fetchCards();
        toast({
          title: "Export Successful",
          description: `${selectedIds.length} ${
            selectedIds.length === 1 ? "card" : "cards"
          } exported successfully.`,
          variant: "default",
        });
      } catch (error) {
        let message =
          "Something went wrong while exporting cards. Please try again.";
        if (error instanceof Error) message = error.message;
        toast({
          title: "Export Failed",
          description: message,
          variant: "destructive",
        });
      }
    },
    [dataFieldsMap, toast, fetchCards, selectedEvent, filteredCards]
  );

  return {
    handleArchiveSelected,
    handleExportSelected,
    handleExportToSlate,
    handleDeleteSelected,
    handleMoveSelected,
    downloadCSV,
  };
}
