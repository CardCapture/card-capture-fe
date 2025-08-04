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
  
  const { suggestions, isLoading, validateAddress, clearSuggestions, hasValidationOccurred } = useAddressSuggestions({
    debounceMs: 800,
    minChangeThreshold: 2,
  });

  // Trigger validation when address fields change
  React.useEffect(() => {
    const hasAddressData = address || city || state || zipCode;
    
    if (hasAddressData) {
      const request = {
        address: address || "",
        city: city || "",
        state: state || "",
        zip_code: zipCode || "",
      };
      validateAddress(request);
    }
  }, [address, city, state, zipCode, validateAddress]);

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

  // Check if address is Google verified
  const isGoogleVerified = appliedSuggestion?.source === "google_maps" && appliedSuggestion?.confidence === "high";
  
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
    
    // Only show suggestions if the address actually requires human review
    if (hasValidationOccurred && suggestions?.has_suggestions && suggestions.suggestions.length > 0 && addressNeedsReview) {
      return {
        type: 'has_suggestions',
        icon: <Lightbulb className="w-4 h-4 text-yellow-600" />,
        text: 'Address can be improved',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        action: {
          text: 'View suggestions',
          onClick: () => setIsPanelOpen(true)
        }
      };
    }
    
    // Only show cannot validate if the address needs review
    if (hasValidationOccurred && suggestions && !suggestions.has_suggestions && addressNeedsReview) {
      return {
        type: 'cannot_validate',
        icon: <AlertTriangle className="w-4 h-4 text-orange-600" />,
        text: suggestions.error || 'Could not validate address',
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        // Only show action for generic errors, not for specific house number error
        action: !suggestions.error?.includes('add a house number') ? {
          text: 'Edit address to retry',
          onClick: () => {
            // Focus the first address field to encourage editing
            const addressInput = document.querySelector('input[placeholder="Street Address"]') as HTMLInputElement;
            if (addressInput) {
              addressInput.focus();
              addressInput.select();
            }
          }
        } : null
      };
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

      {/* Clean Status Messages - Like Standard Form Validation */}
      {status?.type === 'validating' && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Validating address...</span>
        </div>
      )}
      
      {(isGoogleVerified || (!addressNeedsReview && hasValidationOccurred)) && (
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