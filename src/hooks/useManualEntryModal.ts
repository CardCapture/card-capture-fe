import { useState, useMemo, useEffect } from "react";
import { toast } from "@/lib/toast";
import type { Event } from "@/types/event";
import { useAuth } from "@/contexts/AuthContext";

interface CardField {
  key: string;
  enabled: boolean;
  required: boolean;
}

export function useManualEntryModal(
  selectedEvent: Event | null,
  fetchCards: () => void,
  cardFields: CardField[] = []
) {
  console.log("useManualEntryModal received cardFields:", cardFields);
  console.log("useManualEntryModal cardFields length:", cardFields.length);
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const { profile } = useAuth();

  // Create initial form state based on enabled card fields
  const initialFormState = useMemo(() => {
    const enabledFields = cardFields.filter((field) => field.enabled);
    return enabledFields.reduce((acc, field) => {
      acc[field.key] = "";
      return acc;
    }, {} as Record<string, string>);
  }, [cardFields]);

  const [manualEntryForm, setManualEntryForm] =
    useState<Record<string, string>>(initialFormState);

  // Reset form when cardFields change
  useEffect(() => {
    setManualEntryForm(initialFormState);
  }, [initialFormState]);

  const handleManualEntry = () => {
    setIsManualEntryModalOpen(true);
  };

  const handleManualEntryChange = (field: string, value: string) => {
    setManualEntryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualEntrySubmit = async () => {
    // Check if required fields are filled
    const requiredFields = cardFields.filter(
      (field) => field.enabled && field.required
    );
    const missingRequiredFields = requiredFields.filter(
      (field) => !manualEntryForm[field.key]?.trim()
    );

    if (missingRequiredFields.length > 0) {
      const fieldNames = missingRequiredFields
        .map((field) =>
          field.key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        )
        .join(", ");
      toast.required(`${fieldNames} for the contact`);
      return;
    }

    try {
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/cards/manual`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_id: profile?.school_id,
          event_id: selectedEvent?.id,
          fields: Object.fromEntries(
            Object.entries(manualEntryForm).map(([key, value]) => [
              key,
              { value, confidence: 1.0 },
            ])
          ),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create manual entry");
      }
      toast.created("Contact");
      // Reset form to initial state
      setManualEntryForm(initialFormState);
      setIsManualEntryModalOpen(false);
      fetchCards();
    } catch (error: unknown) {
      let message = "Failed to create manual entry";
      if (error instanceof Error) message = error.message;
      toast.error(message, "Error");
    }
  };

  return {
    isManualEntryModalOpen,
    setIsManualEntryModalOpen,
    manualEntryForm,
    setManualEntryForm,
    handleManualEntry,
    handleManualEntryChange,
    handleManualEntrySubmit,
    cardFields,
  };
}
