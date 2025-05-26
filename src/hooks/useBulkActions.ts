import { useState, useCallback } from "react";
import { toast } from "@/lib/toast";

export function useBulkActions(
  fetchCards: () => void,
  clearSelection: () => void
) {
  const [isLoading, setIsLoading] = useState(false);
  
  const executeBulkAction = useCallback(async (
    action: 'archive' | 'export' | 'delete' | 'move',
    documentIds: string[],
    options?: { status?: string }
  ) => {
    if (documentIds.length === 0) {
      toast.required("at least one card selection");
      return false;
    }
    
    setIsLoading(true);
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const endpoints = {
        archive: '/archive-cards',
        export: '/mark-exported', 
        delete: '/delete-cards',
        move: '/move-cards'
      };
      
      const payloads = {
        archive: { document_ids: documentIds },
        export: { document_ids: documentIds },
        delete: { document_ids: documentIds },
        move: { document_ids: documentIds, status: options?.status || "reviewed" }
      };
      
      console.log(`🔄 ${action.toUpperCase()} Action:`, {
        action,
        documentIds,
        payload: payloads[action],
        endpoint: `${apiBaseUrl}${endpoints[action]}`
      });
      
      const response = await fetch(`${apiBaseUrl}${endpoints[action]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloads[action]),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} cards (${response.status})`);
      }
      
      const responseData = await response.json();
      console.log(`✅ ${action.toUpperCase()} Success:`, responseData);
      
      // Success - refresh data and clear selection
      await fetchCards();
      clearSelection();
      
      const actionLabels = {
        archive: 'archived',
        export: 'exported', 
        delete: 'deleted',
        move: 'moved'
      };
      
      toast.success(`${documentIds.length} card${documentIds.length === 1 ? '' : 's'} ${actionLabels[action]} successfully.`, "Success");
      
      return true;
      
    } catch (error) {
      console.error(`❌ ${action.toUpperCase()} Error:`, error);
      toast.error(`Failed to ${action} cards: ${error instanceof Error ? error.message : 'Unknown error'}`, "Error");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchCards, clearSelection]);
  
  return {
    isLoading,
    archiveCards: (ids: string[]) => executeBulkAction('archive', ids),
    exportCards: (ids: string[]) => executeBulkAction('export', ids),
    deleteCards: (ids: string[]) => executeBulkAction('delete', ids),
    moveCards: (ids: string[], status?: string) => executeBulkAction('move', ids, { status })
  };
} 