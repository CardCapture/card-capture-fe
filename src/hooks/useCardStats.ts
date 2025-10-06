import { useMemo } from 'react';
import { ProspectCard } from '@/types/card';
import { determineCardStatus } from '@/lib/cardUtils';

export interface CardStats {
  total: number;
  needsReview: number;
  readyToExport: number;
  exported: number;
  archived: number;
}

export function useCardStats(cards: ProspectCard[]): CardStats {
  return useMemo(() => {
    const stats: CardStats = {
      total: 0,
      needsReview: 0,
      readyToExport: 0,
      exported: 0,
      archived: 0
    };

    if (!Array.isArray(cards)) return stats;

    cards.forEach(card => {
      const status = determineCardStatus(card);
      stats.total++;
      
      switch (status) {
        case 'needs_review':
          stats.needsReview++;
          break;
        case 'reviewed':
          stats.readyToExport++;
          break;
        case 'exported':
          stats.exported++;
          stats.readyToExport++; // Count exported cards in ready to export too
          break;
        case 'archived':
          stats.archived++;
          break;
      }
    });

    return stats;
  }, [cards]);
} 