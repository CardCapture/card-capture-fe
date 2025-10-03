// src/hooks/useCards.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "@/lib/toast";
import type { ProspectCard, CardStatus } from "@/types/card";
import { useAuth } from "@/contexts/AuthContext";
import { CardService } from "@/services/CardService";

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
  const { session } = useAuth();

  // Add a ref to track if we're in the review modal
  const isInReviewModalRef = useRef<boolean>(false);

  // Add refs for debouncing updates
  const lastUpdateRef = useRef<number>(Date.now());
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<boolean>(false);

  // Export a function to set the review modal state
  const setReviewModalState = useCallback((isOpen: boolean) => {
    console.log(`Setting review modal state to: ${isOpen}`);
    isInReviewModalRef.current = isOpen;
  }, []);

  const fetchCards = useCallback(async () => {
    console.log("Fetching cards via useCards hook...");
    setIsLoading(true);

    try {
      const cards = await CardService.getAllCards();
      setCards(cards);
    } catch (error) {
      console.error("Error fetching cards:", error);
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

  // Effect for Supabase real-time subscription
  useEffect(() => {
    if (!supabase) {
      console.warn(
        "Supabase client not available, real-time updates disabled."
      );
      return;
    }

    const channelName = "cards_changes";
    let channel: RealtimeChannel | null = null;

    const handleDbChange = (payload: {
      eventType: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      console.log("Supabase change received:", payload);

      // For simplicity and type safety, just refresh all cards on any change
      // This ensures data consistency and avoids complex type casting
      fetchCards();
    };

    // Subscribe to both tables
    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "reviewed_data",
        },
        handleDbChange
      )
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "student_school_interactions",
        },
        handleDbChange
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `Supabase channel '${channelName}' subscribed successfully!`
          );
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(`Supabase channel error: ${status}`, err);
          // Attempt to reconnect
          setTimeout(() => {
            console.log("Attempting to reconnect...");
            channel?.unsubscribe();
            channel?.subscribe();
          }, 5000);
        }
        console.log(`Supabase channel status: ${status}`);
      });

    // Cleanup function
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (supabase && channel) {
        console.log(`Unsubscribing from Supabase channel '${channelName}'`);
        supabase
          .removeChannel(channel)
          .then((status) => console.log(`Unsubscribe status: ${status}`))
          .catch((err) =>
            console.error("Error unsubscribing from Supabase channel:", err)
          );
      }
    };
  }, [fetchCards]);

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
      console.error('Error retrying AI processing:', error);
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
