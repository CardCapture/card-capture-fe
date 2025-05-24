import { useState, useCallback } from "react";
import type { Event } from "@/types/event";

export function useCardUploadActions(
  selectedEvent: Event | null,
  uploadCard: (
    file: File,
    eventId: string,
    schoolId: string,
    onUploadStart: () => void
  ) => Promise<unknown>,
  fetchCards: () => void,
  toast: (args: {
    title: string;
    description: string;
    variant?: string;
    action?: React.ReactNode;
    duration?: number;
    className?: string;
  }) => void,
  fileInputRef: React.RefObject<HTMLInputElement>
) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const startUploadProcess = useCallback(
    async (file: File) => {
      if (!selectedEvent?.id) {
        toast({
          title: "Event Required",
          description: "Please select an event before uploading a card.",
          variant: "destructive",
        });
        return;
      }
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const onUploadStart = () => {
          toast({
            title: "Card Processing",
            description:
              "Your card is being processed. You can continue scanning more cards.",
            variant: "default",
            duration: 4000,
            className:
              "bg-white border-green-200 shadow-md rounded-lg animate-in fade-in-0 slide-in-from-top-2",
          });
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
    [selectedEvent, uploadCard, fetchCards, toast]
  );

  const handleCaptureCard = () => {
    toast({
      title: "Capture Card",
      description: "Camera capture functionality would be triggered here",
    });
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
