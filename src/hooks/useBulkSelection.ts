import { useState, useCallback, useEffect } from "react";
import type { ProspectCard } from "@/types/card";

export function useBulkSelection(filteredCards: ProspectCard[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggleSelection = useCallback((documentId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  }, []);
  
  const toggleAll = useCallback(() => {
    const allIds = filteredCards.map(card => card.document_id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(new Set()); // Clear all
    } else {
      setSelectedIds(new Set(allIds)); // Select all
    }
  }, [filteredCards, selectedIds]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  const selectCards = useCallback((documentIds: string[]) => {
    setSelectedIds(new Set(documentIds));
  }, []);
  
  const addToSelection = useCallback((documentIds: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      documentIds.forEach(id => next.add(id));
      return next;
    });
  }, []);
  
  const removeFromSelection = useCallback((documentIds: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      documentIds.forEach(id => next.delete(id));
      return next;
    });
  }, []);
  
  // Auto-cleanup invalid selections when cards change
  useEffect(() => {
    const validIds = new Set(filteredCards.map(card => card.document_id));
    setSelectedIds(prev => {
      const cleaned = new Set([...prev].filter(id => validIds.has(id)));
      return cleaned.size !== prev.size ? cleaned : prev;
    });
  }, [filteredCards]);
  
  // Get selected cards data
  const selectedCards = filteredCards.filter(card => selectedIds.has(card.document_id));
  
  return {
    // Selection state
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    selectedCards,
    
    // Selection checks
    isSelected: (documentId: string) => selectedIds.has(documentId),
    isAllSelected: filteredCards.length > 0 && filteredCards.every(card => selectedIds.has(card.document_id)),
    isSomeSelected: selectedIds.size > 0 && selectedIds.size < filteredCards.length,
    
    // Selection actions
    toggleSelection,
    toggleAll,
    clearSelection,
    selectCards,
    addToSelection,
    removeFromSelection,
  };
} 