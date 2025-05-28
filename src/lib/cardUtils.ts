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
 * Determines the current status of a card based on its fields and metadata
 */
export function determineCardStatus(card: ProspectCard): CardStatus | null {
  // Debug logging for export status issues
  const shouldLog = card.review_status === 'exported' || card.exported_at;
  if (shouldLog) {
    console.log(`🔍 determineCardStatus for card ${card.id}:`, {
      review_status: card.review_status,
      exported_at: card.exported_at,
      hasFieldsNeedingReview: card.fields ? hasFieldsNeedingReview(card.fields) : 'no fields'
    });
  }

  // Check review_status first - this is the source of truth
  if (card.review_status) {
    const status = card.review_status as CardStatus;
    if (shouldLog) {
      console.log(`✅ Card ${card.id} status determined by review_status: ${status}`);
    }
    return status;
  }

  // Check if any fields need review next
  if (card.fields && hasFieldsNeedingReview(card.fields)) {
    if (shouldLog) {
      console.log(`⚠️ Card ${card.id} has fields needing review, returning 'needs_human_review'`);
    }
    return 'needs_human_review';
  }

  // If not archived but exported, show as exported
  if (card.exported_at) {
    if (shouldLog) {
      console.log(`📤 Card ${card.id} has exported_at but no review_status, returning 'exported'`);
    }
    return 'exported';
  }

  // Default to needs review if we can't determine the status
  if (shouldLog) {
    console.log(`❓ Card ${card.id} defaulting to 'needs_human_review'`);
  }
  return 'needs_human_review';
} 