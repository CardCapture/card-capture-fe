// src/hooks/useCards.ts

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "@/lib/toast";
import type { ProspectCard, CardStatus } from "@/types/card";
import { useAuth } from "@/contexts/AuthContext";
import { CardService } from "@/services/CardService";
import { debounce } from "@/utils/debounce";
import { logger } from '@/utils/logger';

// Update the interface to use the new type
interface UseCardsReturn {
  cards: ProspectCard[];
  fetchCards: () => Promise<void>; // Expose fetchCards
  getStatusCount: (tabValue: CardStatus) => number;
  isLoading: boolean; // Add a loading state
  setReviewModalState: (isOpen: boolean) => void;
  retryAIProcessing: (documentId: string) => Promise<void>; // Add retry functionality
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useCards(): UseCardsReturn {
  const [cards, setCards] = useState<ProspectCard[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { session, profile } = useAuth();
  const schoolId = profile?.school_id || null;

  // Add a ref to track if we're in the review modal
  const isInReviewModalRef = useRef<boolean>(false);

  // Add refs for debouncing updates
  const lastUpdateRef = useRef<number>(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<boolean>(false);

  // Export a function to set the review modal state
  const setReviewModalState = useCallback((isOpen: boolean) => {
    logger.log(`Setting review modal state to: ${isOpen}`);
    isInReviewModalRef.current = isOpen;
  }, []);

  const fetchCards = useCallback(async () => {
    logger.log("Fetching cards via useCards hook...");
    setIsLoading(true);

    try {
      const cards = await CardService.getAllCards();
      setCards(cards);
    } catch (error) {
      logger.error("Error fetching cards:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
        "Error Fetching Cards"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial fetch
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Create debounced fetchCards to prevent rapid consecutive calls
  const debouncedFetchCards = useMemo(
    () => debounce(fetchCards, 500), // 500ms debounce
    [fetchCards]
  );

  // Effect for Supabase real-time subscription
  useEffect(() => {
    if (!supabase) {
      logger.warn(
        "Supabase client not available, real-time updates disabled."
      );
      return;
    }

    if (!schoolId) {
      logger.warn("No school ID available, skipping realtime subscription");
      return;
    }

    const channelName = `cards_changes_${schoolId}`;
    let channel: RealtimeChannel | null = null;

    const handleDbChange = (payload: {
      eventType: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      logger.log("Supabase change received:", payload);

      // Additional client-side filtering to ensure change is relevant
      const newRecord = payload.new;
      const oldRecord = payload.old;

      // Only refetch if the change is for our school
      const isRelevant =
        (newRecord && newRecord.school_id === schoolId) ||
        (oldRecord && oldRecord.school_id === schoolId);

      if (isRelevant) {
        logger.log("Relevant change detected for school:", schoolId);
        // Use debounced fetch to prevent multiple rapid updates
        debouncedFetchCards();
      } else {
        logger.log("Ignoring change - not for our school");
      }
    };

    // Subscribe to both tables with server-side filtering by school_id
    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "reviewed_data",
          filter: `school_id=eq.${schoolId}`, // Server-side filtering!
        },
        handleDbChange
      )
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "student_school_interactions",
          filter: `school_id=eq.${schoolId}`, // Server-side filtering!
        },
        handleDbChange
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          logger.log(
            `Supabase channel '${channelName}' subscribed successfully!`
          );
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          logger.error(`Supabase channel error: ${status}`, err);
          // Attempt to reconnect
          setTimeout(() => {
            logger.log("Attempting to reconnect...");
            channel?.unsubscribe();
            channel?.subscribe();
          }, 5000);
        }
        logger.log(`Supabase channel status: ${status}`);
      });

    // Cleanup function
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (supabase && channel) {
        logger.log(`Unsubscribing from Supabase channel '${channelName}'`);
        supabase
          .removeChannel(channel)
          .then((status) => logger.log(`Unsubscribe status: ${status}`))
          .catch((err) =>
            logger.error("Error unsubscribing from Supabase channel:", err)
          );
      }
    };
  }, [fetchCards, schoolId, debouncedFetchCards]);

  const getStatusCount = useCallback(
    (status: CardStatus) => {
      if (!Array.isArray(cards)) return 0;
      return cards.filter((card) => card.review_status === status).length;
    },
    [cards]
  );

  const retryAIProcessing = useCallback(async (documentId: string) => {
    try {
      await CardService.retryAIProcessing(documentId);
      toast.success('AI processing retry initiated successfully', 'Retry Started');
      // Refresh cards after retry
      await fetchCards();
    } catch (error) {
      logger.error('Error retrying AI processing:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to retry AI processing',
        'Retry Failed'
      );
      throw error; // Re-throw for component-level error handling
    }
  }, [fetchCards]);

  return {
    cards,
    fetchCards,
    getStatusCount,
    isLoading,
    setReviewModalState,
    retryAIProcessing,
  };
}
