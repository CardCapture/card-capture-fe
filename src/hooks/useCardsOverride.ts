import { useState, useCallback, useEffect, useRef } from "react";
import { ProspectCard, CardStatus, FieldData } from "@/types/card";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { determineCardStatus } from "@/lib/cardUtils";
import { CardService } from "@/services/CardService";
import { useLoader } from "@/contexts/LoaderContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { logger } from '@/utils/logger';

// Define proper interface for raw card data from API
interface RawCardData {
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
  >; // Allow flexible field structure
  missing_fields?: string[];
  image_path?: string;
  event_id?: string;
  school_id?: string;
  user_id?: string;
  trimmed_image_path?: string;
  ai_error_message?: string;
  review_data?: any;
  [key: string]: unknown; // More specific than any
}

export function useCardsOverride(eventId?: string) {
  const [cards, setCards] = useState<ProspectCard[]>([]);
  const [reviewModalState, setReviewModalState] = useState(false);
  const { isOnline } = useNetworkStatus();
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const DEBOUNCE_DELAY = 1000; // 1 second debounce

  // Use global loader instead of local loading state
  const { showTableLoader, hideTableLoader, isLoading } = useLoader();
  const LOADER_ID = `cards-${eventId || "default"}`;

  const fetchCardsInternal = useCallback(async (force = false) => {
    logger.log("useCardsOverride: fetchCards called", { eventId, force });

    // Skip API calls when offline
    if (!isOnline) {
      logger.log("useCardsOverride: offline, skipping fetch");
      return;
    }

    // Prevent parallel requests; skip debounce when forced (e.g. realtime events)
    const now = Date.now();
    if (fetchInProgressRef.current) {
      logger.log("useCardsOverride: fetchCards blocked - fetch in progress");
      return;
    }
    if (!force && now - lastFetchTimeRef.current < DEBOUNCE_DELAY) {
      logger.log("useCardsOverride: fetchCards blocked by debounce", {
        timeSinceLastFetch: now - lastFetchTimeRef.current
      });
      return;
    }

    // Only fetch if we have an eventId
    if (!eventId) {
      logger.log("useCardsOverride: no eventId, skipping fetch");
      return;
    }

    logger.log("useCardsOverride: Starting API fetch for event", eventId);

    try {
      fetchInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      showTableLoader(LOADER_ID, "Loading cards...");

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = new URL(`${apiBaseUrl}/cards`);
      url.searchParams.append("event_id", eventId);

      // Use CardService instead of direct API call
      const data: RawCardData[] = (await CardService.getCardsByEvent(
        eventId
      )) as RawCardData[];

      logger.log("useCardsOverride: Received data from API", { count: data.length, eventId });


      // Map the data to ensure all required fields are properly set
      const mappedCards = data.map((card: RawCardData) => {
        // Raw card data processing

        // Preserve all fields from backend and only add defaults for core missing ones
        const fields = card.fields || {};
        // No need to add missing fields - the backend handles all field configuration
        // via the school's card_fields setting. Frontend should only display what the backend provides.

        const mappedCard: ProspectCard = {
          id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          document_id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          review_status: card.review_status || "needs_review",
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
          ai_error_message: card.ai_error_message,
          review_data: card.review_data,
          upload_type: card.upload_type || "inquiry_card", // Add missing upload_type field
        };

        // Debug log the mapped card

        return mappedCard;
      });

      setCards(mappedCards);
      logger.log("useCardsOverride: Cards state updated", { count: mappedCards.length });
    } catch (error) {
      logger.error("useCardsOverride: Error fetching cards:", error);
    } finally {
      hideTableLoader(LOADER_ID);
      fetchInProgressRef.current = false;
    }
  }, [eventId, isOnline, showTableLoader, hideTableLoader, LOADER_ID]);

  // Default fetchCards respects debounce (used by manual calls)
  const fetchCards = useCallback(() => fetchCardsInternal(false), [fetchCardsInternal]);

  // Force fetch bypasses debounce (used by realtime handlers)
  const forceFetchCards = useCallback(() => fetchCardsInternal(true), [fetchCardsInternal]);

  // Effect for initial fetch and eventId changes
  useEffect(() => {
    logger.log("useCardsOverride: useEffect triggered", { eventId, hasEventId: !!eventId });
    if (eventId) {
      fetchCards();
    } else {
      // Clear cards when no eventId is provided
      setCards([]);
    }
  }, [eventId, fetchCards]); // Include fetchCards to ensure fresh closure

  // Effect for Supabase real-time subscription (network-aware with bounded retries)
  useEffect(() => {
    if (!eventId || !supabase) {
      logger.warn(
        "useCardsOverride: EventId or Supabase client not available, real-time updates disabled."
      );
      return;
    }

    if (!isOnline) {
      logger.log("useCardsOverride: Offline, skipping real-time subscription");
      return;
    }

    const MAX_RETRIES = 5;
    retryCountRef.current = 0;

    const channelName = `event_cards_changes_${eventId}_${Date.now()}`;

    const handleDbChange = (payload: {
      eventType: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      const newRecord = payload.new as { event_id?: string } | undefined;
      const oldRecord = payload.old as { event_id?: string } | undefined;

      const isRelevantChange =
        newRecord?.event_id === eventId || oldRecord?.event_id === eventId;

      if (isRelevantChange) {
        logger.log(
          "useCardsOverride: Change is relevant to current event, refreshing cards"
        );
        forceFetchCards();
      }
    };

    const subscribe = () => {
      // Remove existing channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const retryChannelName = `${channelName}_r${retryCountRef.current}`;

      const channel = supabase
        .channel(retryChannelName)
        .on(
          "postgres_changes",
          {
            event: "*" as const,
            schema: "public",
            table: "reviewed_data",
            filter: `event_id=eq.${eventId}`,
          },
          handleDbChange
        )
        .on(
          "postgres_changes",
          {
            event: "*" as const,
            schema: "public",
            table: "student_school_interactions",
            filter: `event_id=eq.${eventId}`,
          },
          handleDbChange
        )
        .on(
          "postgres_changes",
          {
            event: "*" as const,
            schema: "public",
            table: "processing_jobs",
            filter: `event_id=eq.${eventId}`,
          },
          handleDbChange
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            logger.log(
              `useCardsOverride: Channel '${retryChannelName}' subscribed successfully`
            );
            retryCountRef.current = 0;
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            logger.error(
              `useCardsOverride: Channel error: ${status}`,
              err
            );

            if (retryCountRef.current < MAX_RETRIES) {
              const backoff = 2000 * Math.pow(2, retryCountRef.current) + Math.random() * 1000;
              retryCountRef.current += 1;
              logger.log(
                `useCardsOverride: Retry ${retryCountRef.current}/${MAX_RETRIES} in ${Math.round(backoff)}ms`
              );
              retryTimeoutRef.current = setTimeout(subscribe, backoff);
            } else {
              logger.warn(
                `useCardsOverride: Max retries (${MAX_RETRIES}) reached, stopping reconnection attempts`
              );
            }
          }
        });

      channelRef.current = channel;
    };

    subscribe();

    // Cleanup function
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      if (channelRef.current) {
        logger.log("useCardsOverride: Cleaning up real-time channel");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [eventId, isOnline, forceFetchCards]);

  // Add getStatusCount function
  const getStatusCount = useCallback(
    (status: CardStatus) => {
      if (!Array.isArray(cards)) return 0;

      // Log the raw review_status of each card for debugging
      logger.log(
        "Raw card review_status:",
        cards.map((card) => ({
          id: card.id,
          review_status: card.review_status,
        }))
      );

      return cards.filter((card) => {
        // For archived status, check the raw review_status directly
        if (status === "archived") {
          return card.review_status === "archived";
        }
        // For ai_failed status, check the raw review_status directly
        if (status === "ai_failed") {
          return card.review_status === "ai_failed";
        }
        const cardStatus = determineCardStatus(card);
        return cardStatus === status;
      }).length;
    },
    [cards]
  );

  return {
    cards,
    fetchCards,
    isLoading: isLoading(LOADER_ID), // Use global loader state
    setReviewModalState,
    reviewModalState,
    getStatusCount,
  };
}
