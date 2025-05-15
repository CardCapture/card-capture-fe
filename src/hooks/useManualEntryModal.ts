import { useState } from "react";

interface ManualEntryForm {
  name: string;
  email: string;
  cell: string;
  date_of_birth: string;
}

export function useManualEntryModal(
  eventId: string | undefined,
  fetchCards: () => void,
  toast: (args: {
    title: string;
    description: string;
    variant?: string;
  }) => void
) {
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState<ManualEntryForm>({
    name: "",
    email: "",
    cell: "",
    date_of_birth: "",
  });

  const handleManualEntry = () => {
    setIsManualEntryModalOpen(true);
  };

  const handleManualEntryChange = (
    field: keyof ManualEntryForm,
    value: string
  ) => {
    setManualEntryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleManualEntrySubmit = async () => {
    if (!manualEntryForm.name) {
      toast({
        title: "Name Required",
        description: "Please enter at least a name for the contact",
        variant: "destructive",
      });
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
          event_id: eventId,
          fields: {
            name: { value: manualEntryForm.name, confidence: 1.0 },
            email: { value: manualEntryForm.email, confidence: 1.0 },
            cell: { value: manualEntryForm.cell, confidence: 1.0 },
            date_of_birth: {
              value: manualEntryForm.date_of_birth,
              confidence: 1.0,
            },
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create manual entry");
      }
      toast({
        title: "Contact added successfully",
        description: "Manual entry was added.",
      });
      setManualEntryForm({ name: "", email: "", cell: "", date_of_birth: "" });
      setIsManualEntryModalOpen(false);
      fetchCards();
    } catch (error: unknown) {
      let message = "Failed to create manual entry";
      if (error instanceof Error) message = error.message;
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
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
  };
}
