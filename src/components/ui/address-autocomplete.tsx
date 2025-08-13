import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  error?: string;
  success?: boolean;
  helpText?: string;
  className?: string;
  required?: boolean;
}

interface Prediction {
  description: string;
  place_id: string;
}

export function AddressAutocomplete({ 
  label, 
  value, 
  onChange, 
  onAddressSelect,
  error, 
  success, 
  helpText,
  className,
  required = false,
  ...props 
}: AddressAutocompleteProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search for address predictions using new Places API
  const searchPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the new Places API Text Search (Autocomplete)
      const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDSVu7JPTKZvnTQ4DijQDxkA48LWoOJEdo'
        },
        body: JSON.stringify({
          input: input,
          regionCode: 'US',
          includedPrimaryTypes: ['street_address']
        })
      });

      if (response.ok) {
        const data = await response.json();
        const formattedPredictions = data.suggestions?.map((suggestion: any) => ({
          description: suggestion.placePrediction?.text?.text || '',
          place_id: suggestion.placePrediction?.placeId || ''
        }))?.slice(0, 5) || []; // Limit to 5 results
        
        setPredictions(formattedPredictions);
        console.log('New Places API working successfully! Found', formattedPredictions.length, 'results');
      } else {
        console.error('Places API error:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error details:', errorData);
        setPredictions([]);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDSVu7JPTKZvnTQ4DijQDxkA48LWoOJEdo',
          'X-Goog-FieldMask': 'addressComponents,formattedAddress'
        }
      });

      if (response.ok) {
        const place = await response.json();
        const components = place.addressComponents || [];
        
        let street = '';
        let street2 = '';
        let city = '';
        let state = '';
        let zipCode = '';

        components.forEach((component: any) => {
          const types = component.types || [];
          
          if (types.includes('street_number')) {
            street = component.longText + ' ';
          } else if (types.includes('route')) {
            street += component.longText;
          } else if (types.includes('subpremise')) {
            street2 = component.longText;
          } else if (types.includes('locality')) {
            city = component.longText;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.shortText;
          } else if (types.includes('postal_code')) {
            zipCode = component.longText;
          }
        });

        if (onAddressSelect) {
          onAddressSelect({
            street: street.trim(),
            street2,
            city,
            state,
            zipCode
          });
        }
      } else {
        console.error('Place details error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    onChange(input);
    setSelectedIndex(-1);
    
    if (input.length >= 3) {
      setShowDropdown(true);
      searchPredictions(input);
    } else {
      setShowDropdown(false);
      setPredictions([]);
    }
  };

  const handlePredictionSelect = (prediction: Prediction) => {
    setDisplayValue(prediction.description);
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    getPlaceDetails(prediction.place_id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < predictions.length) {
          handlePredictionSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setPredictions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    }, 150);
  };

  const handleFocus = () => {
    // Only show dropdown if we have predictions AND user has typed something
    if (predictions.length > 0 && displayValue.length >= 3) {
      setShowDropdown(true);
    }
  };

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <div className="space-y-2 relative">
      <label 
        htmlFor={`address-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
        className="block text-sm font-medium text-gray-900"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          id={`address-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="Start typing your address..."
          autoComplete="nope"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className={cn(
            "w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200",
            "text-base", // Prevent zoom on iOS
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            success && "border-green-500 focus:ring-green-500 focus:border-green-500 pr-10",
            className
          )}
          {...props}
        />
        
        {/* Icons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : success ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <MapPin className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {/* Dropdown */}
        {showDropdown && predictions.length > 0 && (
          <div 
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0",
                  index === selectedIndex && "bg-blue-50"
                )}
                onClick={() => handlePredictionSelect(prediction)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate">
                    {prediction.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
      
      {/* Help text */}
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}