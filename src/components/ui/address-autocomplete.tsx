import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { logger } from '@/utils/logger';

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
  autoFocus?: boolean;
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
  autoFocus = false,
  ...props
}: AddressAutocompleteProps) {
  logger.log('🎯 AddressAutocomplete rendered with:', { value, locationContext });
  
  const [displayValue, setDisplayValue] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, bottom: 0 });
  const [isSelectingFromDropdown, setIsSelectingFromDropdown] = useState(false);
  
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
      
      logger.log('🚀 Making Places API call with query:', searchQuery);
      
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
        logger.log('✅ Places API response:', data);
        const formattedPredictions = data.suggestions?.map((suggestion: any) => ({
          description: suggestion.placePrediction?.text?.text || '',
          place_id: suggestion.placePrediction?.placeId || ''
        }))?.slice(0, 8) || []; // Show up to 8 results
        
        logger.log('📍 Formatted predictions:', formattedPredictions);
        setPredictions(formattedPredictions);
        if (formattedPredictions.length > 0) {
          setShowDropdown(true);
          logger.log('🎉 Setting showDropdown to true with predictions:', formattedPredictions.length);
        }
      } else {
        logger.error('Places API error:', response.status, response.statusText);
        const errorData = await response.text();
        logger.error('Error details:', errorData);
        setPredictions([]);
      }
    } catch (error) {
      logger.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string, predictionDescription?: string) => {
    logger.log('🏠 Getting place details for placeId:', placeId);
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
        logger.log('📦 Place details response:', place);
        const components = place.addressComponents || [];

        let street = '';
        let street2 = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let hasStreetNumber = false;

        components.forEach((component: any) => {
          const types = component.types || [];

          if (types.includes('street_number')) {
            street = component.longText + ' ';
            hasStreetNumber = true;
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

        // If Google didn't provide a street number, try to extract it from the prediction description
        if (!hasStreetNumber && predictionDescription) {
          logger.log('⚠️ No street number in place details, extracting from prediction:', predictionDescription);
          // Extract the house number from the beginning of the prediction description
          // e.g., "18829 Star Ranch Boulevard, Hutto, TX" -> "18829"
          const match = predictionDescription.match(/^(\d+)\s+/);
          if (match) {
            const houseNumber = match[1];
            street = houseNumber + ' ' + street.trim();
            logger.log('✅ Extracted house number from prediction:', houseNumber);
          }
        }

        // Combine street and street2 (apt/suite) into a single address line
        // Format: "123 Main St Apt 4" or "123 Main St" if no apt
        const fullStreetAddress = street2
          ? `${street.trim()} ${street2}`.trim()
          : street.trim();

        const addressData = {
          street: fullStreetAddress,
          street2: '', // Clear street2 since we combined it into street
          city,
          state,
          zipCode
        };

        logger.log('🏡 Extracted address data:', addressData);
        logger.log('🔍 Component details:', { street, street2, city, state, zipCode, fullStreetAddress });
        logger.log('📦 Raw components from Google:', components);

        // Update the display value to show the full street address including apt/suite
        logger.log('🔄 Setting displayValue to:', addressData.street);
        setDisplayValue(addressData.street);

        if (onAddressSelect) {
          logger.log('✅ Calling onAddressSelect callback with:', addressData);
          onAddressSelect(addressData);
        } else {
          // Only call onChange if onAddressSelect is not provided
          logger.log('⚠️ No onAddressSelect callback provided, using onChange');
          onChange(addressData.street);
        }

        // Clear the flag after selection is complete
        setTimeout(() => {
          setIsSelectingFromDropdown(false);
          logger.log('🔄 Cleared isSelectingFromDropdown flag');
        }, 100);
      } else {
        logger.error('Place details error:', response.status, response.statusText);
      }
    } catch (error) {
      logger.error('Error getting place details:', error);
    }
  };

  // Calculate dropdown position based on input element
  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

      // For dropdown, check if it would go off screen
      const spaceBelow = viewportHeight - rect.bottom;
      const dropdownHeight = Math.min(240, predictions.length * 48); // Estimate height

      // Since we use position: fixed, use viewport-relative coordinates (no scroll offset)
      // Position directly below input, or above if not enough space below
      setDropdownPosition({
        top: spaceBelow >= dropdownHeight ? rect.bottom + 4 : 0, // 4px gap below input
        left: rect.left,
        width: rect.width,
        bottom: spaceBelow < dropdownHeight ? viewportHeight - rect.top + 4 : 0 // 4px gap above input
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    logger.log('📝 AddressAutocomplete input changed:', input);
    setDisplayValue(input);
    
    // Only call onChange if we're not in the process of selecting from dropdown
    if (!isSelectingFromDropdown) {
      onChange(input);
    } else {
      logger.log('🚫 Skipping onChange - selecting from dropdown');
    }
    
    setSelectedIndex(-1);
    
    if (input.length >= 3) {
      logger.log('🔍 Searching for:', input);
      updateDropdownPosition();
      setShowDropdown(true);
      searchPredictions(input);
    } else {
      setShowDropdown(false);
      setPredictions([]);
    }
  };

  const handlePredictionSelect = (prediction: Prediction) => {
    logger.log('🔥 handlePredictionSelect called with:', prediction);
    // Set flag to prevent onChange from interfering
    setIsSelectingFromDropdown(true);
    // Don't set displayValue here - let getPlaceDetails set it to just the street address
    // Don't call onChange here - let onAddressSelect handle all updates
    setShowDropdown(false);
    setPredictions([]);
    logger.log('📍 Getting place details for:', prediction.place_id);
    getPlaceDetails(prediction.place_id, prediction.description);
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
    logger.log('Input blur event - keeping dropdown open for clicks');
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
    logger.log('🔄 useEffect: value prop changed from', displayValue, 'to', value);
    setDisplayValue(value);
  }, [value]);

  // Auto-focus and select text when autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      logger.log('🎯 Auto-focused and selected address input');
    }
  }, [autoFocus]);

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
        logger.log('Clicked outside - closing dropdown');
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
        {showDropdown && predictions.length > 0 && typeof document !== 'undefined' && createPortal(
          <div
            ref={dropdownRef}
            className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-y-auto"
            style={{
              position: 'fixed',
              top: dropdownPosition.top ? `${dropdownPosition.top}px` : 'auto',
              bottom: dropdownPosition.bottom ? `${dropdownPosition.bottom}px` : 'auto',
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              maxHeight: '240px',
              zIndex: 99999,
              pointerEvents: 'auto',
              cursor: 'default',
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
                  logger.log('🎯 Prediction clicked:', prediction);
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