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
import { formatPhoneNumber, formatBirthday, normalizeFieldValue, normalizeAddress } from "@/lib/utils";
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
import { AddressGroupWithStatus } from "@/components/ui/address-group-with-status";

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
    const rawFieldValue = formData[actualFieldKey] || "";
    const fieldValue = normalizeFieldValue(rawFieldValue, actualFieldKey);

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

    // Force entry_term and entry_year to always be text inputs
    if (actualFieldKey === "entry_term" || actualFieldKey === "entry_year") {
      return (
        <Input
          type="text"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, normalizeFieldValue(e.target.value, actualFieldKey))}
          placeholder={getFieldLabel(fieldKey)}
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Handle select fields (dropdowns) with options
    if (fieldConfig?.field_type === 'select' && fieldConfig.options && fieldConfig.options.length > 0) {
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => handleFormChange(actualFieldKey, value)}
        >
          <SelectTrigger className={getInputClassName("h-10 sm:h-8 text-sm w-full")}>
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
          <SelectTrigger className={getInputClassName("h-10 sm:h-8 text-sm w-full")}>
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

    // Handle mapped_major field with type-ahead search if majors are available  
    if (actualFieldKey === "mapped_major" && majorsList.length > 0) {
      return (
        <Combobox
          options={majorsList}
          value={fieldValue}
          onValueChange={(value) => handleFormChange(actualFieldKey, value)}
          placeholder="Search for a major..."
          searchPlaceholder="Type to search majors..."
          emptyMessage="No majors found."
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Keep major field as text input to preserve original card text
    if (actualFieldKey === "major") {
      return (
        <Input
          type="text"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, normalizeFieldValue(e.target.value, actualFieldKey))}
          placeholder="Major from card"
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
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
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Handle email fields
    if (fieldConfig?.field_type === 'email' || actualFieldKey === "email") {
      return (
        <Input
          type="email"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, normalizeFieldValue(e.target.value, actualFieldKey))}
          placeholder="Email address"
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Handle date fields
    if (fieldConfig?.field_type === 'date' || actualFieldKey === "date_of_birth") {
      return (
        <DateInput
          value={fieldValue}
          onChange={(value) => handleFormChange(actualFieldKey, value)}
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Special handling for address field to prevent cursor jumping
    if (actualFieldKey === 'address') {
      return (
        <Input
          type="text"
          value={fieldValue}
          onChange={(e) => handleFormChange(actualFieldKey, e.target.value)}
          onBlur={(e) => handleFormChange(actualFieldKey, normalizeAddress(e.target.value))}
          placeholder={fieldConfig?.placeholder || getFieldLabel(fieldKey)}
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
        />
      );
    }

    // Default text input
    return (
      <Input
        type="text"
        value={fieldValue}
        onChange={(e) => handleFormChange(actualFieldKey, normalizeFieldValue(e.target.value, actualFieldKey))}
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
    // Check for exact match in formData or card fields
    if (fieldKey in formData || selectedCardForReview?.fields?.[fieldKey]) {
      return fieldKey;
    }

    // Return original if no match found
    return fieldKey;
  };

  // Address fields for validation and grouping
  const addressFields = ['address', 'city', 'state', 'zip_code'];
  const isAddressField = (fieldKey: string) => addressFields.includes(fieldKey);

  // Group fields to handle address fields specially while maintaining original order
  const groupedFields = useMemo(() => {
    const hasAddressFields = fieldsToShow.some(field => addressFields.includes(field));
    
    if (!hasAddressFields) {
      return fieldsToShow.map(field => ({ type: 'regular', field }));
    }

    const groups: Array<{ type: 'regular' | 'address', field?: string, fields?: string[] }> = [];
    const usedAddressFields = new Set<string>();
    const presentAddressFields = fieldsToShow.filter(field => addressFields.includes(field));
    
    // Find the position of the first address field to maintain order
    const firstAddressFieldIndex = fieldsToShow.findIndex(field => addressFields.includes(field));
    let addressGroupAdded = false;

    // Process fields in original order
    fieldsToShow.forEach((field, index) => {
      if (addressFields.includes(field)) {
        // Add address group at the position of the first address field
        if (!addressGroupAdded) {
          groups.push({ type: 'address', fields: presentAddressFields });
          addressGroupAdded = true;
        }
        usedAddressFields.add(field);
      } else {
        // Add regular field
        groups.push({ type: 'regular', field });
      }
    });

    return groups;
  }, [fieldsToShow]);

  // Get appropriate width for different field types
  const getFieldWidth = (fieldKey: string) => {
    switch (fieldKey) {
      case 'email':
        return 'w-80'; // Longer for emails
      case 'name':
      case 'first_name':
      case 'last_name':
        return 'w-56'; // Medium for names
      case 'middle_initial':
      case 'preferred_first_name':
        return 'w-48'; // Shorter for initials/preferred names
      case 'cell':
      case 'home_phone':
      case 'phone':
        return 'w-44'; // Phone number width
      case 'date_of_birth':
      case 'birthday':
        return 'w-36'; // Date width
      case 'gpa':
      case 'class_rank':
        return 'w-24'; // Small numeric fields
      case 'state':
        return 'w-20'; // Very short for state codes
      default:
        return 'w-64'; // Default medium width
    }
  };

  // Render address fields group
  const renderAddressFieldsGroup = (addressFields: string[]) => {
    const addressData = selectedCardForReview?.fields?.address;
    const cityData = selectedCardForReview?.fields?.city;
    const stateData = selectedCardForReview?.fields?.state;
    const zipCodeData = selectedCardForReview?.fields?.zip_code;

    const hasAnyReviewNeeded = [addressData, cityData, stateData, zipCodeData].some(
      data => data?.requires_human_review
    );
    
    return (
      <div key="address-group" className="flex items-start gap-4 py-1">
        {/* Label - Fixed Width */}
        <Label className="w-32 text-right text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 justify-end shrink-0 pt-2">
          {hasAnyReviewNeeded && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-400 flex-shrink-0 text-white text-[8px] font-bold leading-none">
                    !
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Address needs review</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          Address:
        </Label>
        
        {/* Address Fields - Natural Widths */}
        <div className="flex-1">
          <AddressGroupWithStatus
            address={formData.address || ""}
            city={formData.city || ""}
            state={formData.state || ""}
            zipCode={formData.zip_code || ""}
            onAddressChange={(value) => handleFormChange("address", value)}
            onCityChange={(value) => handleFormChange("city", value)}
            onStateChange={(value) => handleFormChange("state", value)}
            onZipCodeChange={(value) => handleFormChange("zip_code", value)}
            addressFieldData={addressData}
            cityFieldData={cityData}
            stateFieldData={stateData}
            zipCodeFieldData={zipCodeData}
          />
        </div>
      </div>
    );
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
      

      
      <div className="space-y-2">
        {selectedCardForReview ? (
          <>
            {groupedFields.map((group, index) => {
              if (group.type === 'address') {
                return renderAddressFieldsGroup(group.fields!);
              }

              // Regular field rendering
              const fieldKey = group.field!;
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
                  className="flex items-center gap-4 py-1"
                >
                  {/* Label - Fixed Width */}
                  <Label
                    htmlFor={fieldKey}
                    className="w-32 text-right text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 justify-end shrink-0"
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
                  
                  {/* Field - Natural Width Based on Content Type */}
                  <div className={`${getFieldWidth(actualFieldKey)}`}>
                    {renderFieldInput(fieldKey, actualFieldKey, isReviewed, needsReview)}
                  </div>
                  
                  {/* Status Zone - Next to Field */}
                  <div className="flex items-center gap-2">
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
