import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAddressValidation, isPipelineVerified, valuesMatchPipeline } from "@/hooks/useAddressValidation";
import { AddressSuggestionsPanel } from "@/components/ui/address-suggestions-panel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  Lightbulb,
  MapPin
} from "lucide-react";

interface AddressGroupSimplifiedProps {
  // Field values
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Change handlers
  onAddressChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onZipCodeChange: (value: string) => void;
  
  // Field metadata from pipeline
  addressFieldData?: { value?: string; source?: string; requires_human_review?: boolean; reviewed?: boolean };
  cityFieldData?: { value?: string; source?: string; requires_human_review?: boolean; reviewed?: boolean };
  stateFieldData?: { value?: string; source?: string; requires_human_review?: boolean; reviewed?: boolean };
  zipCodeFieldData?: { value?: string; source?: string; requires_human_review?: boolean; reviewed?: boolean };
  
  // Styling
  className?: string;
  disabled?: boolean;
}

export function AddressGroupSimplified({
  address,
  city,
  state,
  zipCode,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  addressFieldData,
  cityFieldData,
  stateFieldData,
  zipCodeFieldData,
  className = "",
  disabled = false,
}: AddressGroupSimplifiedProps) {
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  
  // Debug logging (can be removed later)
  console.log("🏗️ AddressGroupSimplified render:", {
    address,
    addressFieldData: { source: addressFieldData?.source, value: addressFieldData?.value }
  });
  
  const { 
    validationState, 
    suggestion, 
    error, 
    validateAddress, 
    clearValidation, 
    applySuggestion 
  } = useAddressValidation({
    debounceMs: 800,
    minLoadingMs: 500
  });

  // Check if address has been reviewed/approved (either pipeline or human)
  const addressVerifiedInPipeline = isPipelineVerified(addressFieldData);
  const addressReviewedByHuman = addressFieldData?.reviewed === true;
  const addressIsApproved = addressVerifiedInPipeline || addressReviewedByHuman;
  
  console.log("🔍 Address approval check:", {
    addressVerifiedInPipeline,
    addressReviewedByHuman,
    addressIsApproved,
    addressFieldData: {
      source: addressFieldData?.source,
      value: addressFieldData?.value,
      requires_human_review: addressFieldData?.requires_human_review,
      reviewed: addressFieldData?.reviewed,
      review_notes: addressFieldData?.review_notes
    }
  });
  
  // Current field values
  const currentFields = { address, city, state, zip_code: zipCode };
  
  // Pipeline field values
  const pipelineFields = {
    address: addressFieldData,
    city: cityFieldData,
    state: stateFieldData,
    zip_code: zipCodeFieldData
  };
  
  // Check if current values match pipeline values
  const matchesPipelineValues = valuesMatchPipeline(currentFields, pipelineFields);
  
  console.log("🔄 Pipeline values comparison:", {
    currentFields,
    pipelineFields,
    matchesPipelineValues
  });
  
  // If this is pipeline verified, we should let the hook know so it doesn't make unnecessary calls
  useEffect(() => {
    if (addressVerifiedInPipeline && matchesPipelineValues) {
      // This address was verified in the pipeline, so mark it as verified in the hook
      const currentHash = JSON.stringify(currentFields);
      // We can't directly access the cache, but we can indicate this is verified
      console.log("📋 Pipeline verified address detected - should skip API calls");
    }
  }, [addressVerifiedInPipeline, matchesPipelineValues, currentFields]);
  
  // Determine final validation state for UI
  const getFinalValidationState = () => {
    // If address has been approved (pipeline OR human review) and user hasn't changed it
    if (addressIsApproved && matchesPipelineValues) {
      console.log("✅ Using approved address - returning 'verified'");
      return "verified";
    }
    
    // For non-approved addresses, use real-time validation state
    // But don't show "not_verified" until we've actually attempted validation
    if (validationState === "not_verified" && !address?.trim()) {
      // No address data, so no state to show
      console.log("📝 No address data - returning null");
      return null;
    }
    
    console.log("🔄 Using real-time validation state:", validationState);
    return validationState;
  };
  
  const finalValidationState = getFinalValidationState();
  
  console.log("🎯 Final validation state:", {
    finalValidationState,
    addressIsApproved,
    matchesPipelineValues,
    validationState
  });
  
  // Trigger validation only when fields actually change and we're not already approved
  useEffect(() => {
    const hasAddressData = address || city || state || zipCode;
    
    // Check if this address is approved (pipeline OR human reviewed) and unchanged
    const isApprovedAndUnchanged = addressIsApproved && matchesPipelineValues;
    
    // Only consider real-time verification if we're not already approved
    const isRealtimeVerified = !isApprovedAndUnchanged && validationState === "verified";
    
    // We're verified if either approved-and-unchanged OR real-time verified
    const isCurrentlyVerified = isApprovedAndUnchanged || isRealtimeVerified;
    
    console.log("🔍 Address validation decision:", {
      hasAddressData,
      addressIsApproved,
      matchesPipelineValues,
      isApprovedAndUnchanged,
      validationState,
      isRealtimeVerified,
      isCurrentlyVerified,
      willMakeAPICall: hasAddressData && !isCurrentlyVerified,
      currentFields
    });
    
    if (hasAddressData && !isCurrentlyVerified) {
      // Only validate if we have data and we're not currently verified/approved
      validateAddress(currentFields);
    } else if (!hasAddressData) {
      // Clear validation if no data
      clearValidation();
    }
    
  }, [address, city, state, zipCode, addressIsApproved, matchesPipelineValues, validateAddress, clearValidation]);

  // Handle applying suggestion from panel
  const handleApplySuggestion = (sug: any) => {
    // Apply the suggestion to form fields
    onAddressChange(sug.address);
    onCityChange(sug.city);
    onStateChange(sug.state);
    onZipCodeChange(sug.zip_code);
    
    // Update validation state to verified
    applySuggestion((suggestionData) => {
      // The applySuggestion callback from hook handles validation state
    });
    
    setIsSuggestionPanelOpen(false);
  };

  // Handle opening suggestion panel
  const handleOpenSuggestions = () => {
    if (suggestion) {
      setIsSuggestionPanelOpen(true);
    }
  };

  // Get field styling based on review status
  const getFieldClassName = (fieldData?: { requires_human_review?: boolean; reviewed?: boolean }) => {
    const baseClasses = "h-10 sm:h-8 text-sm";
    
    if (fieldData?.reviewed) {
      return `${baseClasses} border-green-300 focus-visible:ring-green-400 bg-green-50`;
    } else if (fieldData?.requires_human_review) {
      return `${baseClasses} border-red-300 focus-visible:ring-red-400`;
    }
    
    return baseClasses;
  };

  // Render validation status UI
  const renderValidationStatus = () => {
    console.log("🎨 Rendering validation status for state:", finalValidationState);
    
    switch (finalValidationState) {
      case "loading":
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Validating address...</span>
          </div>
        );

      case "verified":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span>Address verified by Google Maps</span>
          </div>
        );

      case "can_be_verified":
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <MapPin className="w-3 h-3" />
            <button 
              onClick={handleOpenSuggestions}
              className="text-blue-700 underline hover:no-underline font-medium"
            >
              Click here to verify address
            </button>
          </div>
        );

      case "no_house_number":
        return (
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            <span>
              Please{' '}
              <button 
                onClick={() => {
                  const addressInput = document.querySelector('input[placeholder="Street Address"]') as HTMLInputElement;
                  if (addressInput) {
                    addressInput.focus();
                    addressInput.select();
                  }
                }}
                className="text-orange-700 underline hover:no-underline font-medium"
              >
                add a house number
              </button>
              {' '}to validate the address
            </span>
          </div>
        );

      case "not_verified":
        return (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span>
              {error || "Address not found"}
              {!error?.includes("Network error") && (
                <>
                  {' '}- {' '}
                  <button 
                    onClick={() => {
                      const addressInput = document.querySelector('input[placeholder="Street Address"]') as HTMLInputElement;
                      if (addressInput) {
                        addressInput.focus();
                        addressInput.select();
                      }
                    }}
                    className="text-red-700 underline hover:no-underline font-medium"
                  >
                    edit to retry
                  </button>
                </>
              )}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Street Address Input */}
      <Input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Street Address"
        className={cn(getFieldClassName(addressFieldData), "w-full max-w-sm")}
        disabled={disabled}
      />
      
      {/* City, State, Zip Row */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City"
          className={cn(getFieldClassName(cityFieldData), "w-32")}
          disabled={disabled}
        />
        <Input
          type="text"
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          placeholder="State"
          className={cn(getFieldClassName(stateFieldData), "w-16")}
          disabled={disabled}
        />
        <Input
          type="text"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder="Zip"
          className={cn(getFieldClassName(zipCodeFieldData), "w-20")}
          disabled={disabled}
        />
      </div>

      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Suggestions Panel */}
      {suggestion && (
        <AddressSuggestionsPanel
          suggestions={{
            success: true,
            has_suggestions: true,
            suggestions: [{
              formatted_address: suggestion.formatted_address,
              address: suggestion.address,
              city: suggestion.city,
              state: suggestion.state,
              zip_code: suggestion.zip_code,
              confidence: finalValidationState === "can_be_verified" ? "high" : "medium",
              source: "google_maps",
              changes_made: [],
              enhancement_notes: "Google Maps suggestion"
            }],
            original_input: currentFields,
            validation_attempted: true
          }}
          isOpen={isSuggestionPanelOpen}
          onClose={() => setIsSuggestionPanelOpen(false)}
          onApplySuggestion={handleApplySuggestion}
        />
      )}
    </div>
  );
}