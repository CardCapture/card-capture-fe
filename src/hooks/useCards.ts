// src/hooks/useCards.ts

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "@/lib/toast";
import type { ProspectCard, CardStatus } from "@/types/card";
import { useAuth } from "@/contexts/AuthContext";
import { CardService } from "@/services/CardService";
import { logger } from "@/utils/logger";

const DEFAULT_PAGE_SIZE = 50;

interface UseCardsReturn {
  cards: ProspectCard[];
  total: number;
  fetchCards: () => Promise<void>;
  refetch: () => Promise<void>;
  getStatusCount: (tabValue: CardStatus) => number;
  isLoading: boolean;
  error: Error | null;
  setReviewModalState: (isOpen: boolean) => void;
  retryAIProcessing: (documentId: string) => Promise<void>;
  // Pagination helpers
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
}

export function useCards(): UseCardsReturn {
  const { session, profile } = useAuth();
  const schoolId = profile?.school_id || null;
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Track review modal state (unchanged from original)
  const isInReviewModalRef = useRef<boolean>(false);

  const setReviewModalState = useCallback((isOpen: boolean) => {
    logger.log(`Setting review modal state to: ${isOpen}`);
    isInReviewModalRef.current = isOpen;
  }, []);

  // React Query for fetching cards
  const offset = page * pageSize;
  const queryKey = ["cards", { limit: pageSize, offset }] as const;

  const {
    data,
    isLoading,
    error,
    refetch: rqRefetch,
  } = useQuery({
    queryKey,
    queryFn: () => CardService.getAllCardsPaginated({ limit: pageSize, offset }),
    // Keep previous data while fetching the next page so the UI doesn't flash empty
    placeholderData: (previousData) => previousData,
  });

  const cards = data?.cards ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Provide a fetchCards wrapper that matches the original hook's API
  const fetchCards = useCallback(async () => {
    await rqRefetch();
  }, [rqRefetch]);

  const refetch = fetchCards;

  // Supabase real-time subscription: invalidate cache instead of managing state
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

      const newRecord = payload.new;
      const oldRecord = payload.old;

      const isRelevant =
        (newRecord && newRecord.school_id === schoolId) ||
        (oldRecord && oldRecord.school_id === schoolId);

      if (isRelevant) {
        logger.log("Relevant change detected for school:", schoolId);
        // Invalidate all cards queries so React Query refetches
        queryClient.invalidateQueries({ queryKey: ["cards"] });
      } else {
        logger.log("Ignoring change - not for our school");
      }
    };

    channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "reviewed_data",
          filter: `school_id=eq.${schoolId}`,
        },
        handleDbChange
      )
      .on(
        "postgres_changes",
        {
          event: "*" as const,
          schema: "public",
          table: "student_school_interactions",
          filter: `school_id=eq.${schoolId}`,
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
          setTimeout(() => {
            logger.log("Attempting to reconnect...");
            channel?.unsubscribe();
            channel?.subscribe();
          }, 5000);
        }
        logger.log(`Supabase channel status: ${status}`);
      });

    return () => {
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
  }, [schoolId, queryClient]);

  const getStatusCount = useCallback(
    (status: CardStatus) => {
      if (!Array.isArray(cards)) return 0;
      return cards.filter((card) => card.review_status === status).length;
    },
    [cards]
  );

  const retryAIProcessing = useCallback(
    async (documentId: string) => {
      try {
        await CardService.retryAIProcessing(documentId);
        toast.success(
          "AI processing retry initiated successfully",
          "Retry Started"
        );
        // Invalidate cache so cards refresh
        queryClient.invalidateQueries({ queryKey: ["cards"] });
      } catch (err) {
        logger.error("Error retrying AI processing:", err);
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to retry AI processing",
          "Retry Failed"
        );
        throw err;
      }
    },
    [queryClient]
  );

  return {
    cards,
    total,
    fetchCards,
    refetch,
    getStatusCount,
    isLoading,
    error: error as Error | null,
    setReviewModalState,
    retryAIProcessing,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
  };
}
