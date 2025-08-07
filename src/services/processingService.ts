import { supabase } from "@/lib/supabaseClient";

export interface ProcessingJob {
  id: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  event_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service for managing processing jobs
 */
export class ProcessingService {
  /**
   * Retry all failed processing jobs for an event
   */
  static async retryFailedJobs(eventId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log(`Retrying failed processing jobs for event: ${eventId}`);

    // Update all failed jobs back to queued status
    const { error } = await supabase
      .from('processing_jobs')
      .update({ 
        status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('status', 'failed');

    if (error) {
      console.error('Failed to retry processing jobs:', error);
      throw new Error(`Failed to retry processing jobs: ${error.message}`);
    }

    console.log('Successfully retried failed processing jobs');
  }

  /**
   * Stop all active processing jobs for an event
   */
  static async stopActiveJobs(eventId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log(`Stopping active processing jobs for event: ${eventId}`);

    // Update all queued and processing jobs to failed status
    const { error } = await supabase
      .from('processing_jobs')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .in('status', ['queued', 'processing']);

    if (error) {
      console.error('Failed to stop processing jobs:', error);
      throw new Error(`Failed to stop processing jobs: ${error.message}`);
    }

    console.log('Successfully stopped active processing jobs');
  }

  /**
   * Clear all failed processing jobs for an event
   */
  static async clearFailedJobs(eventId: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    console.log(`Clearing failed processing jobs for event: ${eventId}`);

    // First, check how many failed jobs exist
    const { data: beforeJobs, error: beforeError } = await supabase
      .from('processing_jobs')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('status', 'failed');

    if (beforeError) {
      console.error('Failed to query failed jobs before deletion:', beforeError);
    } else {
      console.log(`Found ${beforeJobs?.length || 0} failed jobs to delete`);
    }

    // Delete all failed processing jobs
    const { data: deletedJobs, error, count } = await supabase
      .from('processing_jobs')
      .delete()
      .eq('event_id', eventId)
      .eq('status', 'failed')
      .select(); // Return deleted rows

    console.log('Delete operation result:', { deletedJobs, error, count });

    if (error) {
      console.error('Failed to clear failed jobs:', error);
      throw new Error(`Failed to clear failed jobs: ${error.message}`);
    }

    console.log(`Successfully deleted ${deletedJobs?.length || 0} failed processing jobs`);
    
    // If no jobs were deleted but we expected to delete some, log additional info
    if ((deletedJobs?.length || 0) === 0 && (beforeJobs?.length || 0) > 0) {
      console.warn('⚠️  No jobs were deleted despite finding failed jobs. This might be a permissions issue.');
      console.log('Before jobs:', beforeJobs);
      console.log('Current user/session info for debugging');
    }

    // Verify deletion worked
    const { data: afterJobs, error: afterError } = await supabase
      .from('processing_jobs')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('status', 'failed');

    if (!afterError) {
      console.log(`Verification: ${afterJobs?.length || 0} failed jobs remain after deletion`);
    }
  }

  /**
   * Get processing job statistics for an event
   */
  static async getJobStats(eventId: string): Promise<{
    queued: number;
    processing: number;
    failed: number;
    completed: number;
    total: number;
  }> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    const { data: jobs, error } = await supabase
      .from('processing_jobs')
      .select('status')
      .eq('event_id', eventId);

    if (error) {
      console.error('Failed to get job stats:', error);
      throw new Error(`Failed to get job stats: ${error.message}`);
    }

    const stats = {
      queued: 0,
      processing: 0,
      failed: 0,
      completed: 0,
      total: jobs?.length || 0
    };

    jobs?.forEach(job => {
      switch (job.status) {
        case 'queued':
          stats.queued++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'complete':
          stats.completed++;
          break;
      }
    });

    return stats;
  }
}