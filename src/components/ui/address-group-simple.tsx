import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressSuggestionsPanel } from "@/components/ui/address-suggestions-panel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  MapPin
} from "lucide-react";

// Simple validation states
type ValidationState = "verified" | "can_be_verified" | "no_house_number" | "not_verified" | "loading";

interface AddressGroupSimpleProps {
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
  
  // Field metadata - now includes validation_state
  addressFieldData?: { 
    value?: string; 
    source?: string; 
    validation_state?: ValidationState;
    validation_suggestion?: any;
    reviewed?: boolean;
  };
  cityFieldData?: { value?: string; source?: string; reviewed?: boolean };
  stateFieldData?: { value?: string; source?: string; reviewed?: boolean };
  zipCodeFieldData?: { value?: string; source?: string; reviewed?: boolean };
  
  // Card status
  reviewStatus?: string;
  
  // Styling
  className?: string;
  disabled?: boolean;
}

export function AddressGroupSimple({
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
  reviewStatus,
  className = "",
  disabled = false,
}: AddressGroupSimpleProps) {
  // Check if card is in "Ready for Export" status
  // Cards that are "reviewed" are ready for export
  const isReadyForExport = reviewStatus === "ready_for_export" || reviewStatus === "reviewed";
  
  // If ready for export, address is verified by definition
  const initialState: ValidationState = isReadyForExport ? "verified" : "not_verified";
  
  const [currentValidationState, setCurrentValidationState] = useState<ValidationState>(initialState);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [isSuggestionPanelOpen, setIsSuggestionPanelOpen] = useState(false);
  const lastValidatedValues = useRef<string>("");
  const debounceTimeout = useRef<NodeJS.Timeout>();

  // Get initial state from pipeline data
  const pipelineValidationState = addressFieldData?.validation_state;
  const pipelineSuggestion = addressFieldData?.validation_suggestion;
  
  console.log("🏗️ AddressGroupSimple:", {
    reviewStatus,
    isReadyForExport,
    pipelineValidationState,
    currentValidationState,
    address,
    city,
    state,
    zipCode
  });

  // Simple approach: validate whenever values change from what we last validated
  const currentValues = JSON.stringify({ address, city, state, zipCode });

  // Helper function to check if we have enough info to make a useful API call
  const hasUsefulAddressInfo = () => {
    const addr = address?.trim();
    const c = city?.trim();
    const s = state?.trim();
    const z = zipCode?.trim();
    
    // Scenario 1: Street address + ZIP (can find city/state)
    if (addr && z) return true;
    
    // Scenario 2: Street address + City + State (can find ZIP)
    if (addr && c && s) return true;
    
    // Scenario 3: All fields present
    if (addr && c && s && z) return true;
    
    // Could also validate with just ZIP to fill in city/state
    // or just city/state to suggest common areas, but let's start conservative
    
    return false;
  };

  // Debounced validation when values change
  useEffect(() => {
    console.log("🚀 Validation useEffect running:", {
      isReadyForExport,
      lastValidatedValuesBefore: lastValidatedValues.current,
      currentValues,
      reviewStatus
    });
    
    // Special handling for ready for export on first render
    if (isReadyForExport && !lastValidatedValues.current) {
      console.log("📋 Ready for Export - setting as verified without API call");
      lastValidatedValues.current = currentValues;
      setCurrentValidationState("verified");
      return; // Skip validation entirely
    }
    
    const hasUsefulInfo = hasUsefulAddressInfo();
    const valuesChanged = currentValues !== lastValidatedValues.current;
    
    console.log("🔍 Validation trigger check:", {
      isReadyForExport,
      currentValues,
      lastValidatedValues: lastValidatedValues.current,
      valuesChanged,
      hasUsefulInfo,
      scenarios: {
        addressAndZip: !!(address?.trim() && zipCode?.trim()),
        addressCityState: !!(address?.trim() && city?.trim() && state?.trim()),
        allFields: !!(address?.trim() && city?.trim() && state?.trim() && zipCode?.trim())
      },
      willValidate: valuesChanged && hasUsefulInfo
    });
    
    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    if (valuesChanged) {
      if (hasUsefulInfo) {
        // Debounce validation by 800ms
        debounceTimeout.current = setTimeout(() => {
          console.log("✅ Debounced validation triggered - have useful address info!");
          console.log("Stack trace:", new Error().stack);
          validateUserInput();
          lastValidatedValues.current = currentValues;
        }, 800);
      } else {
        console.log("📝 Not enough address info for validation yet");
        setCurrentValidationState("not_verified");
        setSuggestion(null);
        lastValidatedValues.current = currentValues;
      }
    }
  }, [currentValues, isReadyForExport]);

  const validateUserInput = async () => {
    try {
      setCurrentValidationState("loading");
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBaseUrl}/address/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          city,
          state,
          zip_code: zipCode
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("✅ User input validation result:", {
        success: data.success,
        validationState: data.validation?.state,
        hasValidation: !!data.validation,
        suggestion: data.validation?.suggestion,
        error: data.validation?.error
      });
      
      if (data.success && data.validation) {
        console.log(`🎯 Setting validation state to: ${data.validation.state}`);
        setCurrentValidationState(data.validation.state);
        setSuggestion(data.validation.suggestion);
        
        if (data.validation.state === "verified") {
          toast.success("✅ Address verified with Google Maps");
        }
      } else {
        console.log("❌ Validation failed, setting to not_verified");
        setCurrentValidationState("not_verified");
        setSuggestion(null);
      }
      
    } catch (error) {
      console.error("❌ Validation error:", error);
      setCurrentValidationState("not_verified");
      setSuggestion(null);
    }
  };

  const handleApplySuggestion = (sug: any) => {
    // Apply suggestion to form fields
    onAddressChange(sug.address || "");
    onCityChange(sug.city || "");
    onStateChange(sug.state || "");
    onZipCodeChange(sug.zip_code || "");
    
    // Pre-set lastValidatedValues to prevent re-validation of the applied suggestion
    const newValues = JSON.stringify({
      address: sug.address || "",
      city: sug.city || "",
      state: sug.state || "",
      zipCode: sug.zip_code || ""
    });
    lastValidatedValues.current = newValues;
    
    // Mark as verified
    setCurrentValidationState("verified");
    setSuggestion(sug);
    setIsSuggestionPanelOpen(false);
    
    toast.success("✅ Address verified with Google Maps");
  };

  const renderValidationStatus = () => {
    switch (currentValidationState) {
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
              onClick={() => setIsSuggestionPanelOpen(true)}
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
              Address not found - {' '}
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
        className="w-full max-w-sm h-10 sm:h-8 text-sm"
        disabled={disabled}
      />
      
      {/* City, State, Zip Row */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City"
          className="w-32 h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
        <Input
          type="text"
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          placeholder="State"
          className="w-16 h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
        <Input
          type="text"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder="Zip"
          className="w-20 h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
      </div>

      {/* Validation Status */}
      {renderValidationStatus()}

      {/* Suggestions Panel */}
      {suggestion && isSuggestionPanelOpen && (
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
              confidence: "high",
              source: "google_maps",
              changes_made: [],
              enhancement_notes: "Google Maps suggestion"
            }],
            original_input: { address, city, state, zip_code: zipCode },
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