import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAddressSuggestions } from "@/hooks/useAddressSuggestions";
import { AddressSuggestionsPanel } from "@/components/ui/address-suggestions-panel";
import { type AddressSuggestion } from "@/api/backend/addressSuggestions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  MapPin, 
  Lightbulb,
  Circle
} from "lucide-react";

interface AddressGroupWithStatusProps {
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
  
  // Field metadata
  addressFieldData?: { requires_human_review?: boolean; reviewed?: boolean };
  cityFieldData?: { requires_human_review?: boolean; reviewed?: boolean };
  stateFieldData?: { requires_human_review?: boolean; reviewed?: boolean };
  zipCodeFieldData?: { requires_human_review?: boolean; reviewed?: boolean };
  
  // Styling
  className?: string;
  disabled?: boolean;
}

export function AddressGroupWithStatus({
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
}: AddressGroupWithStatusProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<AddressSuggestion | null>(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  const { suggestions, isLoading, validateAddress, clearSuggestions, hasValidationOccurred } = useAddressSuggestions({
    debounceMs: 800,
    minChangeThreshold: 2,
  });

  // Simplified approach: Check if address was verified by Google Maps during pipeline processing
  // Look for explicit verification indicators rather than trying to track sources
  const wasVerifiedDuringProcessing = (
    addressFieldData && 
    !addressFieldData.requires_human_review &&
    (
      // Direct indicators of Google Maps verification
      (addressFieldData.review_notes && addressFieldData.review_notes.toLowerCase().includes('confirmed valid')) ||
      (addressFieldData.source === "smart_validation") ||
      (addressFieldData.source === "address_validation") ||
      (addressFieldData.source === "google_maps")
    )
  );
  
  const isCurrentlyVerified = appliedSuggestion?.source === "google_maps" && appliedSuggestion?.confidence === "high";
  
  // Track if the current values match the original verified values (only for originally verified addresses)
  const originalValues = React.useMemo(() => {
    if (wasVerifiedDuringProcessing) {
      return {
        address: addressFieldData?.value || "",
        city: cityFieldData?.value || "",
        state: stateFieldData?.value || "", 
        zipCode: zipCodeFieldData?.value || ""
      };
    }
    return null;
  }, [wasVerifiedDuringProcessing, addressFieldData?.value, cityFieldData?.value, stateFieldData?.value, zipCodeFieldData?.value]);
  
  const currentValues = React.useMemo(() => ({
    address: address || "",
    city: city || "",
    state: state || "",
    zipCode: zipCode || ""
  }), [address, city, state, zipCode]);
  
  // Check if current values match original verified values
  const valuesMatchOriginal = originalValues && 
    originalValues.address === currentValues.address &&
    originalValues.city === currentValues.city &&
    originalValues.state === currentValues.state &&
    originalValues.zipCode === currentValues.zipCode;
  
  // Check if validation failed (validation occurred but API returned failure or no suggestions)
  const validationFailed = hasValidationOccurred && suggestions && (
    !suggestions.success || !suggestions.has_suggestions || suggestions.suggestions.length === 0
  );
  
  // SIMPLIFIED VERIFICATION LOGIC:
  // Show verified ONLY if:
  // 1. Address was verified during processing AND user hasn't changed it, OR  
  // 2. Address was verified in current session AND suggestion matches exactly what user typed
  let isGoogleVerified = false;
  
  console.log("🔍 Address Verification Debug:", {
    wasVerifiedDuringProcessing,
    valuesMatchOriginal,
    validationFailed,
    hasValidationOccurred,
    suggestionsCount: suggestions?.suggestions?.length || 0,
    originalValues: originalValues ? {
      address: originalValues.address,
      city: originalValues.city,
      state: originalValues.state,
      zipCode: originalValues.zipCode
    } : null,
    currentValues: {
      address: currentValues.address,
      city: currentValues.city,
      state: currentValues.state,
      zipCode: currentValues.zipCode
    },
    inputProps: {
      address: address,
      city: city,
      state: state,
      zipCode: zipCode
    },
    addressFieldData: {
      value: addressFieldData?.value,
      source: addressFieldData?.source,
      requires_human_review: addressFieldData?.requires_human_review
    }
  });
  
  if (wasVerifiedDuringProcessing && valuesMatchOriginal && !validationFailed) {
    // Pipeline verified and unchanged AND current validation successful (or not yet attempted)
    isGoogleVerified = true;
    console.log("✅ Showing verified: Pipeline verified and unchanged");
  } else if (validationFailed) {
    isGoogleVerified = false;
    console.log("❌ NOT showing verified: Validation failed");
  } else if (isCurrentlyVerified && appliedSuggestion) {
    // Verified in this session - only show verified if suggestion exactly matches user input
    const suggestionMatchesInput = 
      appliedSuggestion.address === (address || "") &&
      appliedSuggestion.city === (city || "") &&
      appliedSuggestion.state === (state || "") &&
      appliedSuggestion.zip_code === (zipCode || "");
    
    isGoogleVerified = suggestionMatchesInput;
    console.log(`${suggestionMatchesInput ? "✅" : "❌"} Showing verified: Current session, matches input: ${suggestionMatchesInput}`);
  } else {
    console.log("❌ NOT showing verified");
  }
  
  // If user edited a previously verified address, clear the applied suggestion
  // This forces re-evaluation of the new address

  // Trigger validation when address fields change
  React.useEffect(() => {
    const hasAddressData = address || city || state || zipCode;
    
    // If the user has edited fields away from original verified values, clear applied suggestion
    // This ensures the verification badge disappears immediately when they start editing
    if (originalValues && !valuesMatchOriginal && appliedSuggestion) {
      setAppliedSuggestion(null);
    }
    
    if (hasAddressData && userHasInteracted) {
      console.log("🔍 Triggering address validation due to user interaction (address-group-with-status)");
      const request = {
        address: address || "",
        city: city || "",
        state: state || "",
        zip_code: zipCode || "",
      };
      validateAddress(request);
    } else if (hasAddressData && !userHasInteracted) {
      console.log("🔍 Skipping validation - user has not interacted with address fields yet (address-group-with-status)");
    }
  }, [address, city, state, zipCode, validateAddress, originalValues, valuesMatchOriginal, appliedSuggestion, userHasInteracted]);

  // Handle applying a suggestion
  const handleApplySuggestion = (suggestion: AddressSuggestion) => {
    onAddressChange(suggestion.address);
    onCityChange(suggestion.city);
    onStateChange(suggestion.state);
    onZipCodeChange(suggestion.zip_code);
    
    setAppliedSuggestion(suggestion);
    setIsPanelOpen(false);
    clearSuggestions();
    
    toast.success(
      suggestion.confidence === "high" 
        ? "✅ Address verified with Google Maps" 
        : `Address updated: ${suggestion.enhancement_notes}`
    );
  };

  // Helper to get field styling based on review status
  const getFieldClassName = (fieldData?: { requires_human_review?: boolean; reviewed?: boolean }) => {
    const baseClasses = "h-10 sm:h-8 text-sm";
    
    if (fieldData?.reviewed) {
      return `${baseClasses} border-green-300 focus-visible:ring-green-400 bg-green-50`;
    } else if (fieldData?.requires_human_review) {
      return `${baseClasses} border-red-300 focus-visible:ring-red-400`;
    }
    
    return baseClasses;
  };
  
  // Check if address actually needs human review
  const addressNeedsReview = addressFieldData?.requires_human_review || 
                            cityFieldData?.requires_human_review || 
                            stateFieldData?.requires_human_review || 
                            zipCodeFieldData?.requires_human_review;

  // Determine address validation status
  const getAddressStatus = () => {
    
    if (isLoading) {
      return {
        type: 'validating',
        icon: <Loader2 className="w-4 h-4 animate-spin text-blue-600" />,
        text: 'Validating address...',
        textColor: 'text-blue-600',
        bgColor: 'bg-blue-50',
        action: null
      };
    }
    
    // For verified addresses, we'll show a badge instead of a status message
    if (isGoogleVerified) {
      return null; // No status message for verified addresses - badge will be shown separately
    }
    
    // Show suggestions if we have them and validation occurred
    if (hasValidationOccurred && suggestions?.has_suggestions && suggestions.suggestions.length > 0) {
      // For high confidence suggestions, show "verify address" instead of "address can be improved"
      const hasHighConfidenceSuggestion = suggestions.suggestions.some(s => s.confidence === 'high');
      
      return {
        type: 'has_suggestions',
        icon: <Lightbulb className="w-4 h-4 text-yellow-600" />,
        text: hasHighConfidenceSuggestion ? 'Address can be verified' : 'Address can be improved',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        action: {
          text: hasHighConfidenceSuggestion ? 'Verify address' : 'View suggestions',
          onClick: () => setIsPanelOpen(true)
        }
      };
    }
    
    // Show error if validation occurred but address couldn't be verified
    if (hasValidationOccurred && !isGoogleVerified) {
      // Case 1: No suggestions found at all
      if (suggestions && !suggestions.has_suggestions) {
        return {
          type: 'cannot_validate',
          icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
          text: suggestions.error || 'Could not validate address',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          action: !suggestions.error?.includes('add a house number') ? {
            text: 'Edit address to retry',
            onClick: () => {
              const addressInput = document.querySelector('input[placeholder="Street Address"]') as HTMLInputElement;
              if (addressInput) {
                addressInput.focus();
                addressInput.select();
              }
            }
          } : null
        };
      }
      
      // Case 2: Suggestions found but don't match user input (invalid address)
      if (suggestions?.has_suggestions && isCurrentlyVerified && appliedSuggestion) {
        const suggestionMatchesInput = 
          appliedSuggestion.address === (address || "") &&
          appliedSuggestion.city === (city || "") &&
          appliedSuggestion.state === (state || "") &&
          appliedSuggestion.zip_code === (zipCode || "");
          
        if (!suggestionMatchesInput) {
          return {
            type: 'invalid_address',
            icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
            text: 'Address appears to be invalid',
            textColor: 'text-orange-700',
            bgColor: 'bg-orange-50',
            action: {
              text: 'Edit address to retry',
              onClick: () => {
                const addressInput = document.querySelector('input[placeholder="Street Address"]') as HTMLInputElement;
                if (addressInput) {
                  addressInput.focus();
                  addressInput.select();
                }
              }
            }
          };
        }
      }
    }
    
    // Has address data but not validated yet
    if (address || city || state || zipCode) {
      return {
        type: 'not_validated',
        icon: <Circle className="w-4 h-4 text-gray-400" />,
        text: 'Address not validated',
        textColor: 'text-gray-600',
        bgColor: 'bg-gray-50',
        action: {
          text: 'Validate',
          onClick: () => {
            // Trigger validation manually
            const request = {
              address: address || "",
              city: city || "",
              state: state || "",
              zip_code: zipCode || "",
            };
            validateAddress(request);
          }
        }
      };
    }
    
    return null;
  };

  const status = getAddressStatus();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Clean Address Input */}
      <Input
        type="text"
        value={address}
        onChange={(e) => {
          setUserHasInteracted(true);
          onAddressChange(e.target.value);
        }}
        placeholder="Street Address"
        className={cn(getFieldClassName(addressFieldData), "w-full max-w-sm")}
        disabled={disabled}
      />
      
      {/* City, State, Zip Row */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={city}
          onChange={(e) => {
            setUserHasInteracted(true);
            onCityChange(e.target.value);
          }}
          placeholder="City"
          className={cn(getFieldClassName(cityFieldData), "w-32")}
          disabled={disabled}
        />
        <Input
          type="text"
          value={state}
          onChange={(e) => {
            setUserHasInteracted(true);
            onStateChange(e.target.value);
          }}
          placeholder="State"
          className={cn(getFieldClassName(stateFieldData), "w-16")}
          disabled={disabled}
        />
        <Input
          type="text"
          value={zipCode}
          onChange={(e) => {
            setUserHasInteracted(true);
            onZipCodeChange(e.target.value);
          }}
          placeholder="Zip"
          className={cn(getFieldClassName(zipCodeFieldData), "w-20")}
          disabled={disabled}
        />
      </div>

      {/* Clean Status Messages - Like Standard Form Validation */}
      {status?.type === 'validating' && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Validating address...</span>
        </div>
      )}
      
      {isGoogleVerified && (
        <div className="flex items-center gap-2 text-sm text-green-600 w-fit">
          <CheckCircle className="w-3 h-3" />
          <span>Address verified by Google Maps</span>
        </div>
      )}
      
      {status?.type === 'has_suggestions' && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Lightbulb className="w-3 h-3" />
          <button 
            onClick={() => setIsPanelOpen(true)}
            className="text-amber-700 underline hover:no-underline font-medium"
          >
            Click here to validate address
          </button>
        </div>
      )}
      
      {status?.type === 'cannot_validate' && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          {status.text.includes('add a house number') ? (
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
          ) : (
            <>
              <span>{status.text}</span>
              {status.action && (
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
                  {status.action.text}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Suggestions Panel */}
      <AddressSuggestionsPanel
        suggestions={suggestions}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onApplySuggestion={handleApplySuggestion}
      />
    </div>
  );
}