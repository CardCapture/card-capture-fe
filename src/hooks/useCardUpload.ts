import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

export const useCardUpload = () => {
  const { session } = useAuth();

  const uploadCard = async (
    file: File,
    eventId: string,
    schoolId: string,
    onUploadStart?: () => void
  ) => {
    try {
      // Call the onUploadStart callback before starting the upload
      if (onUploadStart) {
        onUploadStart();
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);
      formData.append("school_id", schoolId);

      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const endpoint = "/upload";

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(errorMessage, "Upload Failed");
      throw error;
    }
  };

  return { uploadCard };
};
