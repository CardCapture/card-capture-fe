import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAddressSuggestions } from "@/hooks/useAddressSuggestions";
import { type AddressSuggestion, type AddressSuggestionsRequest } from "@/api/backend/addressSuggestions";
import { CheckCircle, MapPin, Loader2, AlertTriangle, Check, X } from "lucide-react";
import { toast } from "@/lib/toast";

interface AddressFieldWithSuggestionsProps {
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

export function AddressFieldWithSuggestions({
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
}: AddressFieldWithSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<AddressSuggestion | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { suggestions, isLoading, validateAddress, clearSuggestions, hasValidationOccurred } = useAddressSuggestions({
    debounceMs: 800,
    minChangeThreshold: 2,
  });

  // Simplified approach: Check if address was verified by Google Maps during pipeline processing
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
  
  // SIMPLIFIED VERIFICATION LOGIC:
  // Show verified ONLY if:
  // 1. Address was verified during processing AND user hasn't changed it, OR  
  // 2. Address was verified in current session AND suggestion matches exactly what user typed
  let isGoogleVerified = false;
  
  if (wasVerifiedDuringProcessing && valuesMatchOriginal) {
    // Pipeline verified and unchanged
    isGoogleVerified = true;
  } else if (isCurrentlyVerified && appliedSuggestion) {
    // Verified in this session - only show verified if suggestion exactly matches user input
    const suggestionMatchesInput = 
      appliedSuggestion.address === (address || "") &&
      appliedSuggestion.city === (city || "") &&
      appliedSuggestion.state === (state || "") &&
      appliedSuggestion.zip_code === (zipCode || "");
    
    isGoogleVerified = suggestionMatchesInput;
  }

  // Trigger validation when address fields change
  useEffect(() => {
    // If the user has edited fields away from original verified values, clear applied suggestion
    // This ensures the verification badge disappears immediately when they start editing
    if (originalValues && !valuesMatchOriginal && appliedSuggestion) {
      setAppliedSuggestion(null);
    }
    
    const request: AddressSuggestionsRequest = {
      address: address || "",
      city: city || "",
      state: state || "",
      zip_code: zipCode || "",
    };
    
    validateAddress(request);
  }, [address, city, state, zipCode, validateAddress, originalValues, valuesMatchOriginal, appliedSuggestion]);

  // Show suggestions when we get results
  useEffect(() => {
    if (suggestions?.has_suggestions && suggestions.suggestions.length > 0) {
      setShowSuggestions(true);
    } else if (hasValidationOccurred && suggestions && !suggestions.has_suggestions) {
      setShowSuggestions(false);
    }
  }, [suggestions, hasValidationOccurred]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleApplySuggestion = (suggestion: AddressSuggestion) => {
    // Apply all the suggested values
    onAddressChange(suggestion.address);
    onCityChange(suggestion.city);
    onStateChange(suggestion.state);
    onZipCodeChange(suggestion.zip_code);
    
    // Track that this suggestion was applied
    setAppliedSuggestion(suggestion);
    setShowSuggestions(false);
    clearSuggestions();
    
    toast.success(
      suggestion.confidence === "high" 
        ? "✅ Address verified with Google Maps" 
        : `Address updated: ${suggestion.enhancement_notes}`
    );
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
    clearSuggestions();
  };

  // Helper to get field styling based on review status
  const getFieldClassName = (fieldData?: { requires_human_review?: boolean; reviewed?: boolean }, isQrScan?: boolean) => {
    const baseClasses = "h-10 sm:h-8 text-sm flex-1";

    // For QR scans, don't show the green success state
    if (fieldData?.reviewed && !isQrScan) {
      return `${baseClasses} border-green-300 focus-visible:ring-green-400 bg-green-50`;
    } else if (fieldData?.requires_human_review) {
      return `${baseClasses} border-red-300 focus-visible:ring-red-400`;
    }

    return baseClasses;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Address Fields Grid */}
      <div className="space-y-3">
        {/* Address Field */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street Address"
            className={getFieldClassName(addressFieldData)}
            disabled={disabled}
          />
          {isGoogleVerified && (
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
              <CheckCircle className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {isLoading && (
            <div className="flex items-center text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
        
        {/* City, State, Zip Row */}
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="text"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="City"
            className={getFieldClassName(cityFieldData)}
            disabled={disabled}
          />
          <Input
            type="text"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            placeholder="State"
            className={getFieldClassName(stateFieldData)}
            disabled={disabled}
          />
          <Input
            type="text"
            value={zipCode}
            onChange={(e) => onZipCodeChange(e.target.value)}
            placeholder="Zip Code"
            className={getFieldClassName(zipCodeFieldData)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Suggestions Panel */}
      {showSuggestions && suggestions?.has_suggestions && (
        <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="shadow-lg border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">Address Suggestions</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissSuggestions}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                {suggestions.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {suggestion.formatted_address}
                        </p>
                        <Badge 
                          variant={suggestion.confidence === "high" ? "default" : "secondary"}
                          className={`text-xs px-2 py-0.5 ${
                            suggestion.confidence === "high" 
                              ? "bg-green-100 text-green-800 border-green-200" 
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }`}
                        >
                          {suggestion.confidence === "high" ? "High Confidence" : "Medium Confidence"}
                        </Badge>
                      </div>
                      {suggestion.enhancement_notes && (
                        <p className="text-xs text-gray-600">{suggestion.enhancement_notes}</p>
                      )}
                      {suggestion.changes_made.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          Changes: {suggestion.changes_made.join(", ")}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleApplySuggestion(suggestion)}
                      className="shrink-0 h-8 px-3 bg-blue-600 hover:bg-blue-700"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Suggestions Message */}
      {hasValidationOccurred && suggestions && !suggestions.has_suggestions && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="shadow-lg border-orange-200">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-orange-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">No address suggestions found - please verify manually</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}