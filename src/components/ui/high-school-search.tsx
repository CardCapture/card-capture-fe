import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X, AlertCircle, Check, AlertTriangle, CheckCircle } from "lucide-react";
import { HighSchoolService, type HighSchool } from "@/services/HighSchoolService";
import { cn } from "@/lib/utils";
import { logger } from '@/utils/logger';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HighSchoolSearchProps {
  value: string;
  ceebCode?: string;
  schoolData?: HighSchool; // Full school data for verified schools
  state?: string;
  city?: string;
  onChange: (value: string, ceebCode?: string, schoolData?: HighSchool) => void;
  placeholder?: string;
  className?: string;
  needsReview?: boolean;
  suggestions?: HighSchool[];
  onManualReview?: () => void;
  disabled?: boolean;
  validationStatus?: 'verified' | 'needs_validation' | 'no_matches' | 'unvalidated';
  isEnhancedValidation?: boolean;
  isInModal?: boolean; // Add prop to handle modal-specific behavior
  isReviewed?: boolean; // Add prop to track if field is reviewed
}

export function HighSchoolSearch({
  value,
  ceebCode,
  schoolData,
  state,
  city,
  onChange,
  placeholder = "Search for high school...",
  className,
  needsReview = false,
  suggestions = [],
  onManualReview,
  disabled = false,
  validationStatus = 'unvalidated',
  isEnhancedValidation = false,
  isInModal = false,
  isReviewed = false,
}: HighSchoolSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [searchResults, setSearchResults] = useState<HighSchool[]>(suggestions);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVerified, setIsVerified] = useState(false);
  const [currentCeebCode, setCurrentCeebCode] = useState(ceebCode);
  const [currentSchoolData, setCurrentSchoolData] = useState<HighSchool | undefined>(schoolData);
  const [showSuggestionsPrompt, setShowSuggestionsPrompt] = useState(needsReview && suggestions.length > 0);
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [lastSelectedSchool, setLastSelectedSchool] = useState<HighSchool | null>(null);
  
  const searchTimeout = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Memoize the current state to avoid unnecessary recalculations
  const getCurrentState = useMemo(() => {
    // If searching, show loading state
    if (isSearching) {
      return { type: 'searching', message: 'Searching...', icon: 'loading' };
    }
    
    // If verified (either from backend validation or user selected from dropdown)
    // Check for verification BEFORE checking userHasTyped to prioritize verified state
    if (isVerified && currentCeebCode && inputValue.trim() && currentSchoolData) {
      // Ensure we have both city and state for proper formatting
      const city = currentSchoolData.city?.trim();
      const stateValue = currentSchoolData.state?.trim();
      
      if (city && stateValue) {
        const location = `${city}, ${stateValue}`;
        return { 
          type: 'verified', 
          message: `${location} • CEEB: ${currentCeebCode}`, 
          icon: 'check' 
        };
      } else {
        // Fallback if location data is missing - still show verified with CEEB
        return { 
          type: 'verified', 
          message: `High school verified • CEEB: ${currentCeebCode}`, 
          icon: 'check' 
        };
      }
    }
    
    // If user has typed and we have search results (but not verified)
    if (userHasTyped && inputValue.trim().length >= 2 && !isVerified) {
      if (searchResults.length > 0) {
        // Don't show status message - just open dropdown and let user select
        return null;
      } else if (!isSearching && !isSearchPending) {
        // Only show no matches if we're not currently searching or waiting to search (prevents premature "no matches" during debounce)
        return { type: 'no_matches', message: 'No matches found, search for school', icon: 'warning' };
      }
      // If searching or search pending, don't show any status (let loading state handle it)
      return null;
    }
    
    // Enhanced validation states from backend
    if (isEnhancedValidation) {
      if (validationStatus === 'verified') {
        // For verified schools, prioritize showing verification even if some data is missing
        if (currentCeebCode && inputValue.trim()) {
          // Try to get location from schoolData first
          const city = currentSchoolData?.city?.trim();
          const stateValue = currentSchoolData?.state?.trim();
          
          if (city && stateValue) {
            const location = `${city}, ${stateValue}`;
            return { 
              type: 'verified', 
              message: `${location} • CEEB: ${currentCeebCode}`, 
              icon: 'check' 
            };
          } else {
            // Fallback - still show verified status with CEEB
            return { 
              type: 'verified', 
              message: `School verified • CEEB: ${currentCeebCode}`, 
              icon: 'check' 
            };
          }
        }
        // If no CEEB but validation says verified, still show as verified
        else if (inputValue.trim()) {
          return { 
            type: 'verified', 
            message: 'School verified', 
            icon: 'check' 
          };
        }
      } else if (validationStatus === 'needs_validation') {
        // For needs_validation, show suggestions count with clickable link
        if (suggestions.length > 0) {
          return { type: 'suggestions_available', message: 'No matches', suggestionCount: suggestions.length, icon: 'search' };
        } else {
          return { type: 'no_matches', message: 'No matches found, search for school', icon: 'search' };
        }
      } else if (validationStatus === 'no_matches') {
        return { type: 'no_matches', message: 'No matches found, search for school', icon: 'search' };
      }
    }
    
    // Legacy needsReview state
    if (needsReview && suggestions.length > 0 && !isVerified && !isReviewed) {
      // Don't show status message - just open dropdown and let user select
      return null;
    }
    
    // Don't show suggestions if field is manually reviewed
    if (isReviewed) {
      return null;
    }
    
    // Default state for unverified fields - show suggestions count if available
    if (!isVerified) {
      if (suggestions.length > 0) {
        return { type: 'suggestions_available', message: 'No matches', suggestionCount: suggestions.length, icon: 'search' };
      } else {
        return { type: 'no_matches', message: 'No matches found, search for school', icon: 'search' };
      }
    }
    
    // Default state - no status message
    return null;
  }, [isSearching, isSearchPending, userHasTyped, inputValue, searchResults.length, isVerified, 
      currentCeebCode, currentSchoolData, isEnhancedValidation, validationStatus, 
      needsReview, suggestions.length, isReviewed]);

  // Check if current value is verified (has CEEB code or enhanced verification)
  useEffect(() => {
    const verified = !!ceebCode || (isEnhancedValidation && validationStatus === 'verified');
    
    // Only update internal state if we don't have a manually selected school
    // or if the new ceebCode is non-empty and different from our current one
    if (!lastSelectedSchool || (ceebCode && ceebCode !== currentCeebCode)) {
      setIsVerified(verified);
      setCurrentCeebCode(ceebCode);
      setCurrentSchoolData(schoolData);
      
      // If we have a verified status from backend, reset user interaction flags
      if (verified && !userHasTyped) {
        setLastSelectedSchool(null);
      }
    }
  }, [ceebCode, schoolData, isEnhancedValidation, validationStatus, userHasTyped, lastSelectedSchool, currentCeebCode]);

  // Initialize with suggestions (consolidated to avoid race conditions)
  useEffect(() => {
    // Only set suggestions if user hasn't started typing to avoid interfering with search
    if (!userHasTyped && suggestions.length > 0) {
      if ((needsReview && !isVerified) || (isEnhancedValidation && validationStatus === 'needs_validation')) {
        // Apply city-based sorting to suggestions to match dropdown search behavior
        const sortedSuggestions = [...suggestions];
        if (city) {
          sortedSuggestions.sort((a, b) => {
            const aMatchesCity = a.city?.toLowerCase() === city.toLowerCase();
            const bMatchesCity = b.city?.toLowerCase() === city.toLowerCase();
            
            if (aMatchesCity && !bMatchesCity) return -1;
            if (!aMatchesCity && bMatchesCity) return 1;
            return 0;
          });
        }
        
        setSearchResults(sortedSuggestions);
        if (needsReview && !isVerified) {
          setShowSuggestionsPrompt(true);
        }
      }
    }
  }, [needsReview, suggestions, isVerified, isEnhancedValidation, validationStatus, userHasTyped, city]);

  // Update input value when prop changes (but preserve school selections)
  useEffect(() => {
    if (!userHasTyped && !lastSelectedSchool) {
      setInputValue(value);
    }
    // Only update if we have a verified school and the value is actually different and longer
    else if (isVerified && value && value !== inputValue && value.length > inputValue.length) {
      setInputValue(value);
    }
  }, [value, userHasTyped, isVerified, inputValue, lastSelectedSchool]);

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!showResults) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the wrapper
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    // Use capture phase to ensure we catch the event before other handlers
    document.addEventListener("mousedown", handleClickOutside, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showResults]);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults(suggestions);
      return;
    }

    setIsSearching(true);
    try {
      const response = await HighSchoolService.searchHighSchools(
        searchQuery,
        15,
        state
      );
      
      // Combine API results with suggestions if they exist
      const combinedResults = [...response.results];
      
      // Add suggestions that aren't already in results
      suggestions.forEach(suggestion => {
        if (!combinedResults.find(r => r.id === suggestion.id)) {
          combinedResults.push(suggestion);
        }
      });
      
      // Sort results to prioritize schools in the same city as the student
      if (city) {
        combinedResults.sort((a, b) => {
          const aMatchesCity = a.city?.toLowerCase() === city.toLowerCase();
          const bMatchesCity = b.city?.toLowerCase() === city.toLowerCase();
          
          if (aMatchesCity && !bMatchesCity) return -1;
          if (!aMatchesCity && bMatchesCity) return 1;
          return 0;
        });
      }
      
      setSearchResults(combinedResults);
      
      // Auto-open dropdown if we have results (regardless of whether user is typing)
      if (combinedResults.length > 0) {
        setShowResults(true);
      }
    } catch (error) {
      logger.error("Search error:", error);
      setSearchResults(suggestions);
    } finally {
      setIsSearching(false);
      setIsSearchPending(false);
    }
  }, [state, suggestions]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowResults(true);
    setSelectedIndex(-1);
    setUserHasTyped(true);
    
    // Clear verification state when user types (unless they're typing the exact verified school name)
    const isTypingVerifiedSchool = lastSelectedSchool && newValue === lastSelectedSchool.name;
    if (!isTypingVerifiedSchool) {
      logger.log('🧹 HighSchoolSearch: User typing, clearing verification state');
      setIsVerified(false);
      setCurrentCeebCode(undefined);
      setCurrentSchoolData(undefined);
      setLastSelectedSchool(null);
      
      // Notify parent that field is no longer verified and needs review reset
      if (onChange) {
        logger.log('🔄 HighSchoolSearch: Notifying parent of unverified state');
      }
    }
    
    setShowSuggestionsPrompt(false); // Hide the prompt once user starts typing
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Notify parent of text change (clears CEEB unless typing verified school)
    onChange(
      newValue, 
      isTypingVerifiedSchool ? currentCeebCode : undefined,
      isTypingVerifiedSchool ? currentSchoolData : undefined
    );
    
    // Set search pending flag to prevent premature "no matches" state
    if (newValue.trim().length >= 2) {
      setIsSearchPending(true);
    } else {
      setIsSearchPending(false);
    }
    
    // Set new timeout for search with slightly longer debounce to reduce jumpiness
    searchTimeout.current = setTimeout(() => {
      setIsSearchPending(false); // Clear pending flag when search starts
      performSearch(newValue);
    }, 300);
  };

  // Handle school selection
  const handleSelectSchool = (school: HighSchool) => {
    const fullSchoolName = school.name;
    setInputValue(fullSchoolName);
    setCurrentCeebCode(school.ceeb_code);
    setCurrentSchoolData(school);
    setIsVerified(true);
    setShowResults(false);
    setUserHasTyped(false); // Reset typing flag when user selects from dropdown
    setLastSelectedSchool(school); // Remember the selected school
    
    // Immediately call onChange to update parent form data
    onChange(fullSchoolName, school.ceeb_code, school);
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    setCurrentCeebCode(undefined);
    setCurrentSchoolData(undefined);
    setIsVerified(false);
    setSearchResults([]);
    setShowResults(false);
    setUserHasTyped(false);
    setLastSelectedSchool(null);
    onChange("", undefined, undefined);
    inputRef.current?.focus();
  };

  // Handle showing suggestions by opening live search dropdown
  const handleShowSuggestions = () => {
    // Highlight/select all text in input field
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    
    // Trigger live search with current input to get location-aware results
    if (inputValue.trim().length >= 2) {
      performSearch(inputValue);
    } else {
      // If input is too short, perform search with school name to get relevant results
      const searchQuery = inputValue || value || "";
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        // Fall back to showing original suggestions but with city sorting
        const sortedSuggestions = [...suggestions];
        if (city) {
          sortedSuggestions.sort((a, b) => {
            const aMatchesCity = a.city?.toLowerCase() === city.toLowerCase();
            const bMatchesCity = b.city?.toLowerCase() === city.toLowerCase();
            
            if (aMatchesCity && !bMatchesCity) return -1;
            if (!aMatchesCity && bMatchesCity) return 1;
            return 0;
          });
        }
        setSearchResults(sortedSuggestions);
        setShowResults(true);
      }
    }
    
    // Scroll to center the field with some context after a brief delay to ensure dropdown is rendered
    setTimeout(() => {
      if (wrapperRef.current) {
        wrapperRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectSchool(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div ref={wrapperRef} className="relative flex-1">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Auto-open dropdown if we have results to show
            if (searchResults.length > 0 || suggestions.length > 0) {
              setShowResults(true);
              setShowSuggestionsPrompt(false);
            }
            // Also show results if user has typed and we have suggestions
            if (userHasTyped && searchResults.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-12",
            className,
            // No warning styles - keep input field clean
            false && "border-amber-500 focus-visible:ring-amber-400 bg-amber-50"
          )}
        />
        
        {/* Status indicators and actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          
          {/* Enhanced validation status indicators - no checkmark inside field */}
          

          
          {/* Legacy status indicators */}
          {!isEnhancedValidation && isVerified && (
            <Check className="h-4 w-4 text-green-600" />
          )}
          
          {!isEnhancedValidation && needsReview && !isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>School needs verification</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>



      {/* Dynamic Status Messages */}
      <div className="mt-1">
        {(() => {
          const currentState = getCurrentState;
          if (!currentState) return null;
          
          const { type, message, icon } = currentState;
        
        if (type === 'verified') {
          return (
            <div className="flex items-center gap-2 text-sm text-green-600 w-fit">
              <CheckCircle className="w-3 h-3" />
              <span>{message}</span>
            </div>
          );
        }
        
        if (type === 'searching') {
          return (
            <div className="flex items-center gap-2 text-sm text-gray-500 w-fit">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{message}</span>
            </div>
          );
        }
        
        
        if (type === 'not_validated') {
          return (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertTriangle className="w-3 h-3" />
              <span>{message}</span>
            </div>
          );
        }
        
        if (type === 'no_matches') {
          return (
            <div className="flex items-center gap-1 text-xs text-orange-600 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" />
              <span>High School Not Found, </span>
              <button 
                type="button"
                onClick={handleShowSuggestions}
                className="text-orange-600 hover:text-orange-800 underline cursor-pointer font-medium"
              >
                See Suggestions
              </button>
            </div>
          );
        }
        
        if (type === 'suggestions_available') {
          return (
            <div className="flex items-center gap-1 text-sm text-orange-600 whitespace-nowrap">
              <AlertTriangle className="w-4 h-4" />
              <span>No matches, </span>
              <button 
                type="button"
                onClick={handleShowSuggestions}
                className="text-orange-600 hover:text-orange-800 underline cursor-pointer font-medium"
              >
                see {currentState.suggestionCount} suggestion{currentState.suggestionCount !== 1 ? 's' : ''}
              </button>
            </div>
          );
        }
        
        return null;
        })()}
      </div>

      {/* Legacy suggestions prompt */}
      {!isEnhancedValidation && showSuggestionsPrompt && !showResults && needsReview && suggestions.length > 0 && (
        <div className="mt-1 p-2 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-800 font-medium">
                School verification needed
              </p>
              <p className="text-xs text-gray-700 mt-1">
                Click to see {suggestions.length} suggested {suggestions.length === 1 ? 'match' : 'matches'} or search for the correct school.
              </p>
              <button
                type="button"
                className="text-xs text-gray-800 underline mt-1 hover:text-gray-900"
                onClick={() => {
                  setShowResults(true);
                  inputRef.current?.focus();
                }}
              >
                View suggestions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {(showResults || (userHasTyped && searchResults.length > 0)) && (searchResults.length > 0 || (needsReview && suggestions.length > 0)) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {needsReview && suggestions.length > 0 && (
            <div className="px-3 py-2 border-b bg-gray-50">
              <p className="text-xs text-gray-600 font-medium">
                Suggested matches:
              </p>
            </div>
          )}
          
          {searchResults.map((school, index) => {
            const isSuggestion = suggestions.some(s => s.id === school.id);
            return (
              <button
                key={school.id}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none",
                  selectedIndex === index && "bg-gray-100",
                  isSuggestion && "bg-blue-50 hover:bg-blue-100"
                )}
                onClick={() => handleSelectSchool(school)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {school.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {school.city}, {school.state}
                      {school.district_name && ` • ${school.district_name}`}
                    </p>
                  </div>
                  {school.ceeb_code && (
                    <Badge variant="outline" className="text-xs ml-2">
                      {school.ceeb_code}
                    </Badge>
                  )}
                </div>
                {school.match_score && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-400">
                      Match: {Math.round(school.match_score * 100)}%
                    </span>
                  </div>
                )}
              </button>
            );
          })}
          
          {/* Manual review option */}
          {needsReview && onManualReview && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left border-t hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
              onClick={() => {
                setShowResults(false);
                onManualReview();
              }}
            >
              <div className="flex items-center text-sm text-gray-600">
                <Search className="h-4 w-4 mr-2" />
                Can't find the school? Mark as reviewed
              </div>
            </button>
          )}
        </div>
      )}
      
      {/* No results message */}
      {showResults && inputValue.length >= 2 && searchResults.length === 0 && !isSearching && !isSearchPending && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
          <p className="text-sm text-gray-500">No schools found matching "{inputValue}"</p>
          {onManualReview && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-1 p-0 h-auto"
              onClick={onManualReview}
            >
              Mark as reviewed
            </Button>
          )}
        </div>
      )}
      </div>

      {/* Manual review circle removed - handled by parent ReviewForm component */}
    </div>
  );
}