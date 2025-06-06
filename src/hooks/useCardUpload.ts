import { toast } from "@/lib/toast";
import { CardService } from "@/services/CardService";
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
      let endpoint = "/upload";
      if (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
      ) {
        endpoint = "/upload";
      }
      // Note: CardService.uploadCardManually doesn't handle file uploads yet
      // For now, we'll need to create a more appropriate service method
      // This is a TODO: Update CardService to handle file uploads properly
      const cardData = {
        event_id: eventId,
        school_id: schoolId,
        file_name: file.name,
      };

      await CardService.uploadCardManually(cardData);

      const data = { success: true };

      // We no longer show the toast here since it's shown by the callback

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
