import { supabase } from "@/lib/supabaseClient";

/**
 * Generates a signed URL for a private image in Supabase Storage.
 * @param imagePath - The path to the image (relative to the bucket root, e.g. "user_id/date/filename.jpg")
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns The signed URL string, or empty string if there was an error.
 */
export const getSignedImageUrl = async (imagePath: string, expiresIn: number = 3600): Promise<string> => {
  if (!imagePath) {
    console.log("[ImageUtils] No imagePath provided");
    return "";
  }

  // Remove 'cards-uploads/' prefix if it exists
  const cleanPath = imagePath.replace(/^cards-uploads\//, '');
  console.log("[ImageUtils] Requesting signed URL for:", cleanPath);
  
  try {
    const { data, error } = await supabase
      .storage
      .from("cards-uploads")
      .createSignedUrl(cleanPath, expiresIn);

    if (error || !data?.signedUrl) {
      console.error("[ImageUtils] Error generating signed URL:", error, "for path:", cleanPath);
      
      // List files in the same folder for debugging
      const folder = cleanPath.split('/').slice(0, -1).join('/');
      if (folder) {
        const { data: listData, error: listError } = await supabase
          .storage
          .from("cards-uploads")
          .list(folder, { limit: 100 });
        
        if (listError) {
          console.error("[ImageUtils] Error listing files in folder:", folder, listError);
        } else {
          console.log(`[ImageUtils] Files in folder '${folder}':`, listData?.map(f => f.name));
        }
      }
      return "";
    }

    console.log("[ImageUtils] Signed URL generated successfully");
    return data.signedUrl;
  } catch (error) {
    console.error("[ImageUtils] Unexpected error generating signed URL:", error);
    return "";
  }
};
