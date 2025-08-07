import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "@/lib/toast";

// Type definitions for the 4-state validation system
type ValidationState = "verified" | "can_be_verified" | "no_house_number" | "not_verified" | "loading";

interface AddressSuggestion {
  formatted_address: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface ValidationResult {
  state: ValidationState;
  is_valid: boolean;
  suggestion: AddressSuggestion | null;
  error: string | null;
  original_query: {
    address: string;
    city: string;
    state: string;
    zip_code: string;
  };
}

interface ValidationResponse {
  success: boolean;
  validation: ValidationResult;
}

interface AddressFields {
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface UseAddressValidationOptions {
  debounceMs?: number;
  minLoadingMs?: number; // Minimum loading time for good UX
}

interface UseAddressValidationReturn {
  validationState: ValidationState;
  suggestion: AddressSuggestion | null;
  error: string | null;
  validateAddress: (fields: AddressFields) => Promise<void>;
  clearValidation: () => void;
  applySuggestion: (onApply: (suggestion: AddressSuggestion) => void) => void;
}

export function useAddressValidation(
  options: UseAddressValidationOptions = {}
): UseAddressValidationReturn {
  const { debounceMs = 800, minLoadingMs = 500 } = options;

  const [validationState, setValidationState] = useState<ValidationState>("not_verified");
  const [suggestion, setSuggestion] = useState<AddressSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasValidated, setHasValidated] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>("");
  const verifiedAddressesRef = useRef<Set<string>>(new Set()); // Cache of verified addresses

  const validateAddress = useCallback(async (fields: AddressFields) => {
    // Create request hash to prevent duplicate calls
    const requestHash = JSON.stringify(fields);
    
    // Check if this exact address was already verified in this session
    if (verifiedAddressesRef.current.has(requestHash)) {
      console.log("🔄 Using cached verified address, no API call needed");
      setValidationState("verified");
      setHasValidated(true);
      lastRequestRef.current = requestHash;
      return;
    }
    
    if (requestHash === lastRequestRef.current) {
      console.log("🔄 Skipping duplicate validation request for same address");
      return;
    }

    // Basic input validation
    const hasAddress = fields.address && fields.address.trim().length > 0;
    const hasState = fields.state && fields.state.trim().length > 0;
    const hasLocationContext = (fields.city && fields.city.trim().length > 0) || 
                              (fields.zip_code && fields.zip_code.trim().length > 0);

    if (!hasAddress || !hasState || !hasLocationContext) {
      // Clear validation if insufficient data
      setValidationState("not_verified");
      setSuggestion(null);
      setError(null);
      return;
    }

    // Clear existing timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }

    // Set up debounced validation
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Start loading state
        setValidationState("loading");
        setError(null);
        
        // Minimum loading time for smooth UX
        const loadingStartTime = Date.now();
        
        console.log("🔍 Validating address:", fields);
        
        // Call the validation API
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const validationUrl = `${apiBaseUrl}/address/validate`;
        
        console.log("🔗 API Base URL:", apiBaseUrl);
        console.log("🔗 Full validation URL:", validationUrl);
        console.log("🔗 Environment variables:", import.meta.env);
        
        const response = await fetch(validationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fields),
        });

        if (!response.ok) {
          throw new Error(`Validation API error: ${response.status}`);
        }

        const data: ValidationResponse = await response.json();
        
        console.log("✅ Validation response:", data);
        
        if (data.validation?.suggestion) {
          console.log("📋 Google Maps suggestion details:", {
            suggestion: data.validation.suggestion,
            originalInput: fields,
            suggestedAddress: data.validation.suggestion.address,
            suggestedCity: data.validation.suggestion.city,
            suggestedState: data.validation.suggestion.state
          });
        }
        
        // Calculate remaining loading time
        const loadingElapsed = Date.now() - loadingStartTime;
        const remainingLoadingTime = Math.max(0, minLoadingMs - loadingElapsed);
        
        // Apply minimum loading time
        setTimeout(() => {
          if (data.success && data.validation) {
            setValidationState(data.validation.state);
            setSuggestion(data.validation.suggestion);
            setError(data.validation.error);
            setHasValidated(true);
            
            // Show success message for verified addresses
            if (data.validation.state === "verified") {
              toast.success("✅ Address verified with Google Maps");
              // Cache this verified address to prevent future API calls
              verifiedAddressesRef.current.add(requestHash);
            }
            
            lastRequestRef.current = requestHash;
          } else {
            setValidationState("not_verified");
            setSuggestion(null);
            setError("Validation failed");
            setHasValidated(true);
          }
        }, remainingLoadingTime);
        
      } catch (err) {
        console.error("❌ Address validation failed:", err);
        
        // Calculate remaining loading time for error case too
        const loadingElapsed = Date.now() - Date.now();
        const remainingLoadingTime = Math.max(0, minLoadingMs - loadingElapsed);
        
        setTimeout(() => {
          const errorMessage = err instanceof Error ? err.message : "Failed to validate address";
          setError(errorMessage);
          setValidationState("not_verified");
          setSuggestion(null);
          setHasValidated(true);
          
          // Only show error toast for non-network errors
          if (!errorMessage.toLowerCase().includes("network") && 
              !errorMessage.toLowerCase().includes("fetch")) {
            toast.error(`Address validation failed: ${errorMessage}`);
          }
        }, remainingLoadingTime);
      }
    }, debounceMs);
  }, [debounceMs, minLoadingMs]);

  const clearValidation = useCallback(() => {
    setValidationState("not_verified");
    setSuggestion(null);
    setError(null);
    setHasValidated(false);
    lastRequestRef.current = "";
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  const applySuggestion = useCallback((onApply: (suggestion: AddressSuggestion) => void) => {
    if (suggestion) {
      onApply(suggestion);
      setValidationState("verified");
      toast.success("✅ Address verified with Google Maps");
      
      // Cache this verified address
      const appliedFields = {
        address: suggestion.address,
        city: suggestion.city,
        state: suggestion.state,
        zip_code: suggestion.zip_code
      };
      const appliedHash = JSON.stringify(appliedFields);
      verifiedAddressesRef.current.add(appliedHash);
    }
  }, [suggestion]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  return {
    validationState,
    suggestion,
    error,
    validateAddress,
    clearValidation,
    applySuggestion,
  };
}

// Helper function to detect pipeline verification
export function isPipelineVerified(fieldData?: { source?: string }): boolean {
  const result = fieldData?.source === "google_maps_verified";
  console.log("🔍 isPipelineVerified check:", {
    fieldData,
    source: fieldData?.source,
    result
  });
  return result;
}

// Helper function to check if current values match original pipeline values
export function valuesMatchPipeline(
  currentFields: AddressFields,
  pipelineFields: {
    address?: { value?: string };
    city?: { value?: string };
    state?: { value?: string };
    zip_code?: { value?: string };
  }
): boolean {
  const result = (
    currentFields.address === (pipelineFields.address?.value || "") &&
    currentFields.city === (pipelineFields.city?.value || "") &&
    currentFields.state === (pipelineFields.state?.value || "") &&
    currentFields.zip_code === (pipelineFields.zip_code?.value || "")
  );
  
  console.log("🔄 valuesMatchPipeline check:", {
    currentFields,
    pipelineValues: {
      address: pipelineFields.address?.value || "",
      city: pipelineFields.city?.value || "",
      state: pipelineFields.state?.value || "",
      zip_code: pipelineFields.zip_code?.value || ""
    },
    result
  });
  
  return result;
}