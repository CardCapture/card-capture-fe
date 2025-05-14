import { supabase } from "@/lib/supabaseClient";

export const getSignedImageUrl = async (imagePath: string) => {
  if (!imagePath) {
    console.log("getSignedImageUrl: No imagePath provided");
    return "";
  }
  console.log(
    "getSignedImageUrl: Requesting signed URL for path:",
    JSON.stringify(imagePath)
  );
  const { data, error } = await supabase.storage
    .from("cards-uploads")
    .createSignedUrl(imagePath, 60 * 60); // 1 hour expiry
  if (error) {
    console.error("getSignedImageUrl: Error generating signed URL:", error);
    return "";
  }
  console.log("getSignedImageUrl: Signed URL generated:", data.signedUrl);
  return data.signedUrl;
};
