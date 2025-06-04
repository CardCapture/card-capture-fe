import { useState, useCallback, useEffect, useRef } from "react";
import { ProspectCard, CardStatus } from "@/types/card";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { determineCardStatus } from "@/lib/cardUtils";
import { authFetch } from "@/lib/authFetch";

export function useCardsOverride(eventId?: string) {
  const [cards, setCards] = useState<ProspectCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewModalState, setReviewModalState] = useState(false);
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const DEBOUNCE_DELAY = 1000; // 1 second debounce

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
      setIsLoading(true);

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = new URL(`${apiBaseUrl}/cards`);
      url.searchParams.append("event_id", eventId);
      console.log("useCardsOverride: Fetching cards from", url.toString());

      const response = await authFetch(url.toString());
      console.log("useCardsOverride: Cards response", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cards");
      }

      const data = await response.json();
      console.log("useCardsOverride: Cards data received", {
        count: data.length,
        firstCard: data.length > 0 ? data[0] : null,
      });

      // Map the data to ensure all required fields are properly set
      const mappedCards = data.map((card: any) => {
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

        const mappedCard = {
          ...card,
          id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          document_id:
            card.document_id ||
            card.id ||
            `unknown-${Math.random().toString(36).substring(7)}`,
          review_status: card.review_status || "needs_human_review",
          createdAt:
            card.created_at || card.uploaded_at || new Date().toISOString(),
          updatedAt: card.updated_at || card.reviewed_at,
          exported_at: card.exported_at || null,
          fields: fields,
          missingFields: card.missing_fields || [],
          image_path: card.image_path,
          event_id: card.event_id,
        };

        // Debug log the mapped card
        console.log("Mapped card:", mappedCard);

        return mappedCard;
      });

      setCards(mappedCards);
    } catch (error) {
      console.error("Error fetching cards:", error);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [eventId]);

  // Effect for initial fetch and eventId changes
  useEffect(() => {
    if (eventId) {
      fetchCards();
    } else {
      // Clear cards when no eventId is provided
      setCards([]);
    }
  }, [eventId, fetchCards]);

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
        const cardStatus = determineCardStatus(card);
        return cardStatus === status;
      }).length;
    },
    [cards]
  );

  return {
    cards,
    fetchCards,
    isLoading,
    setReviewModalState,
    reviewModalState,
    getStatusCount,
  };
}
