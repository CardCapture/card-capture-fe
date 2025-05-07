import { supabase } from './supabaseClient';

/**
 * Generates a signed URL for a private image in Supabase Storage.
 * @param imagePath - The path to the image (relative to the bucket root, e.g. "user_id/date/filename.jpg")
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns The signed URL string, or null if there was an error.
 */
export async function getSignedImageUrl(imagePath: string, expiresIn: number = 3600): Promise<string | null> {
  if (!imagePath) return null;
  console.log('[Supabase Debug] Requesting signed URL for:', imagePath);
  const { data, error } = await supabase
    .storage
    .from('cards-uploads')
    .createSignedUrl(imagePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('[Supabase Debug] Error generating signed URL:', error, 'for path:', imagePath);
    // List files in the same folder for debugging
    const folder = imagePath.split('/').slice(0, -1).join('/');
    if (folder) {
      const { data: listData, error: listError } = await supabase
        .storage
        .from('cards-uploads')
        .list(folder, { limit: 100 });
      if (listError) {
        console.error('[Supabase Debug] Error listing files in folder:', folder, listError);
      } else {
        console.log(`[Supabase Debug] Files in folder '${folder}':`, listData?.map(f => f.name));
      }
    }
    return null;
  }
  console.log('[Supabase Debug] Signed URL generated:', data.signedUrl);
  return data.signedUrl;
}

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