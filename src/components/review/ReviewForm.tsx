import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { DateInput } from "@/components/ui/date-input";

import { CheckCircle } from "lucide-react";
import { formatPhoneNumber, formatBirthday } from "@/lib/utils";
import type { ProspectCard, FieldData } from "@/types/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
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

interface ReviewFormProps {
  selectedCardForReview: ProspectCard | null;
  fieldsToShow: string[];
  formData: Record<string, string>;
  handleFormChange: (field: string, value: string) => void;
  handleFieldReview: (fieldKey: string, e: React.MouseEvent) => void;
  selectedTab: string;
  dataFieldsMap: Map<string, string>;
  majorsList?: string[];
  loadingMajors?: boolean;
  onCardUpdated?: () => void;
  cardFields?: CardField[]; // Add cardFields prop for field types
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  selectedCardForReview,
  fieldsToShow,
  formData,
  handleFormChange,
  handleFieldReview,
  selectedTab,
  dataFieldsMap,
  majorsList = [],
  loadingMajors = false,
  onCardUpdated,
  cardFields = [],
}) => {
  const { retryCard, isRetrying } = useAIRetry(onCardUpdated);

  // Get field configuration for field types and options
  const getFieldConfig = (fieldKey: string): CardField | undefined => {
    return cardFields.find(field => field.key === fieldKey);
  };

  // Helper to get field label with custom label support
  const getFieldLabel = (fieldKey: string): string => {
    const fieldConfig = getFieldConfig(fieldKey);
    if (fieldConfig?.label) {
      return fieldConfig.label;
    }
    
    return fieldKey
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Render field input based on field type
  const renderFieldInput = (fieldKey: string, actualFieldKey: string, isReviewed: boolean, needsReview: boolean) => {
    const fieldConfig = getFieldConfig(actualFieldKey);
    const fieldValue = formData[actualFieldKey] || "";

    // Build conditional styling for reviewed/needs review states
    const getInputClassName = (baseClasses: string = "") => {
      return `${baseClasses} ${
        isReviewed && selectedTab === "needs_human_review"
          ? "border-green-300 focus-visible:ring-green-400 bg-green-50"
          : needsReview
          ? "border-red-300 focus-visible:ring-red-400"
          : ""
      }`;
    };

    // Handle select fields (dropdowns) with options
    if (fieldConfig?.field_type === 'select' && fieldConfig.options && fieldConfig.options.length > 0) {
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => handleFormChange(actualFieldKey, value)}
        >
          <SelectTrigger className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}>
            <SelectValue placeholder={`Select ${getFieldLabel(fieldKey)}`} />
          </SelectTrigger>
          <SelectContent>
            {fieldConfig.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Handle special cases for backward compatibility
    if (actualFieldKey === "permission_to_text") {
      const options = fieldConfig?.options || ["Yes", "No"];
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => handleFormChange(actualFieldKey, value)}
        >
          <SelectTrigger className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}>
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

    // Handle mapped_major field with select if majors are available  
    if (actualFieldKey === "mapped_major" && majorsList.length > 0) {
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => handleFormChange(actualFieldKey, value)}
        >
          <SelectTrigger className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}>
            <SelectValue placeholder="Select a major..." />
          </SelectTrigger>
          <SelectContent>
            {majorsList.map((major) => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Keep major field as text input to preserve original card text
    if (actualFieldKey === "major") {
      return (
        <Input
          type="text"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, e.target.value)}
          placeholder="Major from card"
          className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}
        />
      );
    }

    // Handle phone fields
    if (fieldConfig?.field_type === 'phone' || actualFieldKey === "cell") {
      let formattedValue = fieldValue;
      if (actualFieldKey === "cell") {
        formattedValue = formatPhoneNumber(fieldValue);
      }
      return (
        <PhoneNumberInput
          value={formattedValue}
          onChange={(value) => handleFormChange(actualFieldKey, value)}
          placeholder="(123) 456-7890"
          className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}
        />
      );
    }

    // Handle email fields
    if (fieldConfig?.field_type === 'email' || actualFieldKey === "email") {
      return (
        <Input
          type="email"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, e.target.value)}
          placeholder="Email address"
          className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}
        />
      );
    }

    // Handle date fields
    if (fieldConfig?.field_type === 'date' || actualFieldKey === "date_of_birth") {
      return (
        <DateInput
          value={fieldValue}
          onChange={(value) => handleFormChange(actualFieldKey, value)}
          className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}
        />
      );
    }

    // Default text input
    return (
      <Input
        type="text"
        value={fieldValue}
        onChange={(e) => handleFormChange(actualFieldKey, e.target.value)}
        placeholder={fieldConfig?.placeholder || getFieldLabel(fieldKey)}
        className={getInputClassName("h-10 sm:h-8 text-sm flex-1")}
      />
    );
  };

  // Check if the card has AI processing failure
  const hasAIFailure = selectedCardForReview ? CardService.isAIFailed(selectedCardForReview) : false;

  // Handle AI retry
  const handleAIRetry = async () => {
    if (selectedCardForReview?.document_id) {
      await retryCard(selectedCardForReview.document_id);
    }
  };

  // Dynamically map fieldsToShow keys to actual formData keys
  const getFormDataKey = (fieldKey: string): string => {
    // First try exact match
    if (fieldKey in formData || selectedCardForReview?.fields?.[fieldKey]) {
      return fieldKey;
    }

    // Get available keys from both formData and card fields
    const availableKeys = [
      ...Object.keys(formData),
      ...Object.keys(selectedCardForReview?.fields || {}),
    ];
    const uniqueKeys = [...new Set(availableKeys)];

    // Try common semantic mappings
    const semanticMappings: Record<string, string[]> = {
      birthdate: ["date_of_birth", "birth_date", "dob"],
      cell_phone: ["cell", "phone", "mobile", "cell_phone_number"],
      city_state_zip: ["city", "state", "zip_code"], // composite field - will use first match
      entry_year: ["entry_term", "entry_year"],
    };

    // Check semantic mappings
    const possibleMappings = semanticMappings[fieldKey];
    if (possibleMappings) {
      for (const mapping of possibleMappings) {
        if (uniqueKeys.includes(mapping)) {
          return mapping;
        }
      }
    }

    // Try partial string matching (fuzzy matching)
    const fuzzyMatch = uniqueKeys.find(
      (key) =>
        key.includes(fieldKey.toLowerCase()) ||
        fieldKey.toLowerCase().includes(key) ||
        key.replace(/_/g, "").toLowerCase() ===
          fieldKey.replace(/_/g, "").toLowerCase()
    );

    if (fuzzyMatch) {
      return fuzzyMatch;
    }

    // Return original if no mapping found
    return fieldKey;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-y-auto">
      {/* AI Failure Banner */}
      {hasAIFailure && (
        <div className="mb-4">
          <AIFailureBanner
            onRetry={handleAIRetry}
            isRetrying={isRetrying}
            errorMessage={selectedCardForReview?.ai_error_message}
          />
        </div>
      )}
      

      
      <div className="space-y-3 sm:space-y-4">
        {selectedCardForReview ? (
          <>
            {fieldsToShow.map((fieldKey) => {
              const actualFieldKey = getFormDataKey(fieldKey);
              const fieldData: FieldData | undefined =
                selectedCardForReview.fields?.[actualFieldKey];
              const label = getFieldLabel(fieldKey);
              const needsReview = !!fieldData?.requires_human_review;
              const isReviewed = !!fieldData?.reviewed;
              const reviewNotes = fieldData?.review_notes || undefined;
              const showIcon = needsReview;
              const tooltipContent =
                typeof reviewNotes === "string" && reviewNotes.length > 0
                  ? reviewNotes
                  : needsReview
                  ? "Needs human review"
                  : null;
              return (
                <div
                  key={fieldKey}
                  className="flex flex-col sm:grid sm:grid-cols-5 sm:items-center gap-2 sm:gap-x-4 sm:gap-y-1"
                >
                  <Label
                    htmlFor={fieldKey}
                    className="sm:text-right sm:col-span-2 text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:justify-end"
                  >
                    {showIcon && !isReviewed && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-400 flex-shrink-0 text-white text-[8px] font-bold leading-none">
                              !
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p>{tooltipContent}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {label}:
                  </Label>
                  <div className="sm:col-span-3 flex items-center gap-2">
                    {renderFieldInput(fieldKey, actualFieldKey, isReviewed, needsReview)}
                    {showIcon && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className={`h-10 w-10 sm:h-8 sm:w-8 p-1 ${
                                isReviewed
                                  ? "text-green-500"
                                  : "text-gray-400 hover:text-gray-600"
                              }`}
                              onClick={(e) =>
                                handleFieldReview(actualFieldKey, e)
                              }
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>
                              {isReviewed
                                ? "Mark as needing review"
                                : "Mark as reviewed"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <p className="text-gray-500 text-center mt-4 text-sm">
            No card selected for review.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
