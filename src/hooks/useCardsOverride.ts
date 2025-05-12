import { useState, useCallback, useEffect, useRef } from 'react';
import { ProspectCard, CardStatus } from '@/types/card';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { determineCardStatus } from '@/lib/cardUtils';
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
    if (fetchInProgressRef.current || (now - lastFetchTimeRef.current < DEBOUNCE_DELAY)) {
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
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const url = new URL(`${apiBaseUrl}/cards`);
      url.searchParams.append('event_id', eventId);
      console.log("useCardsOverride: Fetching cards from", url.toString());
      
      const response = await authFetch(url.toString());
      console.log("useCardsOverride: Cards response", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      
      const data = await response.json();
      console.log("useCardsOverride: Cards data received", {
        count: data.length,
        firstCard: data.length > 0 ? data[0] : null
      });
      
      // Map the data to ensure all required fields are properly set
      const mappedCards = data.map((card: any) => {
        // Debug log the raw card data
        console.log('Raw card data:', card);
        
        const mappedCard = {
          ...card,
          id: card.document_id || card.id || `unknown-${Math.random().toString(36).substring(7)}`,
          document_id: card.document_id || card.id || `unknown-${Math.random().toString(36).substring(7)}`,
          review_status: card.review_status || 'needs_human_review',
          createdAt: card.created_at || card.uploaded_at || new Date().toISOString(),
          updatedAt: card.updated_at || card.reviewed_at,
          exported_at: card.exported_at || null,
          fields: card.fields || {},
          missingFields: card.missing_fields || [],
          image_path: card.image_path,
          event_id: card.event_id
        };
        
        // Debug log the mapped card
        console.log('Mapped card:', mappedCard);
        
        return mappedCard;
      });
      
      setCards(mappedCards);
    } catch (error) {
      console.error('Error fetching cards:', error);
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

  // Effect for Supabase real-time subscription
  useEffect(() => {
    if (!supabase || !eventId) {
      console.warn("Supabase client not available or no eventId, real-time updates disabled.");
      return;
    }

    const channelName = 'reviewed_data_changes';
    let channel: RealtimeChannel | null = null;
    let updateTimeout: NodeJS.Timeout | null = null;

    const handleDbChange = (payload: any) => {
      // Only process events for the current eventId
      if (payload.new?.event_id !== eventId && payload.old?.event_id !== eventId) {
        return;
      }

      // Clear any pending updates
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // Debounce the update to prevent rapid state changes
      updateTimeout = setTimeout(() => {
        console.log('useCardsOverride: Processing Supabase change:', payload);
        
        // Update local state based on the change type
        if (payload.eventType === 'UPDATE') {
          setCards(prevCards => {
            const updatedCards = prevCards.map(card => 
              card.id === payload.new.document_id 
                ? {
                    ...card,
                    ...payload.new,
                    fields: payload.new.fields || card.fields,
                    review_status: payload.new.review_status,
                    exported_at: payload.new.exported_at,
                    reviewed_at: payload.new.reviewed_at,
                    event_id: payload.new.event_id || card.event_id
                  }
                : card
            );
            
            // Only update if the card actually changed
            const hasChanges = JSON.stringify(updatedCards) !== JSON.stringify(prevCards);
            return hasChanges ? updatedCards : prevCards;
          });
        } else if (payload.eventType === 'INSERT') {
          setCards(prevCards => {
            const newCard = {
              ...payload.new,
              id: payload.new.document_id,
              document_id: payload.new.document_id,
              review_status: payload.new.review_status || 'needs_human_review',
              createdAt: payload.new.created_at || new Date().toISOString(),
              updatedAt: payload.new.updated_at || payload.new.reviewed_at,
              exported_at: payload.new.exported_at || null,
              fields: payload.new.fields || {},
              missingFields: payload.new.missing_fields || [],
              image_path: payload.new.image_path,
              event_id: payload.new.event_id
            };
            
            // Only add if the card doesn't already exist
            const exists = prevCards.some(card => card.id === newCard.id);
            return exists ? prevCards : [...prevCards, newCard];
          });
        } else if (payload.eventType === 'DELETE') {
          setCards(prevCards => prevCards.filter(card => 
            card.id !== payload.old.document_id
          ));
        }
      }, 100); // 100ms debounce
    };

    const subscriptionOptions = {
      event: '*' as const,
      schema: 'public',
      table: 'reviewed_data',
      filter: `event_id=eq.${eventId}`
    };

    // Subscribe (only once per channel instance)
    channel = supabase
      .channel(channelName)
      .on('postgres_changes', subscriptionOptions, handleDbChange)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`useCardsOverride: Supabase channel '${channelName}' subscribed successfully!`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`useCardsOverride: Supabase channel error: ${status}`, err);
        }
      });

    // Cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      if (supabase && channel) {
        console.log(`useCardsOverride: Unsubscribing from Supabase channel '${channelName}'`);
        supabase.removeChannel(channel)
          .then(status => console.log(`useCardsOverride: Unsubscribe status: ${status}`))
          .catch(err => console.error("useCardsOverride: Error unsubscribing from Supabase channel:", err));
      }
    };
  }, [eventId]);

  // Add getStatusCount function
  const getStatusCount = useCallback((status: CardStatus) => {
    if (!Array.isArray(cards)) return 0;
    
    // Log the raw review_status of each card for debugging
    console.log('Raw card review_status:', cards.map(card => ({
      id: card.id,
      review_status: card.review_status
    })));
    
    return cards.filter(card => {
      // For archived status, check the raw review_status directly
      if (status === 'archived') {
        return card.review_status === 'archived';
      }
      const cardStatus = determineCardStatus(card);
      return cardStatus === status;
    }).length;
  }, [cards]);

  return {
    cards,
    fetchCards,
    isLoading,
    setReviewModalState,
    reviewModalState,
    getStatusCount
  };
} 