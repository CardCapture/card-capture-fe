import { useState, useCallback, useRef, useEffect } from "react";
import type { ProspectCard } from "@/types/card";

export function useCardReviewModal(
  cards,
  reviewFieldOrder,
  fetchCards,
  toast,
  dataFieldsMap
) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCardForReview, setSelectedCardForReview] =
    useState<ProspectCard | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const localCardRef = useRef<ProspectCard | null>(null);
  const selectedCardIdRef = useRef<string | null>(null);
  const imageKeyRef = useRef<string>(`image-${Date.now()}`);
  const fieldsWithToastRef = useRef<Set<string>>(new Set());

  const handleFieldReview = useCallback(
    (fieldKey: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedCardForReview) return;
      const updatedCard = { ...selectedCardForReview };
      const currentValue =
        formData[fieldKey] ??
        selectedCardForReview.fields[fieldKey]?.value ??
        "";
      if (updatedCard.fields[fieldKey]) {
        updatedCard.fields[fieldKey] = {
          ...updatedCard.fields[fieldKey],
          value: currentValue,
          reviewed: true,
          requires_human_review: false,
          review_notes: "Manually Reviewed",
        };
      }
      setSelectedCardForReview(updatedCard);
      localCardRef.current = updatedCard;
      setFormData((prev) => ({
        ...prev,
        [fieldKey]: currentValue,
      }));
      toast({
        title: "Field Reviewed",
        description: `${
          dataFieldsMap.get(fieldKey) || fieldKey
        } has been marked as reviewed.`,
        variant: "default",
      });
    },
    [selectedCardForReview, formData, toast, dataFieldsMap]
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (selectedCardForReview) {
      setSelectedCardForReview((prev) => {
        if (!prev) return prev;
        const updatedFields = { ...prev.fields };
        if (updatedFields[field]) {
          updatedFields[field] = {
            ...updatedFields[field],
            value,
            reviewed: true,
            requires_human_review: false,
            review_notes: "Manually reviewed",
          };
        }
        return { ...prev, fields: updatedFields };
      });
    }
  };

  useEffect(() => {
    if (selectedCardForReview && reviewFieldOrder) {
      const initialFormData: Record<string, string> = {};
      reviewFieldOrder.forEach((fieldKey) => {
        initialFormData[fieldKey] =
          selectedCardForReview.fields?.[fieldKey]?.value ?? "";
      });
      setFormData(initialFormData);
    } else {
      setFormData({});
    }
  }, [selectedCardForReview, reviewFieldOrder]);

  const handleReviewSave = async () => {
    if (!selectedCardForReview || isSaving) return;
    
    setIsSaving(true);
    try {
      toast({
        title: "Saving Changes",
        description: "Updating card information...",
        variant: "default",
      });
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const updatedFields = Object.fromEntries(
        Object.entries(selectedCardForReview.fields).map(([key, field]) => [
          key,
          {
            ...field,
            value: formData[key] || field.value,
            reviewed: true,
            requires_human_review: false,
            review_notes: "Manually reviewed",
          },
        ])
      );
      const allFieldsReviewed = Object.values(updatedFields).every(
        (field) =>
          field.reviewed === true && field.requires_human_review === false
      );
      const response = await fetch(
        `${apiBaseUrl}/save-review/${selectedCardForReview.document_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: updatedFields,
            status: allFieldsReviewed ? "reviewed" : "needs_human_review",
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
      await fetchCards();
      setIsReviewModalOpen(false);
      setSelectedCardForReview(null);
      toast({
        title: "Review Complete",
        description: allFieldsReviewed
          ? "All fields have been reviewed and saved."
          : "Changes saved successfully.",
        variant: "default",
      });
    } catch (error: unknown) {
      let message = "Unable to save your changes. Please try again.";
      if (error instanceof Error) message = error.message;
      toast({
        title: "Save Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isReviewModalOpen,
    setIsReviewModalOpen,
    selectedCardForReview,
    setSelectedCardForReview,
    formData,
    setFormData,
    handleFieldReview,
    handleReviewSave,
    handleFormChange,
    localCardRef,
    selectedCardIdRef,
    imageKeyRef,
    fieldsWithToastRef,
    isSaving,
    setIsSaving,
  };
}
