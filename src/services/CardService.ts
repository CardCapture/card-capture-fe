import { cardsApi } from "@/api/backend/cards";
import { determineCardStatus } from "@/lib/cardUtils";
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
   * Get status count for cards
   */
  static getStatusCount(cards: ProspectCard[], status: CardStatus): number {
    if (!Array.isArray(cards)) return 0;

    return cards.filter((card) => {
      // For archived status, check the raw review_status directly
      if (status === "archived") {
        return card.review_status === "archived";
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

      // Ensure all expected fields are present
      const fields = card.fields || {};
      const expectedFields = [
        "name",
        "preferred_first_name",
        "date_of_birth",
        "email",
        "cell",
        "permission_to_text",
        "address",
        "city",
        "state",
        "zip_code",
        "high_school",
        "class_rank",
        "students_in_class",
        "gpa",
        "student_type",
        "entry_term",
        "major",
      ];

      // Add missing fields with default values
      expectedFields.forEach((field) => {
        if (!fields[field]) {
          fields[field] = {
            value: "",
            required: false,
            enabled: true,
            review_confidence: 0.0,
            requires_human_review: false,
            review_notes: "",
            confidence: 0.0,
            bounding_box: [],
          };
        }
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
        fields: fields as Record<string, FieldData>,
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
