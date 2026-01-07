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

class OfflineQueueDB extends Dexie {
  pendingCards!: Table<PendingCard>;

  constructor() {
    super('CardCaptureOfflineQueue');
    this.version(1).stores({
      pendingCards: '++id, eventId, timestamp',
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
  },

  /**
   * Get cards by event
   */
  async getCardsByEvent(eventId: string): Promise<PendingCard[]> {
    return db.pendingCards.where('eventId').equals(eventId).toArray();
  },
};

export default offlineQueue;
