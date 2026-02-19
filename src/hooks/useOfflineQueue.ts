import { useState, useEffect, useCallback } from 'react';
import { offlineQueue, type PendingCard, type PendingQRScan } from '@/services/offlineQueue';
import { syncService, type SyncStatus } from '@/services/syncService';

export interface OfflineQueueState {
  pendingCards: PendingCard[];
  pendingCount: number;
  pendingQRScans: PendingQRScan[];
  pendingQRCount: number;
  isLoading: boolean;
  syncStatus: SyncStatus;
  addCard: (card: Omit<PendingCard, 'id' | 'timestamp' | 'retryCount'>) => Promise<number>;
  addQRScan: (scan: Omit<PendingQRScan, 'id' | 'timestamp' | 'retryCount'>) => Promise<number>;
  removeCard: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshQueue: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

export function useOfflineQueue(): OfflineQueueState {
  const [pendingCards, setPendingCards] = useState<PendingCard[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingQRScans, setPendingQRScans] = useState<PendingQRScan[]>([]);
  const [pendingQRCount, setPendingQRCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    pendingQRCount: 0,
    progress: 0,
  });

  const refreshQueue = useCallback(async () => {
    setIsLoading(true);
    try {
      const cards = await offlineQueue.getPendingCards();
      const cardCount = await offlineQueue.getPendingCount();
      const qrScans = await offlineQueue.getPendingQRScans();
      const qrCount = await offlineQueue.getPendingQRCount();
      setPendingCards(cards);
      setPendingCount(cardCount);
      setPendingQRScans(qrScans);
      setPendingQRCount(qrCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCard = useCallback(async (card: Omit<PendingCard, 'id' | 'timestamp' | 'retryCount'>) => {
    const id = await offlineQueue.addCard(card);
    await refreshQueue();
    return id;
  }, [refreshQueue]);

  const addQRScan = useCallback(async (scan: Omit<PendingQRScan, 'id' | 'timestamp' | 'retryCount'>) => {
    const id = await offlineQueue.addQRScan(scan);
    await refreshQueue();
    return id;
  }, [refreshQueue]);

  const removeCard = useCallback(async (id: number) => {
    await offlineQueue.removeCard(id);
    await refreshQueue();
  }, [refreshQueue]);

  const clearAll = useCallback(async () => {
    await offlineQueue.clearAll();
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
      setPendingQRCount(status.pendingQRCount);
    });

    return unsubscribe;
  }, []);

  return {
    pendingCards,
    pendingCount,
    pendingQRScans,
    pendingQRCount,
    isLoading,
    syncStatus,
    addCard,
    addQRScan,
    removeCard,
    clearAll,
    refreshQueue,
    triggerSync,
  };
}
