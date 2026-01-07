import { toast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { offlineQueue } from "@/services/offlineQueue";

interface UploadResult {
  document_id?: string;
  queued?: boolean;
  queueId?: number;
}

export const useCardUpload = () => {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();

  const uploadCard = async (
    file: File,
    eventId: string,
    schoolId: string,
    eventName?: string,
    onUploadStart?: () => void
  ): Promise<UploadResult> => {
    // Call the onUploadStart callback before starting the upload
    if (onUploadStart) {
      onUploadStart();
    }

    // If offline, queue the card for later sync
    if (!isOnline) {
      try {
        // Convert file to base64 data URL
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const queueId = await offlineQueue.addCard({
          imageData,
          eventId,
          eventName: eventName || 'Unknown Event',
          schoolId,
        });

        toast.success("Card saved! Will upload when you're back online.", "Queued");
        return { queued: true, queueId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to queue card";
        toast.error(errorMessage, "Queue Failed");
        throw error;
      }
    }

    // Online: upload directly
    try {
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

  return { uploadCard, isOnline };
};
