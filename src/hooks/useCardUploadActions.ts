import { useState, useCallback } from "react";
import type { Event } from "@/types/event";
import { toast } from "@/lib/toast";

export function useCardUploadActions(
  selectedEvent: Event | null,
  uploadCard: (
    file: File,
    eventId: string,
    schoolId: string,
    onUploadStart: () => void
  ) => Promise<unknown>,
  fetchCards: () => void,
  fileInputRef: React.RefObject<HTMLInputElement>
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const startUploadProcess = useCallback(
    async (file: File) => {
      if (!selectedEvent?.id) {
        toast.required("event selection before uploading a card");
        return;
      }
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const onUploadStart = () => {
          toast.info("Your card is being processed. You can continue scanning more cards.", "Card Processing");
        };
        await uploadCard(
          file,
          selectedEvent.id,
          selectedEvent.school_id,
          onUploadStart
        );
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 200);
        await fetchCards();
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedEvent, uploadCard, fetchCards]
  );

  const handleCaptureCard = () => {
    toast.info("Camera capture functionality would be triggered here", "Capture Card");
  };

  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      startUploadProcess(file);
    }
    if (event.target) event.target.value = "";
  };

  return {
    isUploading,
    setIsUploading,
    uploadProgress,
    setUploadProgress,
    handleCaptureCard,
    handleImportFile,
    handleFileSelect,
    startUploadProcess,
  };
}
