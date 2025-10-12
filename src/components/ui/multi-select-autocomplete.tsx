import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface MultiSelectItem {
  id: string | number;
  label: string;
  value?: string;
}

interface MultiSelectAutocompleteProps {
  label: string;
  value: MultiSelectItem[];
  onChange: (value: MultiSelectItem[]) => void;
  onSearch: (query: string) => Promise<any[]>;
  mapResultToItem: (result: any) => MultiSelectItem;
  placeholder?: string;
  helpText?: string;
  className?: string;
  required?: boolean;
}

export function MultiSelectAutocomplete({
  label,
  value,
  onChange,
  onSearch,
  mapResultToItem,
  placeholder = "Search...",
  helpText,
  className,
  required = false,
}: MultiSelectAutocompleteProps) {
  console.log('🎨 MultiSelectAutocomplete rendered', { label, valueCount: value?.length });

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for suggestions
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await onSearch(query);
      setSuggestions(results || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('🔍 MultiSelect input changed:', query);
    setSearchQuery(query);
    handleSearch(query);
  };

  // Add item to selection
  const handleSelectItem = (result: any) => {
    const newItem = mapResultToItem(result);

    // Check if item is already selected
    const isAlreadySelected = value.some(item => item.id === newItem.id);
    if (isAlreadySelected) {
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }

    // Add to selected items
    onChange([...value, newItem]);

    // Clear input
    setSearchQuery('');
    setShowDropdown(false);

    // Focus back on input
    inputRef.current?.focus();
  };

  // Remove item from selection
  const handleRemoveItem = (itemId: string | number) => {
    onChange(value.filter(item => item.id !== itemId));
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Search input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className="w-full"
        />

        {/* Dropdown suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <ul
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            role="listbox"
          >
            {suggestions.map((suggestion) => {
              const item = mapResultToItem(suggestion);
              const isSelected = value.some(v => v.id === item.id);

              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 cursor-pointer",
                    isSelected && "bg-gray-100 text-gray-500"
                  )}
                  onClick={() => !isSelected && handleSelectItem(suggestion)}
                >
                  <div className="font-medium text-gray-900">{item.label}</div>
                  {isSelected && (
                    <div className="text-xs text-gray-500 mt-1">Already selected</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Selected items as pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <div
              key={item.id}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
            >
              <span>{item.label}</span>
              <button
                type="button"
                onClick={() => handleRemoveItem(item.id)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${item.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
