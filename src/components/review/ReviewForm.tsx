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
import { logger } from '@/utils/logger';
import { formatPhoneNumber, formatBirthday, normalizeFieldValue, normalizeAddress, cn } from "@/lib/utils";
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
import { AddressGroupSimple } from "@/components/ui/address-group-simple";
import { HighSchoolSearch } from "@/components/ui/high-school-search";
import type { HighSchool } from "@/services/HighSchoolService";

// Removed hardcoded FIELD_LABELS - now using backend configuration via getFieldLabel function

interface ReviewFormProps {
  selectedCardForReview: ProspectCard | null;
  fieldsToShow: string[];
  formData: Record<string, string>;
  handleFormChange: (field: string, value: string) => void;
  handleFormBatchChange?: (updates: Record<string, string>) => void;
  handleFieldReview: (fieldKey: string, e: React.MouseEvent) => void;
  selectedTab: string;
  dataFieldsMap: Map<string, string>;
  majorsList?: string[];
  loadingMajors?: boolean;
  onCardUpdated?: () => void;
  cardFields?: CardField[]; // Add cardFields prop for field types
  isModalOpen?: boolean; // Add modal open state
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  selectedCardForReview,
  fieldsToShow,
  formData,
  handleFormChange,
  handleFormBatchChange,
  handleFieldReview,
  selectedTab,
  dataFieldsMap,
  majorsList = [],
  loadingMajors = false,
  onCardUpdated,
  cardFields = [],
  isModalOpen = true,
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

  // Check if this is a QR scan (no image available)
  const isQrScan = !selectedCardForReview?.image_path;

