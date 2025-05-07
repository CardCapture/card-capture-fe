import { ProspectCard } from '@/types/card';
import { determineCardStatus } from './cardUtils';

export interface CardStats {
  total_cards: number;
  needs_review: number;
  ready_for_export: number;
  exported: number;
  archived: number;
}

/**
 * Calculates card statistics for an event or group of cards using the same logic as the main Dashboard.
 * This ensures consistent counting across all views in the application.
 */
export function getEventCardStats(cards: ProspectCard[]): CardStats {
  console.log('🔍 getEventCardStats called with:', {
    cardCount: cards?.length || 0,
    firstCard: cards?.[0] ? { 
      id: cards[0].id,
      review_status: cards[0].review_status,
      exported_at: cards[0].exported_at,
      event_id: cards[0].event_id
    } : null
  });

  if (!Array.isArray(cards)) {
    return {
      total_cards: 0,
      needs_review: 0,
      ready_for_export: 0,
      exported: 0,
      archived: 0
    };
  }

  const stats: CardStats = {
    total_cards: cards.length,
    needs_review: 0,
    ready_for_export: 0,
    exported: 0,
    archived: 0
  };

  cards.forEach(card => {
    const status = determineCardStatus(card);
    console.log('📊 Card status:', {
      id: card.id,
      review_status: card.review_status,
      determinedStatus: status,
      exported_at: card.exported_at,
      event_id: card.event_id
    });

    switch (status) {
      case 'needs_human_review':
        stats.needs_review++;
        break;
      case 'reviewed':
        stats.ready_for_export++;
        break;
      case 'exported':
        stats.exported++;
        break;
      case 'archived':
        stats.archived++;
        break;
    }
  });

  console.log('✅ Final stats:', { stats });
  return stats;
} 