import { ProspectCard, CardStatus, FieldDetail } from '@/types/card';

/**
 * Determines if all fields in a card have been reviewed
 */
export function areAllFieldsReviewed(fields: Record<string, FieldDetail>): boolean {
  return Object.values(fields).every(field => 
    !field.requires_human_review || field.reviewed
  );
}

/**
 * Determines if any fields in a card need human review
 */
export function hasFieldsNeedingReview(fields: Record<string, FieldDetail>): boolean {
  return Object.values(fields).some(field => 
    field.requires_human_review && !field.reviewed
  );
}

/**
 * Determines the current status of a card based on its fields and metadata
 */
export function determineCardStatus(card: ProspectCard): CardStatus | null {
  // If the card has been deleted, return null to exclude it from counts
  if (card.deleted_at) {
    return null;
  }

  // If the card has been explicitly archived, respect that state
  if (card.review_status === 'archived') {
    return 'archived';
  }

  // If not archived but exported, show as exported
  if (card.exported_at) {
    return 'exported';
  }

  // Check if any fields need review
  if (card.fields && hasFieldsNeedingReview(card.fields)) {
    return 'needs_human_review';
  }

  // Return the review_status if it's set
  if (card.review_status) {
    return card.review_status;
  }

  // Default to needs review if we can't determine the status
  return 'needs_human_review';
} 