  // Render field input based on field type
  const renderFieldInput = (fieldKey: string, actualFieldKey: string, isReviewed: boolean, needsReview: boolean) => {
    const fieldConfig = getFieldConfig(actualFieldKey);
    const rawFieldValue = formData[actualFieldKey] || "";
    const fieldValue = normalizeFieldValue(rawFieldValue, actualFieldKey);

    // Build conditional styling for reviewed/needs review states
    const getInputClassName = (baseClasses: string = "") => {
      return `${baseClasses} ${
        isReviewed && !isQrScan
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
          <SelectContent className="z-[100]" align="start" sideOffset={4}>
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
      // Use default options if fieldConfig.options is empty or undefined
      const options = (fieldConfig?.options && fieldConfig.options.length > 0) 
        ? fieldConfig.options 
        : ["Yes", "No"];
      
      logger.log('🔍 Permission to Text Debug:', {
        actualFieldKey,
        fieldValue,
        options,
        fieldConfig,
        hasFieldConfig: !!fieldConfig,
        fieldType: fieldConfig?.field_type,
        backendOptionsEmpty: fieldConfig?.options?.length === 0
      });
      
      return (
        <Select
          value={fieldValue}
          onValueChange={(value) => {
            logger.log('🔄 Permission to Text value changed:', value);
            handleFormChange(actualFieldKey, value);
          }}
          onOpenChange={(open) => {
            logger.log('📋 Permission to Text dropdown open state:', open);
          }}
        >
          <SelectTrigger 
            className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
            onClick={() => logger.log('🖱️ Permission to Text trigger clicked')}
          >
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent className="z-[100]" align="start" sideOffset={4}>
            {options.length === 0 ? (
              <div className="p-2 text-sm text-gray-500">No options available</div>
            ) : (
              options.map((option) => {
                logger.log('📋 Rendering option:', option);
                return (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                );
              })
            )}
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

    // Special handling for high school field with enhanced validation
    if (actualFieldKey === 'high_school') {
      const fieldData = selectedCardForReview?.fields?.[actualFieldKey];
      const ceebCode = formData['ceeb_code'] || selectedCardForReview?.fields?.ceeb_code?.value || '';
      logger.log('🔍 CEEB CODE DEBUG:', {
        formDataCeeb: formData['ceeb_code'],
        cardFieldCeeb: selectedCardForReview?.fields?.ceeb_code?.value,
        finalCeebCode: ceebCode,
        allCardFields: Object.keys(selectedCardForReview?.fields || {}),
        ceebField: selectedCardForReview?.fields?.ceeb_code,
        // Check alternative field names
        alternativeFields: {
          ceeb: selectedCardForReview?.fields?.ceeb,
          ceebcode: selectedCardForReview?.fields?.ceebcode,
          school_code: selectedCardForReview?.fields?.school_code
        },
        // Log all field values to find CEEB
        allFieldsDebug: Object.entries(selectedCardForReview?.fields || {}).reduce((acc, [key, field]) => {
          if (key.toLowerCase().includes('ceeb') || key.toLowerCase().includes('code')) {
            acc[key] = field;
          }
          return acc;
        }, {}),
        // Check if CEEB exists with different casing
        ceebVariations: Object.keys(selectedCardForReview?.fields || {}).filter(key => 
          key.toLowerCase().includes('ceeb')
        )
      });
      const state = formData['state'] || selectedCardForReview?.fields?.state?.value || '';
      
      // Get enhanced validation status from backend
      const validationStatus = selectedCardForReview?.fields?.high_school_validation;
      
      // Legacy fallback for existing suggestions format
      const legacySuggestions = fieldData?.metadata?.suggestions || [];
      
      // Convert enhanced validation suggestions to HighSchool format if available
      const enhancedSuggestions = validationStatus?.suggestions?.map(suggestion => ({
        id: suggestion.id,
        name: suggestion.name,
        ceeb_code: suggestion.ceeb_code,
        city: suggestion.location.split(', ')[0] || '',
        state: suggestion.location.split(', ')[1] || '',
        match_score: suggestion.match_score,
        district_name: suggestion.distance_info
      })) || [];
      
      // Don't use cached suggestions - let the component use live search instead
      const suggestions: HighSchool[] = [];
      
      // Extract school data for verified schools from metadata
      let schoolData: HighSchool | undefined;
      if (validationStatus?.value === 'verified' && fieldData?.metadata?.school_id) {
        // Create school data from field metadata for verified schools
        schoolData = {
          id: fieldData.metadata.school_id,
          name: fieldValue,
          ceeb_code: ceebCode,
          city: fieldData.metadata.school_city || '',
          state: fieldData.metadata.school_state || '',
        };
      } else if (validationStatus?.value === 'verified' && ceebCode) {
        // Fallback: if we have verification status and CEEB but no detailed metadata
        // Still create school data so the UI can show verification
        schoolData = {
          id: 'backend-verified',
          name: fieldValue,
          ceeb_code: ceebCode,
          city: '', // Will fallback to "High school verified" message
          state: '',
        };
      }
      
      // Removed excessive debug logging for performance
      // logger.log('selectedCardForReview:', selectedCardForReview);
      // logger.log('selectedCardForReview.fields:', selectedCardForReview?.fields);
      
      if (selectedCardForReview?.fields) {
        // logger.log('🔍 ALL FIELD KEYS:', Object.keys(selectedCardForReview.fields));
        
        // Check every field that contains key words
        const relevantFields = {};
        Object.entries(selectedCardForReview.fields).forEach(([key, value]) => {
          if (key.includes('ceeb') || key.includes('validation') || key.includes('high_school') || key === 'high_school') {
            relevantFields[key] = value;
            // logger.log(`🎯 RELEVANT FIELD: ${key}:`, value);
          }
        });
        
        // logger.log('📋 ALL RELEVANT FIELDS:', relevantFields);
        
        // Specific field checks
        // logger.log('🔍 Direct field access:');
        // logger.log('  ceeb_code:', selectedCardForReview.fields.ceeb_code);
        // logger.log('  high_school_validation:', selectedCardForReview.fields.high_school_validation);
        // logger.log('  high_school:', selectedCardForReview.fields.high_school);
        
        // Check if these fields have the right structure
        if (selectedCardForReview.fields.ceeb_code) {
          // logger.log('🎯 CEEB CODE STRUCTURE:', {
          //   value: selectedCardForReview.fields.ceeb_code.value,
          //   source: selectedCardForReview.fields.ceeb_code.source,
          //   fullField: selectedCardForReview.fields.ceeb_code
          // });
        }
        
        if (selectedCardForReview.fields.high_school_validation) {
          // logger.log('🎯 VALIDATION STRUCTURE:', {
          //   value: selectedCardForReview.fields.high_school_validation.value,
          //   source: selectedCardForReview.fields.high_school_validation.source,
          //   fullField: selectedCardForReview.fields.high_school_validation
          // });
        }
        
        if (selectedCardForReview.fields.high_school) {
          // logger.log('🎯 HIGH SCHOOL STRUCTURE:', {
          //   value: selectedCardForReview.fields.high_school.value,
          //   source: selectedCardForReview.fields.high_school.source,
          //   metadata: selectedCardForReview.fields.high_school.metadata,
          //   fullField: selectedCardForReview.fields.high_school
          // });
        }
      }
      
      // Debug logging for high school field
      logger.log('🏫 HIGH SCHOOL DEBUG - ReviewForm props:', {
        fieldValue,
        ceebCode,
        validationStatus: validationStatus?.value,
        isEnhancedValidation: !!validationStatus,
        schoolData,
        suggestions: suggestions.length,
        state,
        city: formData.city || selectedCardForReview?.fields?.city?.value || '',
        fieldData: fieldData?.metadata
      });
      
      // Determine review status based on enhanced validation
      // For high school fields, if the user has typed something that doesn't match a verified school,
      // it should need review regardless of the backend validation status
      const isCurrentlyVerified = !!ceebCode || (validationStatus?.value === 'verified' && schoolData?.id);
      
      // Check if field needs review based on multiple conditions:
      // 1. Backend says it needs review (needsReview)
      // 2. Has enhanced validation but not verified
      // 3. Has validation status that's not 'verified'
      // 4. Has suggestions but no CEEB code
      const enhancedNeedsReview = validationStatus && validationStatus.value !== 'verified';
      const hasSuggestionsButNotVerified = suggestions.length > 0 && !isCurrentlyVerified;
      const reviewStatus = needsReview || enhancedNeedsReview || hasSuggestionsButNotVerified;
      
      return (
        <HighSchoolSearch
          value={fieldValue}
          ceebCode={ceebCode}
          schoolData={schoolData}
          state={state}
          city={formData.city || selectedCardForReview?.fields?.city?.value || ''}
          isInModal={isModalOpen}
          onChange={(newValue, newCeebCode, newSchoolData) => {
            handleFormChange(actualFieldKey, newValue);
            
            if (newCeebCode) {
              // School selected - update CEEB and validation status
              logger.log('🏫 Updating CEEB code and validation status:', newCeebCode);
              handleFormChange('ceeb_code', newCeebCode);
              
              if (selectedCardForReview?.fields?.high_school_validation) {
                selectedCardForReview.fields.high_school_validation.value = 'verified';
                logger.log('🟢 Updated high_school_validation to verified');
              }
              
              // Automatically mark field as reviewed when a school is selected
              // This removes the need for the extra click on the review checkbox
              logger.log('🟢 Auto-marking high school field as reviewed due to school selection', {
                actualFieldKey,
                currentFieldState: selectedCardForReview?.fields?.[actualFieldKey],
                formDataValue: formData[actualFieldKey]
              });
              
              // Explicitly set the field as reviewed (don't toggle)
              if (selectedCardForReview?.fields?.[actualFieldKey]) {
                selectedCardForReview.fields[actualFieldKey].reviewed = true;
                selectedCardForReview.fields[actualFieldKey].requires_human_review = false;
                selectedCardForReview.fields[actualFieldKey].review_notes = "Automatically reviewed (school selected)";
                logger.log('🟢 Explicitly set high school field as reviewed');
              } else {
                // Create the field if it doesn't exist
                selectedCardForReview.fields[actualFieldKey] = {
                  value: newValue,
                  required: false,
                  enabled: true,
                  review_confidence: 0.9,
                  requires_human_review: false,
                  reviewed: true,
                  review_notes: "Automatically reviewed (school selected)",
                  confidence: 0.9,
                  bounding_box: []
                };
                logger.log('🟢 Created and marked high school field as reviewed');
              }
            } else if (newValue.trim() === '') {
              // Field cleared - reset CEEB and validation status AND mark as needs review
              logger.log('🧹 Clearing CEEB code and validation status');
              handleFormChange('ceeb_code', '');
              
              if (selectedCardForReview?.fields?.high_school_validation) {
                selectedCardForReview.fields.high_school_validation.value = 'needs_validation';
                logger.log('🔴 Reset high_school_validation to needs_validation');
              }
              
              // Reset the review status when field is cleared
              if (selectedCardForReview?.fields?.[actualFieldKey]) {
                selectedCardForReview.fields[actualFieldKey].reviewed = false;
                selectedCardForReview.fields[actualFieldKey].requires_human_review = true;
                logger.log('🔴 Reset high school field review status (field cleared)');
              }
              
              // Also clear CEEB from the card fields to prevent validation override
              if (selectedCardForReview?.fields?.ceeb_code) {
                selectedCardForReview.fields.ceeb_code.value = '';
                logger.log('🔴 Cleared CEEB code from card fields');
              }
            }
          }}
          placeholder="Search for high school..."
          className={getInputClassName("h-10 sm:h-8 text-sm w-full")}
          needsReview={reviewStatus && !isReviewed}
          isReviewed={isReviewed}
          suggestions={suggestions}
          validationStatus='unvalidated'
          isEnhancedValidation={false}
          onManualReview={() => {
            // Mark field as reviewed manually
            if (handleFieldReview) {
              const mockEvent = new MouseEvent('click') as any;
              handleFieldReview(actualFieldKey, mockEvent);
            }
          }}
        />
      );
    }

    // CEEB Code field - hidden from UI but kept in data for CSV export
    if (actualFieldKey === 'ceeb_code') {
      return null; // Don't render CEEB code field in review modal
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

  // Get appropriate width for different field types - responsive for mobile
  const getFieldWidth = (fieldKey: string) => {
    switch (fieldKey) {
      case 'email':
        return 'w-full sm:w-80'; // Full width on mobile, longer on desktop
      case 'name':
      case 'first_name':
      case 'last_name':
        return 'w-full sm:w-56'; // Full width on mobile
      case 'middle_initial':
      case 'preferred_first_name':
        return 'w-full sm:w-48'; // Full width on mobile
      case 'cell':
      case 'home_phone':
      case 'phone':
        return 'w-full sm:w-44'; // Full width on mobile
      case 'date_of_birth':
      case 'birthday':
        return 'w-full sm:w-36'; // Full width on mobile
      case 'gpa':
      case 'class_rank':
        return 'w-full sm:w-24'; // Full width on mobile
      case 'state':
        return 'w-full sm:w-20'; // Full width on mobile
      default:
        return 'w-full sm:w-64'; // Full width on mobile
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
    
    // Check if any address field has been marked as reviewed
    const hasAnyAddressReviewed = [addressData, cityData, stateData, zipCodeData].some(
      data => data?.reviewed
    );
    
    const isSignupSheet = selectedCardForReview?.upload_type === "signup_sheet";
    const showRedIcon = hasAnyReviewNeeded && !hasAnyAddressReviewed && !isSignupSheet; // Hide red icons for signup sheets or reviewed addresses
    
    return (
      <div key="address-group" className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 sm:py-1">
        {/* Label - Full width on mobile, fixed width on desktop */}
        <Label className="w-full sm:w-32 text-left sm:text-right text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:justify-end shrink-0 sm:pt-2">
          {showRedIcon && (
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

        {/* Address Fields - Full width on mobile */}
        <div className="flex-1 w-full">
          <AddressGroupSimple
            address={formData.address || ""}
            city={formData.city || ""}
            state={formData.state || ""}
            zipCode={formData.zip_code || ""}
            onAddressChange={(value) => handleFormChange("address", value)}
            onCityChange={(value) => handleFormChange("city", value)}
            onStateChange={(value) => handleFormChange("state", value)}
            onZipCodeChange={(value) => handleFormChange("zip_code", value)}
            onBatchChange={handleFormBatchChange}
            addressFieldData={addressData}
            cityFieldData={cityData}
            stateFieldData={stateData}
            zipCodeFieldData={zipCodeData}
            reviewStatus={selectedCardForReview?.review_status}
            onFieldReview={(fieldKey) => handleFieldReview(fieldKey, { preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent)}
            disabled={!selectedCardForReview || !isModalOpen}
            isQrScan={isQrScan}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-x-hidden w-full max-w-full">
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
      
      {/* Sign-up Sheet Badge */}
      {selectedCardForReview?.upload_type === "signup_sheet" && (
        <div className="mb-4 flex items-center gap-2">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-indigo-800 text-sm font-medium">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11zm2 0a1 1 0 100 2h.01a1 1 0 100-2H13zm-8-2a1 1 0 011-1h.01a1 1 0 110 2H6a1 1 0 01-1-1zm1-2a1 1 0 100 2h.01a1 1 0 100-2H6zm2 0a1 1 0 100 2h.01a1 1 0 100-2H8zm2 0a1 1 0 100 2h.01a1 1 0 100-2H10zm2 0a1 1 0 100 2h.01a1 1 0 100-2H12z" clipRule="evenodd"/>
                  </svg>
                  Sign-up Sheet
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Imported from sign-up sheet - please verify all fields</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      
      <div className="space-y-2 w-full max-w-full overflow-x-hidden">
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
              // Special handling for high_school field review status
              let needsReview = !!fieldData?.requires_human_review;
              let isReviewed = !!fieldData?.reviewed;
              
              // For high school field, check additional conditions
              if (actualFieldKey === 'high_school') {
                const ceebCode = formData['ceeb_code'] || selectedCardForReview?.fields?.ceeb_code?.value || '';
                const validationStatus = selectedCardForReview?.fields?.high_school_validation;
                const hasVerifiedCeeb = !!ceebCode;
                const isValidated = validationStatus?.value === 'verified' && hasVerifiedCeeb; // Only validated if has CEEB
                const fieldValue = formData[actualFieldKey] || selectedCardForReview?.fields?.[actualFieldKey]?.value || '';
                const originalValue = selectedCardForReview?.fields?.[actualFieldKey]?.value || '';
                const hasUserModifiedField = fieldValue !== originalValue;
                
                logger.log('🏫 High School FULL Debug:');
                logger.log('  fieldValue:', fieldValue);
                logger.log('  originalValue:', originalValue);
                logger.log('  hasUserModifiedField:', hasUserModifiedField);
                logger.log('  isValidated:', isValidated);
                logger.log('  fieldDataReviewed:', fieldData?.reviewed);
                logger.log('  formDataValue:', formData[actualFieldKey]);
                logger.log('  cardFieldValue:', selectedCardForReview?.fields?.[actualFieldKey]?.value);
                logger.log('  isReviewedBefore:', isReviewed);
                logger.log('  validationStatus:', validationStatus?.value);
                
                // If user has modified the field and it's not validated, reset reviewed state
                if (hasUserModifiedField && !isValidated) {
                  isReviewed = false;
                  needsReview = true;
                  logger.log('🔄 User modified high school field - resetting reviewed state');
                }
                // Special case: if field is empty AND validation status is needs_validation (from clear operation)
                // Always reset the reviewed state when field is cleared
                else if (!fieldValue.trim() && validationStatus?.value === 'needs_validation') {
                  isReviewed = false;
                  needsReview = true;
                  logger.log('🔄 Field cleared - overriding reviewed state');
                }
                // If field is empty (but not from a clear operation), suggest review but allow manual override
                else if (!fieldValue.trim() && validationStatus?.value !== 'needs_validation' && !fieldData?.reviewed) {
                  // Only force needs review if not manually reviewed and not from clear operation
                  needsReview = true;
                  logger.log('🔴 High school field is empty - suggesting review (but respects manual review)');
                }
                // For "ready for export" tab: if school is verified, treat as reviewed automatically
                else if (selectedTab === 'ready_for_export' && isValidated) {
                  isReviewed = true;
                  needsReview = false;
                  logger.log('🟢 Setting high school as reviewed (ready for export + validated)');
                } else if (!isValidated && !isReviewed) {
                  // Field needs review if it's not fully validated (no CEEB = needs review)
                  // BUT respect the reviewed state if user has manually reviewed it
                  needsReview = true;
                  logger.log('🔴 Setting high school as needs review');
                }
                
                logger.log('🏫 High School Final State:', {
                  isReviewed,
                  needsReview
                });
              }
              
              const reviewNotes = fieldData?.review_notes || undefined;
              const isSignupSheet = selectedCardForReview?.upload_type === "signup_sheet";
              const showRedIcon = needsReview && !isReviewed && !isSignupSheet; // Hide red icons for signup sheets
              const showReviewCircle = needsReview || (actualFieldKey === 'high_school' && !isReviewed && !formData['ceeb_code']); // Show circle for high school when needs review
              
              if (actualFieldKey === 'high_school') {
                // Debug logging removed for production
              }
              const tooltipContent =
                typeof reviewNotes === "string" && reviewNotes.length > 0
                  ? reviewNotes
                  : needsReview
                  ? "Needs human review"
                  : null;
              return (
                <div
                  key={fieldKey}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 sm:py-1"
                >
                  {/* Label - Full width on mobile, fixed width on desktop */}
                  <Label
                    htmlFor={fieldKey}
                    className="w-full sm:w-32 text-left sm:text-right text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:justify-end shrink-0"
                  >
                    {showRedIcon && (
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
                  
                  {/* Field and Status Zone - Flex row on mobile */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Field - Full width on mobile */}
                    <div className={`flex-1 sm:flex-none ${getFieldWidth(actualFieldKey)}`}>
                      {renderFieldInput(fieldKey, actualFieldKey, isReviewed, needsReview && !isReviewed)}
                    </div>

                    {/* Status Zone - Next to Field */}
                    <div className="flex items-center gap-2 shrink-0">
                      {showReviewCircle && (
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
