import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

export function useProcessingStatus(eventId?: string) {
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
        console.error('useProcessingStatus: Error fetching processing jobs:', error);
        return;
      }

      const processedJobs = jobs as ProcessingJob[];
      
      const queued = processedJobs.filter(job => job.status === 'queued').length;
      const processing = processedJobs.filter(job => job.status === 'processing').length;
      const failed = processedJobs.filter(job => job.status === 'failed').length;
      const completed = processedJobs.filter(job => job.status === 'complete').length;
      
      // For display: total = queued + processing (not including failed or completed)
      // Progress = processing cards out of (queued + processing)
      const activeCards = queued + processing;
      const isProcessing = activeCards > 0 || failed > 0;

      const timeRemaining = calculateTimeRemaining(queued, processing);

              console.log('useProcessingStatus: Status updated', {
          eventId,
          queued,
          processing,
          failed,
          completed,
          activeCards,
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
    } catch (error) {
      console.error('useProcessingStatus: Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId, calculateTimeRemaining]);

  // Setup real-time subscription
  useEffect(() => {
    if (!eventId || !supabase) return;

    console.log('useProcessingStatus: Setting up real-time subscription for event:', eventId);

    const channelName = `processing_status_${eventId}`;
    
    const handleRealtimeChange = (payload: any) => {
      console.log('useProcessingStatus: Real-time change received:', payload);
      
      // Check if change is relevant to our event
      const newRecord = payload.new as ProcessingJob | undefined;
      const oldRecord = payload.old as ProcessingJob | undefined;
      
      const isRelevant = 
        newRecord?.event_id === eventId || 
        oldRecord?.event_id === eventId;

      if (isRelevant) {
        console.log('useProcessingStatus: Relevant change detected, refreshing status');
        fetchProcessingStatus();
      }
    };

    // Create real-time subscription
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `event_id=eq.${eventId}`
      }, handleRealtimeChange)
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`useProcessingStatus: Real-time subscription active for ${channelName}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`useProcessingStatus: Real-time error: ${status}`, err);
          
          // Setup polling fallback
          if (!pollingIntervalRef.current) {
            console.log('useProcessingStatus: Setting up polling fallback');
            pollingIntervalRef.current = setInterval(fetchProcessingStatus, 3000);
          }
        }
      });

    channelRef.current = channel;

    // Initial fetch
    fetchProcessingStatus();

    return () => {
      console.log('useProcessingStatus: Cleaning up subscriptions');
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [eventId, fetchProcessingStatus]);

  return {
    status,
    loading,
    refresh: fetchProcessingStatus,
  };
} 