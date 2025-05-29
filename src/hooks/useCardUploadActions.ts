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
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

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

  const handleCaptureCard = useCallback(() => {
    setIsCameraModalOpen(true);
  }, []);

  const handleImageCaptured = useCallback((imageDataUrl: string) => {
    // Convert base64 to File object
    const byteString = atob(imageDataUrl.split(',')[1]);
    const mimeString = imageDataUrl.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeString });
    
    startUploadProcess(file);
    setIsCameraModalOpen(false);
  }, [startUploadProcess]);

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
    handleImageCaptured,
    handleImportFile,
    handleFileSelect,
    startUploadProcess,
    isCameraModalOpen,
    setIsCameraModalOpen,
  };
}
