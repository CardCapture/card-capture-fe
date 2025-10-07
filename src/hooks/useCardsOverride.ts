import { useState, useCallback, useEffect, useRef } from "react";
import { ProspectCard, CardStatus, FieldData } from "@/types/card";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { determineCardStatus } from "@/lib/cardUtils";
import { CardService } from "@/services/CardService";
import { useLoader } from "@/contexts/LoaderContext";

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
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 1000; // 1 second debounce

  // Use global loader instead of local loading state
  const { showTableLoader, hideTableLoader, isLoading } = useLoader();
  const LOADER_ID = `cards-${eventId || "default"}`;

  const fetchCards = useCallback(async () => {
    console.log("useCardsOverride: fetchCards called", { eventId });
    
    // Prevent parallel requests and implement debouncing
    const now = Date.now();
    if (
      fetchInProgressRef.current ||
      now - lastFetchTimeRef.current < DEBOUNCE_DELAY
    ) {
      console.log("useCardsOverride: fetchCards blocked by debounce", { 
        fetchInProgress: fetchInProgressRef.current, 
        timeSinceLastFetch: now - lastFetchTimeRef.current 
      });
      return;
    }

    // Only fetch if we have an eventId
    if (!eventId) {
      console.log("useCardsOverride: no eventId, skipping fetch");
      return;
    }

    console.log("useCardsOverride: Starting API fetch for event", eventId);

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
      
      console.log("useCardsOverride: Received data from API", { count: data.length, eventId });


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
      console.log("useCardsOverride: Cards state updated", { count: mappedCards.length });
    } catch (error) {
      console.error("useCardsOverride: Error fetching cards:", error);
    } finally {
      hideTableLoader(LOADER_ID);
      fetchInProgressRef.current = false;
    }
  }, [eventId, showTableLoader, hideTableLoader, LOADER_ID]);

  // Effect for initial fetch and eventId changes
  useEffect(() => {
    console.log("useCardsOverride: useEffect triggered", { eventId, hasEventId: !!eventId });
    if (eventId) {
      fetchCards();
    } else {
      // Clear cards when no eventId is provided
      setCards([]);
    }
  }, [eventId, fetchCards]); // Include fetchCards to ensure fresh closure

  // Effect for Supabase real-time subscription
  useEffect(() => {
    if (!eventId || !supabase) {
      console.warn(
        "useCardsOverride: EventId or Supabase client not available, real-time updates disabled."
      );
      return;
    }

    const channelName = `event_cards_changes_${eventId}`;
    let channel: RealtimeChannel | null = null;

    const handleDbChange = (payload: {
      eventType: string;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {

      // Check if the change is relevant to our event
      const newRecord = payload.new as { event_id?: string } | undefined;
      const oldRecord = payload.old as { event_id?: string } | undefined;

      const isRelevantChange =
        newRecord?.event_id === eventId || oldRecord?.event_id === eventId;

      if (isRelevantChange) {
        console.log(
          "useCardsOverride: Change is relevant to current event, refreshing cards"
        );
        fetchCards();
      } else {
        console.log(
          "useCardsOverride: Change not relevant to current event, skipping refresh"
        );
      }
    };

    const subscriptionOptions = {
      event: "*" as const,
      schema: "public",
      table: "reviewed_data",
    };

    // Subscribe to realtime changes
    channel = supabase
      .channel(channelName)
      .on("postgres_changes", subscriptionOptions, handleDbChange)
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(
            `useCardsOverride: Supabase channel '${channelName}' subscribed successfully!`
          );
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error(
            `useCardsOverride: Supabase channel error: ${status}`,
            err
          );
          // Attempt to reconnect after a delay
          setTimeout(() => {
            console.log("useCardsOverride: Attempting to reconnect...");
            channel?.unsubscribe();
            channel?.subscribe();
          }, 5000);
        }
        console.log(`useCardsOverride: Supabase channel status: ${status}`);
      });

    // Cleanup function
    return () => {
      if (supabase && channel) {
        console.log(
          `useCardsOverride: Unsubscribing from Supabase channel '${channelName}'`
        );
        supabase
          .removeChannel(channel)
          .then((status) =>
            console.log(`useCardsOverride: Unsubscribe status: ${status}`)
          )
          .catch((err) =>
            console.error(
              "useCardsOverride: Error unsubscribing from Supabase channel:",
              err
            )
          );
      }
    };
  }, [eventId, fetchCards]);

  // Add getStatusCount function
  const getStatusCount = useCallback(
    (status: CardStatus) => {
      if (!Array.isArray(cards)) return 0;

      // Log the raw review_status of each card for debugging
      console.log(
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
