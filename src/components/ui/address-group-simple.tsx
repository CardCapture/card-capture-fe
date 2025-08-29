import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressSuggestionsPanel } from "@/components/ui/address-suggestions-panel";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Loader2, 
  AlertTriangle, 
  MapPin
} from "lucide-react";
import { 
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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
    requires_human_review?: boolean;
  };
  cityFieldData?: { value?: string; source?: string; reviewed?: boolean };
  stateFieldData?: { value?: string; source?: string; reviewed?: boolean };
  zipCodeFieldData?: { value?: string; source?: string; reviewed?: boolean };
  
  // Card status
  reviewStatus?: string;
  
  // Review handler
  onFieldReview?: (fieldKey: string) => void;
  
  // Styling
  className?: string;
  
  // Disable validation when modal is closing
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
  onFieldReview,
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
  
  // Debug logging removed for performance

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
    // Clear any existing timeout when disabled changes
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Skip validation if component is disabled (e.g., modal is closing)
    if (disabled) {
      console.log("🛑 Validation skipped - component is disabled");
      return;
    }
    
    // Additional safety check: skip if no meaningful address data
    if (!address && !city && !state && !zipCode) {
      console.log("🛑 Validation skipped - no address data");
      return;
    }
    
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
          validateUserInput(currentValues);
        }, 800);
      } else {
        console.log("📝 Not enough address info for validation yet");
        setCurrentValidationState("not_verified");
        setSuggestion(null);
        lastValidatedValues.current = currentValues;
      }
    }
  }, [currentValues, isReadyForExport, disabled]);

  const validateUserInput = async (validatedValues: string) => {
    // Skip validation if component is disabled
    if (disabled) {
      console.log("🛑 Validation aborted - component is disabled");
      return;
    }
    
    try {
      setCurrentValidationState("loading");
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const requestBody = {
        address,
        city,
        state,
        zip_code: zipCode
      };
      
      console.log("🚀 Sending validation request:", requestBody);
      
      const response = await fetch(`${apiBaseUrl}/address/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("✅ Full validation response:", data);
      console.log("✅ User input validation result:", {
        success: data.success,
        validationState: data.validation?.state,
        hasValidation: !!data.validation,
        suggestion: data.validation?.suggestion,
        error: data.validation?.error,
        originalQuery: data.validation?.original_query
      });
      
      if (data.success && data.validation) {
        console.log(`🎯 Setting validation state to: ${data.validation.state}`);
        
        // Check if Google Maps provided additional fields that user didn't have
        // If so, we should show it as "can_be_verified" so they can review and apply
        let finalState = data.validation.state;
        
        if (data.validation.state === "verified" && data.validation.suggestion) {
          const suggestion = data.validation.suggestion;
          const currentCity = city?.trim();
          const currentState = state?.trim();
          
          // If user is missing city or state but Google found them, show as "can_be_verified"
          const googleHasCity = suggestion.city && suggestion.city.trim();
          const googleHasState = suggestion.state && suggestion.state.trim();
          
          const needsCityFill = !currentCity && googleHasCity;
          const needsStateFill = !currentState && googleHasState;
          
          if (needsCityFill || needsStateFill) {
            finalState = "can_be_verified";
            console.log("📍 Google provided missing fields, showing as can_be_verified:", {
              needsCityFill,
              needsStateFill,
              currentCity,
              currentState,
              suggestedCity: suggestion.city,
              suggestedState: suggestion.state
            });
          }
        }
        
        setCurrentValidationState(finalState);
        setSuggestion(data.validation.suggestion);
        
        // Update lastValidatedValues after successful validation
        lastValidatedValues.current = validatedValues;
        
        if (finalState === "verified") {
          toast.success("✅ Address verified with Google Maps");
        } else if (finalState === "can_be_verified" && data.validation.suggestion) {
          console.log("📍 Address has suggestions, showing validation button");
        }
      } else {
        console.log("❌ Validation failed, setting to not_verified");
        setCurrentValidationState("not_verified");
        setSuggestion(null);
        // Still update lastValidatedValues even on failure
        lastValidatedValues.current = validatedValues;
      }
      
    } catch (error) {
      console.error("❌ Validation error:", error);
      setCurrentValidationState("not_verified");
      setSuggestion(null);
      // Update lastValidatedValues even on error
      lastValidatedValues.current = validatedValues;
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

  // Check if address field needs review and show checkbox
  const addressNeedsReview = addressFieldData?.requires_human_review;
  const addressIsReviewed = addressFieldData?.reviewed;
  const validationFailed = currentValidationState === 'not_verified' || currentValidationState === 'no_house_number';
  const showReviewCheckbox = (addressNeedsReview || validationFailed) && onFieldReview;

  const handleAddressAutocomplete = (addressData: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    // Auto-fill all address fields
    onAddressChange(addressData.street);
    onCityChange(addressData.city);
    onStateChange(addressData.state);
    onZipCodeChange(addressData.zipCode);
    
    // Set as verified since it comes from Google Maps
    setCurrentValidationState("verified");
    setSuggestion(null);
    lastValidatedValues.current = JSON.stringify({
      address: addressData.street,
      city: addressData.city,
      state: addressData.state,
      zipCode: addressData.zipCode
    });
    
    toast.success("✅ Address verified with Google Maps");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Street Address with Google Maps Autocomplete */}
      <div className="w-full max-w-sm">
        {!disabled ? (
          <AddressAutocomplete
            label=""
            value={address}
            onChange={(value) => {
              onAddressChange(value);
              // Clear verified status when user manually types
              if (currentValidationState === "verified") {
                setCurrentValidationState("not_verified");
              }
            }}
            onAddressSelect={handleAddressAutocomplete}
            className="h-10 sm:h-8 text-sm"
            locationContext={{
              zipCode: zipCode,
              city: city,
              state: state
            }}
          />
        ) : (
          <Input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street Address"
            className="w-full h-10 sm:h-8 text-sm"
            disabled={disabled}
          />
        )}
      </div>
      
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

      {/* Validation Status and Review Checkbox Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {renderValidationStatus()}
        </div>
        
        {/* Mark as Reviewed Checkbox - Only show if address needs review */}
        {showReviewCheckbox && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 p-1 ml-2 ${
                    addressIsReviewed
                      ? "text-green-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => onFieldReview?.('address')}
                  disabled={disabled}
                >
                  <CheckCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>
                  {addressIsReviewed
                    ? "Mark as needing review"
                    : "Mark as reviewed"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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