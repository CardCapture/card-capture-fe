import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatPhoneNumber } from "@/lib/utils";

interface CardField {
  key: string;
  enabled: boolean;
  required: boolean;
}

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  cardFields?: CardField[];
}

// Helper to format MMDDYYYY as MM/DD/YYYY as user types
function formatBirthdayInput(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 4) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
  if (cleaned.length <= 8)
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(
      4,
      8
    )}`;
  return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
}

// Helper to format 10-digit phone as 512-694-6172 as user types
function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  if (cleaned.length <= 10)
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(
    6,
    10
  )}`;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
  cardFields = [],
}) => {
  console.log("ManualEntryModal received cardFields:", cardFields);
  console.log("ManualEntryModal cardFields length:", cardFields.length);

  // Get enabled fields only
  const enabledFields = cardFields.filter((field) => field.enabled);
  console.log("ManualEntryModal enabledFields:", enabledFields);

  // Helper to format field label
  const formatFieldLabel = (fieldKey: string): string => {
    return fieldKey
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper to get field input value with formatting
  const getFieldValue = (fieldKey: string): string => {
    const value = form[fieldKey] || "";
    if (fieldKey === "cell") return formatPhoneInput(value);
    if (fieldKey === "date_of_birth") return formatBirthdayInput(value);
    return value;
  };

  // Helper to handle field change with formatting
  const handleFieldChange = (fieldKey: string, value: string) => {
    if (fieldKey === "cell") {
      onChange(fieldKey, formatPhoneInput(value));
    } else if (fieldKey === "date_of_birth") {
      onChange(fieldKey, formatBirthdayInput(value));
    } else {
      onChange(fieldKey, value);
    }
  };

  // Helper to get field placeholder
  const getFieldPlaceholder = (fieldKey: string): string => {
    const placeholders: Record<string, string> = {
      name: "Full Name",
      preferred_first_name: "Preferred Name",
      date_of_birth: "MM/DD/YYYY",
      email: "Email",
      cell: "(123) 456-7890",
      address: "123 Main St",
      city: "City",
      state: "State",
      zip_code: "Zip Code",
      high_school: "High School / College",
      class_rank: "Class Rank",
      students_in_class: "Total Students",
      gpa: "GPA",
      student_type: "Student Type",
      entry_term: "Fall 2025",
      major: "Intended Major",
    };
    return placeholders[fieldKey] || formatFieldLabel(fieldKey);
  };

  // Helper to determine if field should be grouped in address section
  const isAddressField = (fieldKey: string): boolean => {
    return ["address", "city", "state", "zip_code"].includes(fieldKey);
  };

  // Group fields
  const addressFields = enabledFields.filter((field) =>
    isAddressField(field.key)
  );
  const otherFields = enabledFields.filter(
    (field) => !isAddressField(field.key)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Record Contact Information</DialogTitle>
          <DialogDescription>
            Manually enter a contact's information to add to this event.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-4 space-y-4">
          {enabledFields.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-gray-500 text-sm">
                No fields are configured for manual entry.
              </div>
              <div className="text-gray-400 text-xs">
                Please add the fields first or upload at least one event card to
                auto-generate fields.
              </div>
            </div>
          ) : (
            <>
              {/* Render non-address fields */}
              {otherFields.map((field) => (
                <div key={field.key}>
                  <Label htmlFor={field.key}>
                    {formatFieldLabel(field.key)}
                    {field.required && " *"}
                  </Label>
                  {field.key === "permission_to_text" ? (
                    <Select
                      value={form[field.key] || ""}
                      onValueChange={(val) => onChange(field.key, val)}
                    >
                      <SelectTrigger id={field.key}>
                        {form[field.key]
                          ? form[field.key] === "yes"
                            ? "Yes"
                            : "No"
                          : "Select..."}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.key === "email" ? "email" : "text"}
                      value={getFieldValue(field.key)}
                      onChange={(e) =>
                        handleFieldChange(field.key, e.target.value)
                      }
                      placeholder={getFieldPlaceholder(field.key)}
                    />
                  )}
                </div>
              ))}

              {/* Render address fields grouped together if any exist */}
              {addressFields.length > 0 && (
                <div className="border rounded-md p-4 bg-gray-50 space-y-4">
                  <div className="font-semibold text-gray-700 mb-2">
                    Address
                  </div>
                  {addressFields.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>
                        {formatFieldLabel(field.key)}
                        {field.required && " *"}
                      </Label>
                      <Input
                        id={field.key}
                        value={form[field.key] || ""}
                        onChange={(e) => onChange(field.key, e.target.value)}
                        placeholder={getFieldPlaceholder(field.key)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={onSubmit}
            disabled={enabledFields.length === 0}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualEntryModal;
