import Dexie, { type Table } from 'dexie';

export interface PendingCard {
  id?: number;
  imageData: string; // base64 image data
  eventId: string;
  eventName: string;
  schoolId: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface PendingQRScan {
  id?: number;
  token: string;
  eventId: string;
  eventName: string;
  rating?: number;
  notes?: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

class OfflineQueueDB extends Dexie {
  pendingCards!: Table<PendingCard>;
  pendingQRScans!: Table<PendingQRScan>;

  constructor() {
    super('CardCaptureOfflineQueue');
    this.version(1).stores({
      pendingCards: '++id, eventId, timestamp',
    });
    this.version(2).stores({
      pendingCards: '++id, eventId, timestamp',
      pendingQRScans: '++id, eventId, timestamp',
    });
  }
}

const db = new OfflineQueueDB();

export const offlineQueue = {
  /**
   * Add a card to the offline queue
   */
  async addCard(card: Omit<PendingCard, 'id' | 'timestamp' | 'retryCount'>): Promise<number> {
    const id = await db.pendingCards.add({
      ...card,
      timestamp: Date.now(),
      retryCount: 0,
    });
    return id as number;
  },

  /**
   * Get all pending cards
   */
  async getPendingCards(): Promise<PendingCard[]> {
    return db.pendingCards.orderBy('timestamp').toArray();
  },

  /**
   * Get count of pending cards
   */
  async getPendingCount(): Promise<number> {
    return db.pendingCards.count();
  },

  /**
   * Remove a card from the queue (after successful upload)
   */
  async removeCard(id: number): Promise<void> {
    await db.pendingCards.delete(id);
  },

  /**
   * Update retry count and error for a card
   */
  async markRetry(id: number, error: string): Promise<void> {
    const card = await db.pendingCards.get(id);
    if (card) {
      await db.pendingCards.update(id, {
        retryCount: card.retryCount + 1,
        lastError: error,
      });
    }
  },

  /**
   * Clear all pending cards (use with caution)
   */
  async clearAll(): Promise<void> {
    await db.pendingCards.clear();
    await db.pendingQRScans.clear();
  },

  /**
   * Get cards by event
   */
  async getCardsByEvent(eventId: string): Promise<PendingCard[]> {
    return db.pendingCards.where('eventId').equals(eventId).toArray();
  },

  // --- QR Scan queue methods ---

  /**
   * Add a QR scan to the offline queue
   */
  async addQRScan(scan: Omit<PendingQRScan, 'id' | 'timestamp' | 'retryCount'>): Promise<number> {
    const id = await db.pendingQRScans.add({
      ...scan,
      timestamp: Date.now(),
      retryCount: 0,
    });
    return id as number;
  },

  /**
   * Get all pending QR scans
   */
  async getPendingQRScans(): Promise<PendingQRScan[]> {
    return db.pendingQRScans.orderBy('timestamp').toArray();
  },

  /**
   * Get count of pending QR scans
   */
  async getPendingQRCount(): Promise<number> {
    return db.pendingQRScans.count();
  },

  /**
   * Remove a QR scan from the queue (after successful sync)
   */
  async removeQRScan(id: number): Promise<void> {
    await db.pendingQRScans.delete(id);
  },

  /**
   * Update retry count and error for a QR scan
   */
  async markQRRetry(id: number, error: string): Promise<void> {
    const scan = await db.pendingQRScans.get(id);
    if (scan) {
      await db.pendingQRScans.update(id, {
        retryCount: scan.retryCount + 1,
        lastError: error,
      });
    }
  },

  /**
   * Get QR scans by event
   */
  async getQRScansByEvent(eventId: string): Promise<PendingQRScan[]> {
    return db.pendingQRScans.where('eventId').equals(eventId).toArray();
  },

};

export default offlineQueue;
