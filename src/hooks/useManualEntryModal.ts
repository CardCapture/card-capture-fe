import { useState } from "react";
import { toast } from "@/lib/toast";

interface ManualEntryForm {
  name: string;
  preferred_first_name: string;
  date_of_birth: string;
  email: string;
  cell: string;
  permission_to_text: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  high_school: string;
  class_rank: string;
  students_in_class: string;
  gpa: string;
  student_type: string;
  entry_term: string;
  major: string;
}

export function useManualEntryModal(
  selectedEvent: any,
  fetchCards: () => void
) {
  const [isManualEntryModalOpen, setIsManualEntryModalOpen] = useState(false);
  const [manualEntryForm, setManualEntryForm] = useState<ManualEntryForm>({
    name: "",
    preferred_first_name: "",
    date_of_birth: "",
    email: "",
    cell: "",
    permission_to_text: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    high_school: "",
    class_rank: "",
    students_in_class: "",
    gpa: "",
    student_type: "",
    entry_term: "",
    major: "",
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
      toast.required("name for the contact");
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
          event_id: selectedEvent?.id,
          fields: Object.fromEntries(
            Object.entries(manualEntryForm).map(([key, value]) => [
              key,
              { value, confidence: 1.0 }
            ])
          ),
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to create manual entry");
      }
      toast.created("Contact");
      setManualEntryForm({
        name: "",
        preferred_first_name: "",
        date_of_birth: "",
        email: "",
        cell: "",
        permission_to_text: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        high_school: "",
        class_rank: "",
        students_in_class: "",
        gpa: "",
        student_type: "",
        entry_term: "",
        major: "",
      });
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
  };
}
