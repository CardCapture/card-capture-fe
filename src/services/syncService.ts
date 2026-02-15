import { offlineQueue, type PendingCard } from './offlineQueue';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { logger } from '@/utils/logger';
import { fetchWithRetry } from '@/utils/retry';

const MAX_RETRIES = 3;

type SyncListener = (status: SyncStatus) => void;

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  currentCard?: PendingCard;
  progress: number; // 0-100
  lastSyncTime?: number;
}

class SyncService {
  private listeners: Set<SyncListener> = new Set();
  private isSyncing = false;
  private syncStatus: SyncStatus = {
    isSyncing: false,
    pendingCount: 0,
    progress: 0,
  };

  constructor() {
    this.initNetworkListener();
  }

  private async initNetworkListener() {
    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', async (status) => {
        if (status.connected) {
          logger.log('[SyncService] Network connected, starting sync...');
          await this.syncPendingCards();
        }
      });
    } else {
      window.addEventListener('online', async () => {
        logger.log('[SyncService] Browser online, starting sync...');
        await this.syncPendingCards();
      });
    }
  }

  /**
   * Subscribe to sync status updates
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Immediately send current status
    listener(this.syncStatus);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncStatus));
  }

  private updateStatus(updates: Partial<SyncStatus>) {
    this.syncStatus = { ...this.syncStatus, ...updates };
    this.notifyListeners();
  }

  /**
   * Sync all pending cards to the server
   */
  async syncPendingCards(): Promise<void> {
    if (this.isSyncing) {
      logger.log('[SyncService] Sync already in progress');
      return;
    }

    const pendingCards = await offlineQueue.getPendingCards();
    if (pendingCards.length === 0) {
      this.updateStatus({ pendingCount: 0, isSyncing: false });
      return;
    }

    this.isSyncing = true;
    this.updateStatus({
      isSyncing: true,
      pendingCount: pendingCards.length,
      progress: 0,
    });

    let successCount = 0;
    const total = pendingCards.length;

    for (const card of pendingCards) {
      if (!card.id) continue;

      this.updateStatus({
        currentCard: card,
        progress: Math.round((successCount / total) * 100),
      });

      try {
        await this.uploadCard(card);
        await offlineQueue.removeCard(card.id);
        successCount++;
        logger.log(`[SyncService] Uploaded card ${card.id} (${successCount}/${total})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        logger.error(`[SyncService] Failed to upload card ${card.id}:`, errorMessage);

        if (card.retryCount >= MAX_RETRIES) {
          logger.warn(`[SyncService] Card ${card.id} exceeded max retries, keeping in queue`);
        }
        await offlineQueue.markRetry(card.id, errorMessage);
      }
    }

    this.isSyncing = false;
    const remaining = await offlineQueue.getPendingCount();
    this.updateStatus({
      isSyncing: false,
      pendingCount: remaining,
      progress: 100,
      currentCard: undefined,
      lastSyncTime: Date.now(),
    });

    logger.log(`[SyncService] Sync complete. ${successCount}/${total} uploaded, ${remaining} remaining.`);
  }

  private async uploadCard(card: PendingCard): Promise<void> {
    // Convert base64 to blob
    const response = await fetch(card.imageData);
    const blob = await response.blob();
    const file = new File([blob], `card-${card.timestamp}.jpg`, { type: 'image/jpeg' });

    // Get auth token from localStorage (Supabase stores it there)
    const authData = localStorage.getItem('supabase.auth.token');
    let accessToken = '';
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        accessToken = parsed.currentSession?.access_token || '';
      } catch {
        // Try alternative storage key
        const altKey = Object.keys(localStorage).find(k => k.includes('supabase') && k.includes('auth'));
        if (altKey) {
          try {
            const altData = JSON.parse(localStorage.getItem(altKey) || '{}');
            accessToken = altData.access_token || '';
          } catch {
            logger.error('[SyncService] Could not parse auth token');
          }
        }
      }
    }

    if (!accessToken) {
      throw new Error('No auth token available');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', card.eventId);
    formData.append('school_id', card.schoolId);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    await fetchWithRetry(
      () =>
        fetch(`${apiBaseUrl}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }),
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, maxRetries) => {
          logger.log(`[SyncService] Retry attempt ${attempt}/${maxRetries} for card ${card.id}`);
        },
      },
    );
  }

  /**
   * Get current pending count
   */
  async getPendingCount(): Promise<number> {
    return offlineQueue.getPendingCount();
  }

  /**
   * Manually trigger sync
   */
  async manualSync(): Promise<void> {
    await this.syncPendingCards();
  }
}

// Singleton instance
export const syncService = new SyncService();
