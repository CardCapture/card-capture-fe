import { supabase } from './supabaseClient';

/**
 * List all files in the cards-uploads bucket (optionally in a folder)
 */
export async function listFilesInBucket(folder: string = '') {
  const { data, error } = await supabase
    .storage
    .from('cards-uploads')
    .list(folder, { limit: 100 });
  if (error) {
    console.error('[Supabase Debug] Error listing files:', error);
    return [];
  }
  console.log(`[Supabase Debug] Files in '${folder || '/'}':`, data?.map(f => f.name));
  return data;
} 