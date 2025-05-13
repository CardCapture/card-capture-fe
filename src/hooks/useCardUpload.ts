import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/authFetch";
import { useAuth } from "@/contexts/AuthContext";

export const useCardUpload = () => {
  const { toast } = useToast();
  const { session } = useAuth();
  
  const uploadCard = async (file: File, eventId: string, schoolId: string, onUploadStart?: () => void) => {
    try {
      // Call the onUploadStart callback before starting the upload
      if (onUploadStart) {
        onUploadStart();
      }
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("event_id", eventId);
      formData.append("school_id", schoolId);
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      let endpoint = "/upload";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        endpoint = "/bulk-upload";
      }
      const response = await authFetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST',
        body: formData
      }, session?.access_token);
      
      const data = await response.json();
      
      // We no longer show the toast here since it's shown by the callback
      
      return data;
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };
  
  return { uploadCard };
}; 