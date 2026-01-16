import { authFetch } from "@/lib/authFetch";
import type { ProspectCard } from "@/types/card";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const cardsApi = {
  /**
   * Get all cards
   */
  async getCards(): Promise<ProspectCard[]> {
    const response = await authFetch(`${API_BASE_URL}/cards`);

    if (!response.ok) {
      throw new Error(`Failed to fetch cards (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Get cards for a specific event
   */
  async getCardsByEvent(eventId: string): Promise<ProspectCard[]> {
    const url = new URL(`${API_BASE_URL}/cards`);
    url.searchParams.append("event_id", eventId);

    const response = await authFetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch cards for event (${response.status})`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  /**
   * Upload card manually
   */
  async uploadCardManually(cardData: Record<string, string>): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/cards/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload card manually (${response.status})`);
    }
  },

  /**
   * Archive cards
   */
  async archiveCards(documentIds: string[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/archive-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        document_ids: documentIds,
        status: "archived",
        review_status: "archived",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to archive cards (${response.status})`);
    }
  },

  /**
   * Mark cards as exported
   */
  async markCardsAsExported(documentIds: string[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/mark-exported`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark cards as exported (${response.status})`);
    }
  },

  /**
   * Export cards to Slate
   */
  async exportToSlate(
    schoolId: string,
    rows: Array<{
      id: string;
      event_name: string;
      fields: Record<string, unknown>;
    }>
  ): Promise<unknown> {
    const response = await authFetch(`${API_BASE_URL}/export-to-slate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: schoolId,
        rows: rows,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to export to Slate (${response.status})`
      );
    }

    return response.json();
  },

  /**
   * Delete cards permanently
   */
  async deleteCards(documentIds: string[]): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/delete-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete cards (${response.status})`);
    }
  },

  /**
   * Move cards (change status)
   */
  async moveCards(
    documentIds: string[],
    status: string = "reviewed"
  ): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/move-cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds, status }),
    });

    if (!response.ok) {
      throw new Error(`Failed to move cards (${response.status})`);
    }
  },

  /**
   * Perform bulk actions on cards
   */
  async bulkAction(action: string, documentIds: string[]): Promise<void> {
    const endpoints: Record<string, string> = {
      archive: "/archive-cards",
      export: "/mark-exported",
      delete: "/delete-cards",
      move: "/move-cards",
    };

    const endpoint = endpoints[action];
    if (!endpoint) {
      throw new Error(`Unknown bulk action: ${action}`);
    }

    const response = await authFetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_ids: documentIds }),
    });

    if (!response.ok) {
      throw new Error(`Failed to perform bulk ${action} (${response.status})`);
    }
  },

  /**
   * Retry AI processing for a failed card
   */
  async retryAIProcessing(documentId: string): Promise<void> {
    const response = await authFetch(`${API_BASE_URL}/retry-ai-processing/${documentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to retry AI processing (${response.status})`
      );
    }
  },
};
