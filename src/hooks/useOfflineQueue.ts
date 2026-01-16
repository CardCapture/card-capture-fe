import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, type PendingCard } from '@/services/offlineQueue';
import { syncService, type SyncStatus } from '@/services/syncService';

export interface OfflineQueueState {
  pendingCards: PendingCard[];
  pendingCount: number;
  isLoading: boolean;
  syncStatus: SyncStatus;
  addCard: (card: Omit<PendingCard, 'id' | 'timestamp' | 'retryCount'>) => Promise<number>;
  removeCard: (id: number) => Promise<void>;
  refreshQueue: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

export function useOfflineQueue(): OfflineQueueState {
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    progress: 0,
  });

  const refreshQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const cards = await offlineQueue.getPendingCards();
      const count = await offlineQueue.getPendingCount();
      setPendingCards(cards);
      setPendingCount(count);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCard = useCallback(async (card: Omit<PendingCard, 'id' | 'timestamp' | 'retryCount'>) => {
    const id = await offlineQueue.addCard(card);
    await refreshQueue();
    return id;
  }, [refreshQueue]);

  const removeCard = useCallback(async (id: number) => {
    await offlineQueue.removeCard(id);
    await refreshQueue();
  }, [refreshQueue]);

  const triggerSync = useCallback(async () => {
    await syncService.manualSync();
    await refreshQueue();
  }, [refreshQueue]);

  // Initial load
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  // Subscribe to sync status updates
  useEffect(() => {
    const unsubscribe = syncService.subscribe((status) => {
      setSyncStatus(status);
      setPendingCount(status.pendingCount);
    });

    return unsubscribe;
  }, []);

  return {
    pendingCards,
    pendingCount,
    isLoading,
    syncStatus,
    addCard,
    removeCard,
    refreshQueue,
    triggerSync,
  };
}
