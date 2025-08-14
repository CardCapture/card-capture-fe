import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X, AlertCircle, Check } from "lucide-react";
import { HighSchoolService, type HighSchool } from "@/services/HighSchoolService";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HighSchoolSearchProps {
  value: string;
  ceebCode?: string;
  state?: string;
  onChange: (value: string, ceebCode?: string, schoolData?: HighSchool) => void;
  placeholder?: string;
  className?: string;
  needsReview?: boolean;
  suggestions?: HighSchool[];
  onManualReview?: () => void;
  disabled?: boolean;
}

export function HighSchoolSearch({
  value,
  ceebCode,
  state,
  onChange,
  placeholder = "Search for high school...",
  className,
  needsReview = false,
  suggestions = [],
  onManualReview,
  disabled = false,
}: HighSchoolSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [searchResults, setSearchResults] = useState<HighSchool[]>(suggestions);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isVerified, setIsVerified] = useState(false);
  const [currentCeebCode, setCurrentCeebCode] = useState(ceebCode);
  const [showSuggestionsPrompt, setShowSuggestionsPrompt] = useState(needsReview && suggestions.length > 0);
  
  const searchTimeout = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value is verified (has CEEB code)
  useEffect(() => {
    setIsVerified(!!ceebCode);
    setCurrentCeebCode(ceebCode);
  }, [ceebCode]);

  // Initialize with suggestions if field needs review
  useEffect(() => {
    if (needsReview && suggestions.length > 0 && !isVerified) {
      setSearchResults(suggestions);
      setShowSuggestionsPrompt(true);
    }
  }, [needsReview, suggestions, isVerified]);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      
      setSearchResults(combinedResults);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults(suggestions);
    } finally {
      setIsSearching(false);
    }
  }, [state, suggestions]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowResults(true);
    setSelectedIndex(-1);
    setIsVerified(false);
    setCurrentCeebCode(undefined);
    setShowSuggestionsPrompt(false); // Hide the prompt once user starts typing
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Notify parent of text change (clears CEEB if user is typing)
    onChange(newValue, undefined);
    
    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      performSearch(newValue);
    }, 300);
  };

  // Handle school selection
  const handleSelectSchool = (school: HighSchool) => {
    setInputValue(school.name);
    setCurrentCeebCode(school.ceeb_code);
    setIsVerified(true);
    setShowResults(false);
    onChange(school.name, school.ceeb_code, school);
  };

  // Handle clear
  const handleClear = () => {
    setInputValue("");
    setCurrentCeebCode(undefined);
    setIsVerified(false);
    setSearchResults([]);
    setShowResults(false);
    onChange("", undefined);
    inputRef.current?.focus();
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
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchResults.length > 0 || suggestions.length > 0) {
              setShowResults(true);
              setShowSuggestionsPrompt(false);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pr-20",
            className,
            needsReview && !isVerified && "border-amber-500 focus-visible:ring-amber-400 bg-amber-50",
            isVerified && "border-green-300 focus-visible:ring-green-400 bg-green-50"
          )}
        />
        
        {/* Status indicators and actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isSearching && (
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          )}
          
          {isVerified && currentCeebCode && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {currentCeebCode}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>CEEB Code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isVerified && (
            <Check className="h-4 w-4 text-green-600" />
          )}
          
          {needsReview && !isVerified && (
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

      {/* Suggestions prompt for fields needing review */}
      {showSuggestionsPrompt && !showResults && needsReview && suggestions.length > 0 && (
        <div className="mt-1 p-2 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-800 font-medium">
                School verification needed
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Click to see {suggestions.length} suggested {suggestions.length === 1 ? 'match' : 'matches'} or search for the correct school.
              </p>
              <button
                type="button"
                className="text-xs text-amber-800 underline mt-1 hover:text-amber-900"
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
      {showResults && (searchResults.length > 0 || (needsReview && suggestions.length > 0)) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {needsReview && suggestions.length > 0 && (
            <div className="px-3 py-2 border-b bg-amber-50">
              <p className="text-xs text-amber-700 font-medium">
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
                  isSuggestion && "bg-amber-50 hover:bg-amber-100"
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
                Can't find the school? Mark for manual review
              </div>
            </button>
          )}
        </div>
      )}
      
      {/* No results message */}
      {showResults && inputValue.length >= 2 && searchResults.length === 0 && !isSearching && (
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
              Mark for manual review
            </Button>
          )}
        </div>
      )}
    </div>
  );
}