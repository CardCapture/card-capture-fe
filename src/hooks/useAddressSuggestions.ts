import { useState, useEffect, useCallback, useRef } from "react";
import { addressSuggestionsApi, type AddressSuggestionsRequest, type AddressSuggestionsResponse } from "@/api/backend/addressSuggestions";
import { toast } from "@/lib/toast";

interface UseAddressSuggestionsOptions {
  debounceMs?: number;
  minChangeThreshold?: number;
  autoTriggerFields?: string[];
}

interface UseAddressSuggestionsReturn {
  suggestions: AddressSuggestionsResponse | null;
  isLoading: boolean;
  error: string | null;
  validateAddress: (request: AddressSuggestionsRequest) => Promise<void>;
  clearSuggestions: () => void;
  hasValidationOccurred: boolean;
}

export function useAddressSuggestions(options: UseAddressSuggestionsOptions = {}): UseAddressSuggestionsReturn {
  const {
    debounceMs = 800,
    minChangeThreshold = 2,
    autoTriggerFields = ['address', 'city', 'state', 'zip_code']
  } = options;

  const [suggestions, setSuggestions] = useState<AddressSuggestionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasValidationOccurred, setHasValidationOccurred] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>("");

  const validateAddress = useCallback(async (request: AddressSuggestionsRequest) => {
    // Create a hash of the request to avoid duplicate calls
    const requestHash = JSON.stringify(request);
    
    // Skip if identical to last request
    if (requestHash === lastRequestRef.current) {
      return;
    }

    // Check if we have enough information to validate
    const hasAddress = request.address && request.address.trim().length >= minChangeThreshold;
    const hasLocation = (request.city && request.city.trim().length > 0) || 
                       (request.zip_code && request.zip_code.trim().length > 0);
    const hasState = request.state && request.state.trim().length > 0;

    if (!hasAddress || !hasLocation || !hasState) {
      // Clear suggestions if we don't have enough info
      setSuggestions(null);
      setError(null);
      return;
    }

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set up new debounced validation
    debounceTimerRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log("🔍 Validating address:", request);
        
        const response = await addressSuggestionsApi.getAddressSuggestions(request);
        
        console.log("✅ Address validation response:", response);
        
        setSuggestions(response);
        setHasValidationOccurred(true);
        lastRequestRef.current = requestHash;
        
        // Show success toast if suggestions found
        if (response.has_suggestions && response.suggestions.length > 0) {
          const firstSuggestion = response.suggestions[0];
          if (firstSuggestion.confidence === "high") {
            console.log("🎯 High confidence suggestion found");
          }
        }
        
      } catch (err) {
        console.error("❌ Address validation failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to validate address";
        setError(errorMessage);
        setSuggestions(null);
        
        // Only show error toast for non-network errors
        if (!errorMessage.includes("NetworkError") && !errorMessage.includes("fetch")) {
          toast.error(`Address validation failed: ${errorMessage}`);
        }
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [debounceMs, minChangeThreshold]);

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
    setError(null);
    setHasValidationOccurred(false);
    lastRequestRef.current = "";
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    validateAddress,
    clearSuggestions,
    hasValidationOccurred,
  };
}