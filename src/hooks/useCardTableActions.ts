import { useState, useCallback } from "react";
import type { ProspectCard } from "@/types/card";

export function useCardTableActions(
  filteredCards: ProspectCard[],
  fetchCards: () => void,
  toast: (args: {
    title: string;
    description: string;
    variant?: string;
  }) => void,
  selectedEvent: { name: string } | null,
  dataFieldsMap: Map<string, string>
) {
  const [rowSelection, setRowSelection] = useState({});
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const handleArchiveSelected = useCallback(async () => {
    try {
      if (selectedCardIds.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to archive.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/archive-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedCardIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to archive cards");
      }
      setRowSelection({});
      setSelectedCardIds([]);
      await fetchCards();
      toast({
        title: "Success",
        description: "Selected cards have been archived",
      });
    } catch (error) {
      console.error("Error archiving cards:", error);
      toast({
        title: "Error",
        description: "Failed to archive cards",
        variant: "destructive",
      });
    }
  }, [selectedCardIds, toast, fetchCards]);

  const handleExportSelected = useCallback(async () => {
    try {
      if (selectedCardIds.length === 0) {
        toast({
          title: "No Cards Selected",
          description: "Please select at least one card to export.",
          variant: "destructive",
        });
        return;
      }
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/mark-exported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_ids: selectedCardIds }),
      });
      if (!response.ok) {
        throw new Error("Failed to mark cards as exported");
      }
      setRowSelection({});
      setSelectedCardIds([]);
      await fetchCards();
      toast({
        title: "Export Successful",
        description: `${selectedCardIds.length} ${
          selectedCardIds.length === 1 ? "card" : "cards"
        } exported successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting cards:", error);
      toast({
        title: "Export Failed",
        description:
          "Something went wrong while exporting cards. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedCardIds, toast, fetchCards, selectedEvent, dataFieldsMap]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      const selectedIds = Object.keys(rowSelection).map((index) => {
        const card = filteredCards[parseInt(index)];
        return card.id;
      });
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/delete-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_ids: selectedIds,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete cards");
      }
      setRowSelection({});
      await fetchCards();
      toast({
        title: "Success",
        description: "Selected cards have been deleted",
      });
    } catch (error) {
      console.error("Error deleting cards:", error);
      toast({
        title: "Error",
        description: "Failed to delete cards",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  const handleMoveSelected = useCallback(async () => {
    try {
      const selectedIds = Object.keys(rowSelection).map((index) => {
        const card = filteredCards[parseInt(index)];
        return card.id;
      });
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      for (const documentId of selectedIds) {
        const response = await fetch(
          `${apiBaseUrl}/save-review/${documentId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "reviewed",
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to move cards");
        }
      }
      setRowSelection({});
      await fetchCards();
      toast({
        title: "Success",
        description: "Selected cards have been moved to Ready to Export",
      });
    } catch (error) {
      console.error("Error moving cards:", error);
      toast({
        title: "Error",
        description: "Failed to move cards",
        variant: "destructive",
      });
    }
  }, [rowSelection, filteredCards, toast, fetchCards]);

  const downloadCSV = useCallback(
    async (table) => {
      try {
        const selectedRows = table
          .getRowModel()
          .rows.filter((row) => rowSelection[row.id]);
        if (selectedRows.length === 0) {
          toast({
            title: "No Cards Selected",
            description: "Please select at least one card to export.",
            variant: "destructive",
          });
          return;
        }
        const selectedIds = selectedRows.map((row) => row.original.id);
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
        const headers = ["Event", ...Array.from(dataFieldsMap.values())];
        const csvContent = [
          headers.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
          ...selectedRows.map((row) => {
            const eventName = String(selectedEvent?.name || "Unknown Event");
            const fields = row.original.fields as Record<
              string,
              { value: string }
            >;
            return [
              `"${eventName.replace(/"/g, '""')}"`,
              ...Array.from(dataFieldsMap.keys()).map(
                (key) =>
                  `"${String(fields?.[key]?.value ?? "").replace(/"/g, '""')}"`
              ),
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
        setRowSelection({});
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
    [rowSelection, dataFieldsMap, toast, fetchCards, selectedEvent]
  );

  return {
    rowSelection,
    setRowSelection,
    selectedCardIds,
    setSelectedCardIds,
    handleArchiveSelected,
    handleExportSelected,
    handleDeleteSelected,
    handleMoveSelected,
    downloadCSV,
  };
}
