import { cardsApi } from "@/api/backend/cards";
import { determineCardStatus, isAIFailed } from "@/lib/cardUtils";
import type { ProspectCard, CardStatus, FieldData } from "@/types/card";

export interface RawCardData {
  document_id?: string;
  id?: string;
  review_status?: string;
  created_at?: string;
  uploaded_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  exported_at?: string | null;
  fields?: Record<
    string,
    FieldData | { value: string; [key: string]: unknown }
  >;
  missing_fields?: string[];
  image_path?: string;
  event_id?: string;
  school_id?: string;
  user_id?: string;
  trimmed_image_path?: string;
  [key: string]: unknown;
}

export class CardService {
  /**
   * Get all cards with proper transformation
   */
  static async getAllCards(): Promise<ProspectCard[]> {
    try {
      const rawCards = await cardsApi.getCards();
      return this.transformCardsData(rawCards);
    } catch (error) {
      console.error("CardService: Failed to get all cards", error);
      throw error;
    }
  }

  /**
   * Get cards for a specific event
   */
  static async getCardsByEvent(eventId: string): Promise<ProspectCard[]> {
    try {
      const rawCards = await cardsApi.getCardsByEvent(eventId);
      return this.transformCardsData(rawCards);
    } catch (error) {
      console.error("CardService: Failed to get cards by event", error);
      throw error;
    }
  }

  /**
   * Upload card manually
   */
  static async uploadCardManually(
    cardData: Record<string, string>
  ): Promise<void> {
    try {
      await cardsApi.uploadCardManually(cardData);
    } catch (error) {
      console.error("CardService: Failed to upload card manually", error);
      throw error;
    }
  }

  /**
   * Archive multiple cards
   */
  static async archiveCards(documentIds: string[]): Promise<void> {
    try {
      if (!documentIds || documentIds.length === 0) {
        throw new Error("No cards provided for archiving");
      }
      await cardsApi.archiveCards(documentIds);
    } catch (error) {
      console.error("CardService: Failed to archive cards", error);
      throw error;
    }
  }

  /**
   * Mark cards as exported
   */
  static async markCardsAsExported(documentIds: string[]): Promise<void> {
    try {
      if (!documentIds || documentIds.length === 0) {
        throw new Error("No cards provided for export");
      }
      await cardsApi.markCardsAsExported(documentIds);
    } catch (error) {
      console.error("CardService: Failed to mark cards as exported", error);
      throw error;
    }
  }

  /**
   * Export cards to Slate
   */
  static async exportToSlate(
    schoolId: string,
    cards: ProspectCard[],
    eventName: string
  ): Promise<unknown> {
    try {
      if (!cards || cards.length === 0) {
        throw new Error("No cards provided for Slate export");
      }

      if (!schoolId) {
        throw new Error("School ID is required for Slate export");
      }

      // Transform cards for Slate export
      const rows = cards.map((card) => ({
        id: card.document_id,
        event_name: eventName,
        fields: card.fields,
      }));

      return await cardsApi.exportToSlate(schoolId, rows);
    } catch (error) {
      console.error("CardService: Failed to export to Slate", error);
      throw error;
    }
  }

  /**
   * Delete cards permanently
   */
  static async deleteCards(documentIds: string[]): Promise<void> {
    try {
      if (!documentIds || documentIds.length === 0) {
        throw new Error("No cards provided for deletion");
      }
      await cardsApi.deleteCards(documentIds);
    } catch (error) {
      console.error("CardService: Failed to delete cards", error);
      throw error;
    }
  }

  /**
   * Move cards to a different status
   */
  static async moveCards(
    documentIds: string[],
    status: string = "reviewed"
  ): Promise<void> {
    try {
      if (!documentIds || documentIds.length === 0) {
        throw new Error("No cards provided for moving");
      }
      await cardsApi.moveCards(documentIds, status);
    } catch (error) {
      console.error("CardService: Failed to move cards", error);
      throw error;
    }
  }

  /**
   * Retry AI processing for a failed card
   */
  static async retryAIProcessing(documentId: string): Promise<void> {
    try {
      if (!documentId || typeof documentId !== "string") {
        throw new Error("Valid document ID is required for AI retry");
      }
      await cardsApi.retryAIProcessing(documentId);
    } catch (error) {
      console.error("CardService: Failed to retry AI processing", error);
      throw error;
    }
  }

  /**
   * Check if a card has AI processing failure
   */
  static isAIFailed(card: ProspectCard): boolean {
    return isAIFailed(card);
  }

  /**
   * Get status count for cards
   */
  static getStatusCount(cards: ProspectCard[], status: CardStatus): number {
    if (!Array.isArray(cards)) return 0;

    return cards.filter((card) => {
      // For archived status, check the raw review_status directly
      if (status === "archived") {
        return card.review_status === "archived";
      }
      // For ai_failed status, check the raw review_status directly
      if (status === "ai_failed") {
        return card.review_status === "ai_failed";
      }
      const cardStatus = determineCardStatus(card);
      return cardStatus === status;
    }).length;
  }

  /**
   * Transform raw card data to ProspectCard format
   */
  static transformCardsData(rawCards: unknown[]): ProspectCard[] {
    return rawCards.map((item: unknown) => {
      const card = item as RawCardData;

      // Use the fields as they exist in the card data without adding artificial fields
      const fields = card.fields || {};
      
      // Only ensure the field data structure is consistent for existing fields
      const processedFields: Record<string, FieldData> = {};
      
      Object.entries(fields).forEach(([fieldKey, fieldData]) => {
        // Ensure each field has the required structure
        const processedField = fieldData as FieldData;
        processedFields[fieldKey] = {
          value: processedField.value || "",
          required: processedField.required || false,
          enabled: processedField.enabled !== undefined ? processedField.enabled : true,
          review_confidence: processedField.review_confidence || 0.0,
          requires_human_review: processedField.requires_human_review || false,
          review_notes: processedField.review_notes || "",
          confidence: processedField.confidence || 0.0,
          bounding_box: processedField.bounding_box || [],
          // Preserve other properties that might exist
          ...processedField
        };
      });

      const transformedCard: ProspectCard = {
        id:
          card.document_id ||
          card.id ||
          `unknown-${Math.random().toString(36).substring(7)}`,
        document_id:
          card.document_id ||
          card.id ||
          `unknown-${Math.random().toString(36).substring(7)}`,
        review_status: card.review_status || "needs_human_review",
        created_at:
          card.created_at || card.uploaded_at || new Date().toISOString(),
        updated_at:
          card.updated_at || card.reviewed_at || new Date().toISOString(),
        exported_at: card.exported_at || undefined,
        fields: processedFields,
        image_path: card.image_path,
        event_id: card.event_id,
        school_id: card.school_id || "",
        user_id: card.user_id,
        trimmed_image_path: card.trimmed_image_path,
      };

      return transformedCard;
    });
  }

  /**
   * Validate card data before operations
   */
  static validateCardIds(documentIds: string[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!documentIds || !Array.isArray(documentIds)) {
      errors.push("Document IDs must be an array");
    } else if (documentIds.length === 0) {
      errors.push("At least one document ID is required");
    } else {
      documentIds.forEach((id, index) => {
        if (!id || typeof id !== "string" || id.trim().length === 0) {
          errors.push(`Invalid document ID at index ${index}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
