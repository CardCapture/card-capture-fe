import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  locationContext?: {
    zipCode?: string;
    city?: string;
    state?: string;
  };
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
  locationContext,
  ...props 
}: AddressAutocompleteProps) {
  console.log('🎯 AddressAutocomplete rendered with:', { value, locationContext });
  
  const [displayValue, setDisplayValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
  
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
      // Use just the input for better results - don't restrict by zip
      // Google will naturally prioritize nearby results
      let searchQuery = input;
      
      // Only add city/state if we don't have a zip code
      // This gives broader results while still being somewhat local
      if (locationContext?.city && locationContext?.state && !locationContext?.zipCode) {
        searchQuery = `${input}, ${locationContext.city}, ${locationContext.state}`;
      } else if (locationContext?.state) {
        // If we have a zip, just add the state for broader results
        searchQuery = `${input}, ${locationContext.state}`;
      }
      
      console.log('🚀 Making Places API call with query:', searchQuery);
      
      // Use the new Places API Text Search (Autocomplete)
      const response = await fetch(`https://places.googleapis.com/v1/places:autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY
        },
        body: JSON.stringify({
          input: searchQuery,
          regionCode: 'US'
          // Removed includedPrimaryTypes to get more results
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Places API response:', data);
        const formattedPredictions = data.suggestions?.map((suggestion: any) => ({
          description: suggestion.placePrediction?.text?.text || '',
          place_id: suggestion.placePrediction?.placeId || ''
        }))?.slice(0, 8) || []; // Show up to 8 results
        
        console.log('📍 Formatted predictions:', formattedPredictions);
        setPredictions(formattedPredictions);
        if (formattedPredictions.length > 0) {
          setShowDropdown(true);
          console.log('🎉 Setting showDropdown to true with predictions:', formattedPredictions.length);
        }
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
    console.log('🏠 Getting place details for placeId:', placeId);
    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'addressComponents,formattedAddress'
        }
      });

      if (response.ok) {
        const place = await response.json();
        console.log('📦 Place details response:', place);
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

        const addressData = {
          street: street.trim(),
          street2,
          city,
          state,
          zipCode
        };
        
        console.log('🏡 Extracted address data:', addressData);

        if (onAddressSelect) {
          console.log('✅ Calling onAddressSelect callback');
          onAddressSelect(addressData);
        } else {
          console.log('⚠️ No onAddressSelect callback provided');
        }
      } else {
        console.error('Place details error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  // Calculate dropdown position based on input element
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const scrollY = window.scrollY || window.pageYOffset;

      // Check if we're on mobile (viewport width < 768px)
      const isMobile = window.innerWidth < 768;

      // For mobile, check if dropdown would go off screen
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownHeight = Math.min(240, predictions.length * 48); // Estimate height

      console.log('📏 Calculating dropdown position:', {
        rect,
        viewportHeight,
        spaceBelow,
        dropdownHeight,
        isMobile
      });

      // On mobile, use absolute positioning relative to viewport
      if (isMobile) {
        // Position directly below input, accounting for fixed positioning
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
          bottom: spaceBelow < dropdownHeight ? rect.top - dropdownHeight - 4 : 0
        });
      } else {
        // Desktop: use scroll-aware positioning
        setDropdownPosition({
          top: rect.bottom + scrollY,
          left: rect.left,
          width: rect.width,
          bottom: 0
        });
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    console.log('📝 AddressAutocomplete input changed:', input);
    setDisplayValue(input);
    onChange(input);
    setSelectedIndex(-1);
    
    if (input.length >= 3) {
      console.log('🔍 Searching for:', input);
      updateDropdownPosition();
      setShowDropdown(true);
      searchPredictions(input);
    } else {
      setShowDropdown(false);
      setPredictions([]);
    }
  };

  const handlePredictionSelect = (prediction: Prediction) => {
    console.log('🔥 handlePredictionSelect called with:', prediction);
    setDisplayValue(prediction.description);
    onChange(prediction.description);
    setShowDropdown(false);
    setPredictions([]);
    console.log('📍 Getting place details for:', prediction.place_id);
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
    // Don't hide dropdown on blur - let clicks handle it
    // This prevents the dropdown from closing before click events fire
    console.log('Input blur event - keeping dropdown open for clicks');
  };

  const handleFocus = () => {
    // Only show dropdown if we have predictions AND user has typed something
    if (predictions.length > 0 && displayValue.length >= 3) {
      updateDropdownPosition();
      setShowDropdown(true);
    }
  };

  // Update display value when prop value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Update dropdown position on scroll/resize when dropdown is open
  useEffect(() => {
    if (!showDropdown) return;

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown if clicking outside of input and dropdown
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        console.log('Clicked outside - closing dropdown');
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    // Update position immediately when dropdown opens
    updateDropdownPosition();

    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);
    document.addEventListener('mousedown', handleClickOutside);

    // Handle viewport changes (important for mobile keyboards)
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handlePositionUpdate);
      visualViewport.addEventListener('scroll', handlePositionUpdate);
    }

    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handlePositionUpdate);
        visualViewport.removeEventListener('scroll', handlePositionUpdate);
      }
    };
  }, [showDropdown, predictions.length]);

  return (
    <div className="space-y-2 relative">
      {label && (
        <label 
          htmlFor={`address-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
          className="block text-sm font-medium text-gray-900"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
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
          placeholder="Street Address"
          autoComplete="nope"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            error && "border-red-500 focus-visible:ring-red-500",
            success && "border-green-500 focus-visible:ring-green-500 pr-10",
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

        {/* Portal-based Dropdown to escape overflow containers */}
        {console.log('🚨 DROPDOWN CHECK:', { showDropdown, predictions: predictions.length, willRender: showDropdown && predictions.length > 0, position: dropdownPosition })}
        {showDropdown && predictions.length > 0 && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto"
            style={{
              position: 'fixed',
              top: dropdownPosition.bottom ? 'auto' : `${dropdownPosition.top}px`,
              bottom: dropdownPosition.bottom ? `${dropdownPosition.bottom}px` : 'auto',
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: '240px',
              zIndex: 99999,
              pointerEvents: 'auto',
              cursor: 'default',
              // Add transform for mobile to ensure proper positioning
              transform: window.innerWidth < 768 && dropdownPosition.bottom ? 'translateY(-4px)' : 'none'
            }}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent blur on input
              e.stopPropagation();
            }}
          >
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0",
                  index === selectedIndex && "bg-blue-50"
                )}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🎯 Prediction clicked:', prediction);
                  handlePredictionSelect(prediction);
                }}
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
          </div>,
          document.body
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