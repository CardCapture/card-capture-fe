import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { debounce } from "@/utils/debounce";
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

  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasProcessingRef = useRef<boolean>(false);
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
  const fetchProcessingStatus = useCallback(async () => {
    if (!eventId || !supabase) return;

    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return; // Debounce rapid calls
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
        hasActiveCards,
        hasFailedCards,
        timeRemaining,
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
  }, [eventId, calculateTimeRemaining]);

  // Create debounced fetchProcessingStatus to prevent rapid consecutive calls
  const debouncedFetchProcessingStatus = useMemo(
    () => debounce(fetchProcessingStatus, 1000), // 1 second debounce
    [fetchProcessingStatus]
  );

  // Setup real-time subscription
  useEffect(() => {
    if (!eventId || !supabase) return;

    logger.log('useProcessingStatus: Setting up real-time subscription for event:', eventId);

    const channelName = `processing_status_${eventId}`;

    const handleRealtimeChange = (payload: any) => {
      logger.log('useProcessingStatus: Real-time change received:', payload);

      // Check if change is relevant to our event
      const newRecord = payload.new as ProcessingJob | undefined;
      const oldRecord = payload.old as ProcessingJob | undefined;

      const isRelevant =
        newRecord?.event_id === eventId ||
        oldRecord?.event_id === eventId;

      if (isRelevant) {
        logger.log('useProcessingStatus: Relevant change detected, refreshing status');
        // Use debounced fetch to prevent multiple rapid updates
        debouncedFetchProcessingStatus();
      }
    };

    // Create real-time subscription with server-side filtering for better performance
    // Only listen to changes for our specific event
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `event_id=eq.${eventId}` // Server-side filtering!
      }, handleRealtimeChange)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          logger.log(`useProcessingStatus: Real-time subscription active for ${channelName}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error(`useProcessingStatus: Real-time error: ${status}`, err);
          
          // Setup polling fallback (reduced frequency)
          if (!pollingIntervalRef.current) {
            logger.log('useProcessingStatus: Setting up polling fallback');
            pollingIntervalRef.current = setInterval(fetchProcessingStatus, 10000); // 10 seconds instead of 3
          }
        }
      });

    channelRef.current = channel;

    // Initial fetch
    fetchProcessingStatus();

    return () => {
      logger.log('useProcessingStatus: Cleaning up subscriptions');
      
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
  }, [eventId, fetchProcessingStatus, debouncedFetchProcessingStatus]);

  return {
    status,
    loading,
    refresh: fetchProcessingStatus,
  };
} 