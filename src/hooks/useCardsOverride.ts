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
    // Prevent parallel requests and implement debouncing
    const now = Date.now();
    if (
      fetchInProgressRef.current ||
      now - lastFetchTimeRef.current < DEBOUNCE_DELAY
    ) {
      console.log("useCardsOverride: Fetch skipped - too soon or in progress");
      return;
    }

    // Only fetch if we have an eventId
    if (!eventId) {
      console.log("useCardsOverride: No eventId provided, skipping fetch");
      return;
    }

    console.log("useCardsOverride: fetchCards called", { eventId });
    try {
      fetchInProgressRef.current = true;
      lastFetchTimeRef.current = now;
      showTableLoader(LOADER_ID, "Loading cards...");

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = new URL(`${apiBaseUrl}/cards`);
      url.searchParams.append("event_id", eventId);
      console.log("useCardsOverride: Fetching cards from", url.toString());

      // Use CardService instead of direct API call
      const data: RawCardData[] = (await CardService.getCardsByEvent(
        eventId
      )) as RawCardData[];

      console.log("useCardsOverride: Cards data received", {
        count: data.length,
      });
      console.log("✅ [CARDS OVERRIDE] Cards data received", {
        count: data.length,
        firstCard: data.length > 0 ? data[0] : null,
      });

      // Map the data to ensure all required fields are properly set
      const mappedCards = data.map((card: RawCardData) => {
        // Debug log the raw card data
        console.log("Raw card data:", card);

        // Ensure all expected fields are present
        const fields = card.fields || {};
        const expectedFields = [
          "name",
          "preferred_first_name",
          "date_of_birth",
          "email",
          "cell",
          "permission_to_text",
          "address",
          "city",
          "state",
          "zip_code",
          "high_school",
          "class_rank",
          "students_in_class",
          "gpa",
          "student_type",
          "entry_term",
          "major",
        ];

        // Add missing fields with default values
        expectedFields.forEach((field) => {
          if (!fields[field]) {
            fields[field] = {
              value: "",
              required: false,
              enabled: true,
              review_confidence: 0.0,
              requires_human_review: false,
              review_notes: "",
              confidence: 0.0,
              bounding_box: [],
            };
          }
        });

        const mappedCard: ProspectCard = {
          id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          document_id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          review_status: card.review_status || "needs_human_review",
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
        };

        // Debug log the mapped card
        console.log("Mapped card:", mappedCard);

        return mappedCard;
      });

      setCards(mappedCards);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      hideTableLoader(LOADER_ID);
      fetchInProgressRef.current = false;
    }
  }, [eventId, showTableLoader, hideTableLoader, LOADER_ID]);

  // Effect for initial fetch and eventId changes
  useEffect(() => {
    if (eventId) {
      fetchCards();
    } else {
      // Clear cards when no eventId is provided
      setCards([]);
    }
  }, [eventId]);

  // Effect for periodic polling (fallback for realtime issues)
  useEffect(() => {
    if (!eventId) {
      return;
    }

    // Disable realtime for now due to RLS policy conflicts causing TIMED_OUT errors
    const REALTIME_ENABLED = false;

    if (REALTIME_ENABLED) {
      // Realtime subscription code would go here when RLS issues are resolved
      console.log("Realtime subscription would be enabled here");
      return;
    }

    // Fallback: Use polling for updates
    const POLL_INTERVAL = 30000; // 30 seconds
    let pollInterval: NodeJS.Timeout;

    const startPolling = () => {
      pollInterval = setInterval(() => {
        // Only poll if the tab is visible to avoid unnecessary requests
        if (!document.hidden) {
          console.log("useCardsOverride: Polling for updates...");
          fetchCards();
        }
      }, POLL_INTERVAL);
    };

    // Start polling after a short delay to avoid immediate fetch conflicts
    const startTimeout = setTimeout(startPolling, 5000);

    // Handle visibility change to pause/resume polling
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("useCardsOverride: Tab hidden, pausing polling");
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      } else {
        console.log("useCardsOverride: Tab visible, resuming polling");
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup function
    return () => {
      if (startTimeout) {
        clearTimeout(startTimeout);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [eventId]);

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
