import { ProspectCard, CardStatus, FieldData } from '@/types/card';

/**
 * Determines if all fields in a card have been reviewed
 */
export function areAllFieldsReviewed(fields: Record<string, FieldData>): boolean {
  return Object.values(fields).every(field => 
    !field.requires_human_review || field.reviewed
  );
}

/**
 * Determines if any fields in a card need human review
 */
export function hasFieldsNeedingReview(fields: Record<string, FieldData>): boolean {
  return Object.values(fields).some(field => 
    field.requires_human_review && !field.reviewed
  );
}

/**
 * Determines if a card has AI processing failure
 */
export function isAIFailed(card: ProspectCard): boolean {
  return card.review_status === 'ai_failed';
}

/**
 * Determines the current status of a card based on its fields and metadata
 */
export function determineCardStatus(card: ProspectCard): CardStatus | null {
  // Debug logging removed for performance

  // Check review_status first - this is the source of truth
  if (card.review_status) {
    const status = card.review_status as CardStatus;
    return status;
  }

  // Check if any fields need review next
  if (card.fields && hasFieldsNeedingReview(card.fields)) {
    return 'needs_human_review';
  }

  // If not archived but exported, show as exported
  if (card.exported_at) {
    return 'exported';
  }

  // Default to needs review if we can't determine the status
  return 'needs_human_review';
} 