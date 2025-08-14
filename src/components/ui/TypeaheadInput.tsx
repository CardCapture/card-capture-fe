import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

console.log('🔍 TypeaheadInput.tsx: File is being imported!');
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
console.log('🔍 TypeaheadInput.tsx: API_BASE_URL is:', API_BASE_URL);

interface TypeaheadItem {
  id: string;
  [key: string]: any;
}

interface TypeaheadInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (item: TypeaheadItem) => void;
  searchEndpoint: string; // e.g., "/high-schools/search" or "/majors/search"
  displayField: string; // e.g., "name" or "cip_title"
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  minSearchLength?: number;
  searchDelay?: number;
}

export const TypeaheadInput: React.FC<TypeaheadInputProps> = ({
  label,
  value,
  onChange,
  onSelect,
  searchEndpoint,
  displayField,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  minSearchLength = 2,
  searchDelay = 300,
}) => {
  console.log('TypeaheadInput: Component mounted with props:', {
    label,
    value,
    searchEndpoint,
    displayField,
    placeholder
  });

  const [suggestions, setSuggestions] = useState<TypeaheadItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blockDropdownRef = useRef(false);

  // Search suggestions when user types
  useEffect(() => {
    console.log('TypeaheadInput: useEffect triggered with value:', value, 'length:', value.length, 'minSearchLength:', minSearchLength);
    
    if (value.length < minSearchLength) {
      console.log('TypeaheadInput: Value too short, not searching');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't search if we just selected an item
    if (blockDropdownRef.current) {
      console.log('TypeaheadInput: Blocked dropdown is active, skipping search');
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsSearching(true);
      const searchUrl = `${API_BASE_URL}${searchEndpoint}?q=${encodeURIComponent(value)}&limit=10`;
      console.log('TypeaheadInput: Making search request to:', searchUrl);
      
      try {
        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('TypeaheadInput: Response status:', response.status);
        
        if (!response.ok) {
          console.error('Search failed:', response.status, await response.text());
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        const data = await response.json();
        console.log('TypeaheadInput: Search results:', data);
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('TypeaheadInput: Error searching:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, searchDelay);

    return () => clearTimeout(delayedSearch);
  }, [value, searchEndpoint, minSearchLength, searchDelay]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(event.target as Node)) {
        setTimeout(() => setShowSuggestions(false), 150); // Small delay to allow selection
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      console.log('TypeaheadInput: Input changed to:', newValue);
      blockDropdownRef.current = false; // Allow search when user types
      onChange(newValue);
    },
    [onChange]
  );

  const handleItemSelect = useCallback(
    (item: TypeaheadItem) => {
      // Block dropdown from reopening when setting value
      blockDropdownRef.current = true;
      
      // Hide dropdown immediately
      setShowSuggestions(false);
      setSuggestions([]);
      
      // Set the display value
      const displayValue = item[displayField] || '';
      onChange(displayValue);
      
      // Call onSelect callback if provided
      if (onSelect) {
        onSelect(item);
      }
      
      // Remove focus from the input
      if (inputRef.current) {
        inputRef.current.blur();
      }
    },
    [displayField, onChange, onSelect]
  );

  const handleInputFocus = useCallback(() => {
    // Show suggestions if we have them and the search is long enough
    if (suggestions.length > 0 && value.length >= minSearchLength) {
      setShowSuggestions(true);
    }
  }, [suggestions.length, value.length, minSearchLength]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <Label htmlFor={`typeahead-${searchEndpoint}`} className="mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <Input
          ref={inputRef}
          id={`typeahead-${searchEndpoint}`}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pr-8"
        />
        
        {isSearching && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                onClick={() => handleItemSelect(item)}
              >
                <div className="font-medium text-gray-900">
                  {item[displayField]}
                </div>
                {/* Show additional context based on the item type */}
                {item.city && item.state && (
                  <div className="text-sm text-gray-500">
                    {item.city}, {item.state}
                  </div>
                )}
                {item.cip_code && (
                  <div className="text-sm text-gray-500">
                    CIP Code: {item.cip_code}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
        
        {showSuggestions && suggestions.length === 0 && !isSearching && value.length >= minSearchLength && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2">
            <div className="text-sm text-gray-500">No results found</div>
          </div>
        )}
      </div>
    </div>
  );
};