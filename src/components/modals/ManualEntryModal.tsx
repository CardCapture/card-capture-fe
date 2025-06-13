import React, { useState, useMemo } from "react";
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
  SelectValue,
} from "@/components/ui/select";
import { formatPhoneNumber } from "@/lib/utils";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { DateInput } from "@/components/ui/date-input";
import { CheckCircle } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { AIFailureBanner } from "@/components/cards/AIFailureBanner";
import { CardService } from "@/services/CardService";
import { useAIRetry } from "@/hooks/useAIRetry";
import { SchoolService, type CardField } from "@/services/SchoolService";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  preferred_first_name: "Preferred Name",
  date_of_birth: "Birthdate",
  email: "Email",
  cell: "Cell Phone",
  permission_to_text: "Permission to Text",
  address: "Address",
  city: "City",
  state: "State",
  zip_code: "Zip Code",
  high_school: "High School",
  class_rank: "Class Rank",
  students_in_class: "Students in Class",
  gpa: "GPA",
  student_type: "Student Type",
  entry_term: "Entry Term",
  major: "Major",
  city_state: "City, State",
  // Add more as needed - only for fields commonly detected by DocAI
};

interface ManualEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  cardFields?: CardField[];
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
  // Get enabled fields only
  const enabledFields = cardFields.filter((field) => field.visible);

  // Helper to format field label - use custom label if available
  const formatFieldLabel = (field: CardField): string => {
    return field.label || SchoolService.generateDefaultLabel(field.key);
  };

  // Helper to get field input value with formatting (for display only)
  const getFieldValue = (field: CardField): string => {
    const value = form[field.key] || "";
    if (field.field_type === 'phone' || field.key === "cell") return formatPhoneInput(value);
    // Date fields will be handled by DateInput component - no formatting needed here
    return value;
  };

  // Helper to handle field change with formatting
  const handleFieldChange = (field: CardField, value: string) => {
    if (field.field_type === 'phone' || field.key === "cell") {
      onChange(field.key, formatPhoneInput(value));
    } else {
      // Date fields and others - pass value directly (DateInput handles its own formatting)
      onChange(field.key, value);
    }
  };

  // Helper to get field placeholder - use custom placeholder if available
  const getFieldPlaceholder = (field: CardField): string => {
    if (field.placeholder) return field.placeholder;
    return SchoolService.generateDefaultPlaceholder(field.key);
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

  // Render field input based on field type
  const renderFieldInput = (field: CardField) => {
    const fieldId = field.key;
    const fieldValue = getFieldValue(field);
    const placeholder = getFieldPlaceholder(field);

    // Handle select fields (dropdowns)
    if (field.field_type === 'select' && field.options && field.options.length > 0) {
      return (
        <Select
          value={form[field.key] || ""}
          onValueChange={(val) => onChange(field.key, val)}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder={`Select ${formatFieldLabel(field)}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle special cases for backward compatibility
    if (field.key === "permission_to_text") {
      const options = field.options || ["Yes", "No"];
      return (
        <Select
          value={form[field.key] || ""}
          onValueChange={(val) => onChange(field.key, val)}
        >
          <SelectTrigger id={fieldId}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle phone fields
    if (field.field_type === 'phone' || field.key === "cell") {
      return (
        <Input
          id={fieldId}
          type="tel"
          value={fieldValue}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
        />
      );
    }

    // Handle email fields
    if (field.field_type === 'email' || field.key === "email") {
      return (
        <Input
          id={fieldId}
          type="email"
          value={fieldValue}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
        />
      );
    }

    // Handle date fields
    if (field.field_type === 'date' || field.key === "date_of_birth") {
      return (
        <DateInput
          value={form[field.key] || ""}
          onChange={(value) => onChange(field.key, value)}
          placeholder={placeholder}
        />
      );
    }

    // Default text input
    return (
      <Input
        id={fieldId}
        type="text"
        value={fieldValue}
        onChange={(e) => handleFieldChange(field, e.target.value)}
        placeholder={placeholder}
      />
    );
  };

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
                    {formatFieldLabel(field)}
                    {field.required && " *"}
                  </Label>
                  {renderFieldInput(field)}
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
                        {formatFieldLabel(field)}
                        {field.required && " *"}
                      </Label>
                      {renderFieldInput(field)}
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
