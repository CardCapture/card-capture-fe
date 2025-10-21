import { useState, useCallback, useRef, useEffect } from "react";
import type { ProspectCard } from "@/types/card";
import { toast } from "@/lib/toast";

export function useCardReviewModal(
  cards,
  reviewFieldOrder,
  fetchCards,
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

  const defaultField = {
    value: '',
    required: false,
    enabled: true,
    review_confidence: 0.0,
    requires_human_review: false,
    review_notes: '',
    confidence: 0.0,
    bounding_box: []
  };

  const handleFieldReview = useCallback(
    (fieldKey: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!selectedCardForReview) return;
      const updatedCard = { ...selectedCardForReview };
      
      // Special handling for address field - mark all address-related fields as reviewed
      if (fieldKey === 'address') {
        const addressFields = ['address', 'city', 'state', 'zip_code'];
        const allAddressFieldsReviewed = addressFields.every(field =>
          updatedCard.fields[field]?.reviewed === true
        );

        // Update form data for all address fields - use functional update to get current state
        setFormData((prev) => {
          const newFormData = { ...prev };

          // Toggle all address fields together
          addressFields.forEach(field => {
            // Use prev (current formData) instead of the closure's formData
            const currentValue = prev[field] ??
              selectedCardForReview.fields[field]?.value ?? "";

            // Ensure the field exists
            if (!updatedCard.fields[field]) {
              updatedCard.fields[field] = {
                ...defaultField,
                value: currentValue,
                requires_human_review: true,
              };
            }

            updatedCard.fields[field] = {
              ...updatedCard.fields[field],
              value: currentValue,
              reviewed: !allAddressFieldsReviewed,
              requires_human_review: allAddressFieldsReviewed,
              review_notes: allAddressFieldsReviewed ? "Marked as needing review" : "Manually reviewed",
            };

            // Keep the current value in formData
            newFormData[field] = currentValue;
          });

          return newFormData;
        });
        
        setSelectedCardForReview(updatedCard);
        localCardRef.current = updatedCard;
        
        toast.success(
          `Address fields have been ${
            !allAddressFieldsReviewed ? "marked as reviewed" : "marked as needing review"
          }.`,
          "Field Review Status Updated"
        );
      } else {
        // Regular field handling - use functional update to get current formData
        setFormData((prev) => {
          const currentValue =
            prev[fieldKey] ??
            selectedCardForReview.fields[fieldKey]?.value ??
            "";

          // Ensure the field exists in the card fields
          if (!updatedCard.fields[fieldKey]) {
            updatedCard.fields[fieldKey] = {
              ...defaultField,
              value: currentValue,
              requires_human_review: true,
            };
          }

          const currentReviewed = updatedCard.fields[fieldKey].reviewed;
          updatedCard.fields[fieldKey] = {
            ...updatedCard.fields[fieldKey],
            value: currentValue,
            reviewed: !currentReviewed,
            requires_human_review: currentReviewed,
            review_notes: currentReviewed ? "Marked as needing review" : "Manually reviewed",
          };

          setSelectedCardForReview(updatedCard);
          localCardRef.current = updatedCard;

          return {
            ...prev,
            [fieldKey]: currentValue,
          };
        });
        toast.success(
          `${dataFieldsMap.get(fieldKey) || fieldKey} has been ${
            updatedCard.fields[fieldKey].reviewed ? "marked as reviewed" : "marked as needing review"
          }.`,
          "Field Review Status Updated"
        );
      }
    },
    [selectedCardForReview, formData, dataFieldsMap]
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (selectedCardForReview) {
      setSelectedCardForReview((prev) => {
        if (!prev) return prev;
        const updatedFields = { ...prev.fields };
        if (!updatedFields[field]) {
          updatedFields[field] = { ...defaultField };
        }

        // Address fields should NOT be marked as reviewed on text input
        // They should only be marked as reviewed when selected from dropdown (via handleFormBatchChange)
        const isAddressField = ['address', 'city', 'state', 'zip_code'].includes(field);

        if (updatedFields[field].requires_human_review && !isAddressField) {
          updatedFields[field] = {
            ...updatedFields[field],
            value,
            reviewed: true,
            requires_human_review: false,
            review_notes: "Manually reviewed",
          };
        } else {
          updatedFields[field] = {
            ...updatedFields[field],
            value,
          };
        }

        return { ...prev, fields: updatedFields };
      });
    }
  };

  const handleFormBatchChange = (updates: Record<string, string>) => {
    console.log('🔄 handleFormBatchChange called with:', updates);
    setFormData((prev) => ({ ...prev, ...updates }));
    if (selectedCardForReview) {
      setSelectedCardForReview((prev) => {
        if (!prev) return prev;
        const updatedFields = { ...prev.fields };
        
        // Update all fields in the batch
        Object.entries(updates).forEach(([field, value]) => {
          if (!updatedFields[field]) {
            updatedFields[field] = { ...defaultField };
          }
          
          if (updatedFields[field].requires_human_review) {
            updatedFields[field] = {
              ...updatedFields[field],
              value,
              reviewed: true,
              requires_human_review: false,
              review_notes: "Manually reviewed",
            };
          } else {
            updatedFields[field] = {
              ...updatedFields[field],
              value,
            };
          }
        });
        
        return { ...prev, fields: updatedFields };
      });
    }
  };

  useEffect(() => {
    // Only rebuild formData when we're selecting a different card, not when the card object updates
    const currentCardId = selectedCardForReview?.document_id || null;
    const previousCardId = selectedCardIdRef.current;

    // If the card ID hasn't changed, don't rebuild formData
    // This prevents overwriting user edits when the card object updates due to field changes
    if (currentCardId === previousCardId && previousCardId !== null) {
      return;
    }

    // Update the ref to track the current card ID
    selectedCardIdRef.current = currentCardId;

    if (selectedCardForReview && reviewFieldOrder) {
      const initialFormData: Record<string, string> = {};

      // Only use fields that are in reviewFieldOrder or in the card's fields
      // This ensures we only show fields configured for the school
      const cardDataFields = Object.keys(selectedCardForReview.fields);

      // Start with the review field order from the school configuration
      const enhancedFieldOrder = [...reviewFieldOrder];

      // Add any fields from the card data that aren't already in the order
      // But only if they actually exist in the card (not hardcoded canonical fields)
      cardDataFields.forEach(field => {
        if (!enhancedFieldOrder.includes(field)) {
          enhancedFieldOrder.push(field);
        }
      });

      // Populate form data with the fields we actually have
      enhancedFieldOrder.forEach((fieldKey) => {
        if (selectedCardForReview.fields?.[fieldKey]) {
          initialFormData[fieldKey] = selectedCardForReview.fields[fieldKey]?.value ?? "";
        }
      });

      // Always include CEEB code if it exists in the card
      if (selectedCardForReview.fields?.ceeb_code) {
        initialFormData["ceeb_code"] = selectedCardForReview.fields.ceeb_code.value ?? "";
      }

      // Preserve existing form data for fields that are already set to avoid losing user input
      setFormData(prevFormData => {
        const mergedFormData = { ...initialFormData };
        // Preserve CEEB code if it was already set (e.g., from school selection)
        if (prevFormData.ceeb_code && !mergedFormData.ceeb_code) {
          mergedFormData.ceeb_code = prevFormData.ceeb_code;
        }
        // Preserve other user-modified fields that exist in the card
        Object.keys(prevFormData).forEach(key => {
          if (prevFormData[key] && !mergedFormData[key] && selectedCardForReview.fields?.[key]) {
            mergedFormData[key] = prevFormData[key];
          }
        });
        return mergedFormData;
      });
    } else {
      setFormData({});
    }
  }, [selectedCardForReview, reviewFieldOrder]);

  const handleReviewSave = async () => {
    if (!selectedCardForReview || isSaving) return;
    setIsSaving(true);
    try {
      toast.info("Updating card information...", "Saving Changes");
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const updatedFields = Object.fromEntries(
        Object.entries(selectedCardForReview.fields).map(([key, field]) => {
          let reviewed = field.reviewed === true;
          let requires_human_review = field.requires_human_review === true;
          let review_notes = field.review_notes;
          if (
            formData[key] !== undefined &&
            formData[key] !== field.value &&
            field.requires_human_review
          ) {
            reviewed = true;
            requires_human_review = false;
            review_notes = "Manually reviewed";
          }
          return [
            key,
            {
              ...field,
              value: formData[key] !== undefined ? formData[key] : field.value,
              reviewed: reviewed ?? false,
              requires_human_review,
              review_notes,
            },
          ];
        })
      );
      const allRequiredReviewed = Object.values(updatedFields).filter(f => f.requires_human_review).length === 0;
      const response = await fetch(
        `${apiBaseUrl}/save-review/${selectedCardForReview.document_id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: updatedFields,
            status: allRequiredReviewed ? "reviewed" : "needs_review",
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
      await fetchCards();
      setIsReviewModalOpen(false);
      setSelectedCardForReview(null);
      toast.success(
        allRequiredReviewed
          ? "All required fields have been reviewed and saved."
          : "Changes saved successfully.",
        "Review Complete"
      );
    } catch (error: unknown) {
      let message = "Unable to save your changes. Please try again.";
      if (error instanceof Error) message = error.message;
      toast.error(message, "Save Failed");
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
    handleFormBatchChange,
    localCardRef,
    selectedCardIdRef,
    imageKeyRef,
    fieldsWithToastRef,
    isSaving,
    setIsSaving,
  };
}
