import { useState, useCallback, useEffect } from "react";
import type { UserProfile } from "@/api/backend/users";

export function useBulkUserSelection(filteredUsers: UserProfile[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggleSelection = useCallback((userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);
  
  const toggleAll = useCallback(() => {
    const allIds = filteredUsers.map(user => user.id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds(new Set()); // Clear all
    } else {
      setSelectedIds(new Set(allIds)); // Select all
    }
  }, [filteredUsers, selectedIds]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  const selectUsers = useCallback((userIds: string[]) => {
    setSelectedIds(new Set(userIds));
  }, []);
  
  const addToSelection = useCallback((userIds: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      userIds.forEach(id => next.add(id));
      return next;
    });
  }, []);
  
  const removeFromSelection = useCallback((userIds: string[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      userIds.forEach(id => next.delete(id));
      return next;
    });
  }, []);
  
  // Auto-cleanup invalid selections when users change
  useEffect(() => {
    const validIds = new Set(filteredUsers.map(user => user.id));
    setSelectedIds(prev => {
      const cleaned = new Set([...prev].filter(id => validIds.has(id)));
      return cleaned.size !== prev.size ? cleaned : prev;
    });
  }, [filteredUsers]);
  
  // Get selected users data
  const selectedUsers = filteredUsers.filter(user => selectedIds.has(user.id));
  
  return {
    // Selection state
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    selectedUsers,
    
    // Selection checks
    isSelected: (userId: string) => selectedIds.has(userId),
    isAllSelected: filteredUsers.length > 0 && filteredUsers.every(user => selectedIds.has(user.id)),
    isSomeSelected: selectedIds.size > 0 && selectedIds.size < filteredUsers.length,
    
    // Selection actions
    toggleSelection,
    toggleAll,
    clearSelection,
    selectUsers,
    addToSelection,
    removeFromSelection,
  };
} 