import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCardsOverride } from '@/hooks/useCardsOverride';
import { getEventCardStats, CardStats } from '@/lib/getEventCardStats';
import type { ProspectCard } from '@/types/card';

interface UserCardStats extends CardStats {
  user_cards: ProspectCard[];
  total_user_cards: number;
}

/**
 * Hook to get card statistics specific to the current user for a given event
 */
export function useUserCardStats(eventId?: string) {
  const { profile } = useAuth();
  const { cards, isLoading, fetchCards } = useCardsOverride(eventId);
  const [userStats, setUserStats] = useState<UserCardStats>({
    total_cards: 0,
    needs_review: 0,
    ready_for_export: 0,
    exported: 0,
    archived: 0,
    user_cards: [],
    total_user_cards: 0,
  });

  const calculateUserStats = useCallback(() => {
    if (!cards || !profile?.id || !eventId) {
      setUserStats({
        total_cards: 0,
        needs_review: 0,
        ready_for_export: 0,
        exported: 0,
        archived: 0,
        user_cards: [],
        total_user_cards: 0,
      });
      return;
    }

    // Filter cards for this specific user and event
    const userCards = cards.filter(card =>
      card.user_id === profile.id && card.event_id === eventId
    );

    // Calculate stats using the same logic as the main dashboard
    const stats = getEventCardStats(userCards);

    setUserStats({
      ...stats,
      user_cards: userCards,
      total_user_cards: userCards.length,
    });

    // Debug logging removed for production
  }, [cards, profile?.id, eventId]);

  useEffect(() => {
    calculateUserStats();
  }, [calculateUserStats]);

  return {
    userStats,
    isLoading,
    refreshStats: fetchCards,
  };
}