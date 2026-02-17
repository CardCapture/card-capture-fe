import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { logger } from '@/utils/logger';

interface ProcessingJob {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  event_id: string;
  created_at: string;
  updated_at: string;
}

interface ProcessingStatus {
  queued: number;
  processing: number;
  failed: number;
  completed: number;
  total: number;
  timeRemaining: string;
  isProcessing: boolean;
}

export function useProcessingStatus(eventId?: string, onComplete?: () => void) {
  const [status, setStatus] = useState<ProcessingStatus>({
    queued: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    total: 0,
    timeRemaining: "",
    isProcessing: false,
  });

  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasProcessingRef = useRef<boolean>(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref up to date
  onCompleteRef.current = onComplete;

  // Calculate time remaining based on queued + processing cards
  const calculateTimeRemaining = useCallback((queued: number, processing: number): string => {
    const remainingCards = queued + processing;
    if (remainingCards === 0) return "";
    
    const totalSeconds = remainingCards * 25; // 25 seconds per card
    
    if (totalSeconds <= 30) return "Under 1 minute";
    
    const minutes = Math.ceil(totalSeconds / 60);
    if (minutes === 1) return "About 1 minute";
    return `About ${minutes} minutes`;
  }, []);

  // Fetch processing status from Supabase
  const fetchProcessingStatus = useCallback(async (force = false) => {
    if (!eventId || !supabase) return;
    if (!isOnline) {
      logger.log('useProcessingStatus: offline, skipping fetch');
      return;
    }

    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < 1000) return; // Debounce rapid calls
    lastFetchTimeRef.current = now;

    try {
      setLoading(true);

      // Get all processing jobs for this event
      const { data: jobs, error } = await supabase
        .from('processing_jobs')
        .select('id, status, event_id, created_at, updated_at')
        .eq('event_id', eventId);

      if (error) {
        logger.error('useProcessingStatus: Error fetching processing jobs:', error);
        return;
      }

      const processedJobs = jobs as ProcessingJob[];
      
      const queued = processedJobs.filter(job => job.status === 'queued').length;
      const processing = processedJobs.filter(job => job.status === 'processing').length;
      const failed = processedJobs.filter(job => job.status === 'failed').length;
      const completed = processedJobs.filter(job => job.status === 'complete').length;
      
      // For display logic:
      // - total = queued + processing (active cards)
      // - isProcessing = true if there are any active cards OR recently failed cards
      // - Show processing indicator if there are cards actively being worked on
      const activeCards = queued + processing;
      const hasActiveCards = activeCards > 0;
      const hasFailedCards = failed > 0;
      
      // Show processing if there are active cards OR if there are failed cards that need attention
      // Hide immediately when all cards are complete (no active, no failed)
      const isProcessing = hasActiveCards || hasFailedCards;

      const timeRemaining = calculateTimeRemaining(queued, processing);

      logger.log('useProcessingStatus: Status updated', {
        eventId,
        queued,
        processing,
        failed,
        completed,
        activeCards,
        isProcessing,
      });

      setStatus({
        queued,
        processing,
        failed,
        completed,
        total: activeCards, // Only show active cards (queued + processing)
        timeRemaining,
        isProcessing,
      });

      // Clear any existing hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      // If no active cards and no failed cards, set a brief timeout to hide
      // This gives the UI a moment to update before hiding completely
      if (!hasActiveCards && !hasFailedCards && completed > 0) {
        logger.log('useProcessingStatus: All processing complete, hiding in 2 seconds');

        // Trigger onComplete callback when transitioning from processing to complete
        if (wasProcessingRef.current && onCompleteRef.current) {
          logger.log('useProcessingStatus: Calling onComplete callback to refresh cards');
          onCompleteRef.current();
        }

        hideTimeoutRef.current = setTimeout(() => {
          setStatus(prev => ({ ...prev, isProcessing: false }));
          hideTimeoutRef.current = null;
        }, 2000); // Hide after 2 seconds
      }

      // Track whether we were processing for the next status check
      wasProcessingRef.current = hasActiveCards;

      // Set up polling if we have active processing (reduced frequency for better performance)
      if (hasActiveCards && !pollingIntervalRef.current) {
        logger.log('useProcessingStatus: Starting polling for active processing');
        pollingIntervalRef.current = setInterval(fetchProcessingStatus, 5000); // Poll every 5 seconds (reduced from 2)
      } else if (!hasActiveCards && pollingIntervalRef.current) {
        logger.log('useProcessingStatus: Stopping polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (error) {
      logger.error('useProcessingStatus: Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, isOnline, calculateTimeRemaining]);

  // Setup real-time subscription (network-aware with bounded retries)
  useEffect(() => {
    if (!eventId || !supabase) return;

    if (!isOnline) {
      logger.log('useProcessingStatus: Offline, skipping real-time subscription');
      return;
    }

    const MAX_RETRIES = 3;
    retryCountRef.current = 0;

    logger.log('useProcessingStatus: Setting up real-time subscription for event:', eventId);

    const channelName = `processing_status_${eventId}_${Date.now()}`;

    const handleRealtimeChange = (payload: any) => {
      logger.log('useProcessingStatus: Real-time change received:', payload);

      const newRecord = payload.new as ProcessingJob | undefined;
      const oldRecord = payload.old as ProcessingJob | undefined;

      const isRelevant =
        newRecord?.event_id === eventId ||
        oldRecord?.event_id === eventId;

      if (isRelevant) {
        logger.log('useProcessingStatus: Relevant change detected, refreshing status');
        fetchProcessingStatus(true);
      }
    };

    const subscribe = () => {
      // Remove existing channel before creating a new one
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      // Stop any existing polling when attempting a fresh subscription
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const retryChannelName = `${channelName}_r${retryCountRef.current}`;

      const channel = supabase
        .channel(retryChannelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'processing_jobs',
          filter: `event_id=eq.${eventId}`
        }, handleRealtimeChange)
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            logger.log(`useProcessingStatus: Channel '${retryChannelName}' subscribed successfully`);
            retryCountRef.current = 0;
            // Stop polling fallback since realtime is working
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logger.error(`useProcessingStatus: Channel error: ${status}`, err);

            if (retryCountRef.current < MAX_RETRIES) {
              const backoff = 3000 * Math.pow(2, retryCountRef.current) + Math.random() * 1000;
              retryCountRef.current += 1;
              logger.log(
                `useProcessingStatus: Retry ${retryCountRef.current}/${MAX_RETRIES} in ${Math.round(backoff)}ms`
              );
              retryTimeoutRef.current = setTimeout(subscribe, backoff);
            } else {
              logger.warn(
                `useProcessingStatus: Max retries (${MAX_RETRIES}) reached, falling back to polling`
              );
              if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = setInterval(fetchProcessingStatus, 10000);
              }
            }
          }
        });

      channelRef.current = channel;
    };

    subscribe();

    // Initial fetch
    fetchProcessingStatus();

    return () => {
      logger.log('useProcessingStatus: Cleaning up subscriptions');

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [eventId, isOnline, fetchProcessingStatus]);

  return {
    status,
    loading,
    refresh: fetchProcessingStatus,
  };
} 