import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { logger } from '@/utils/logger';
import { CheckCircle, TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// Simple validation states

interface AddressGroupSimpleProps {
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
  
  // Batch change handler (optional)
  onBatchChange?: (updates: Record<string, string>) => void;
  
  // Field metadata - now includes validation_state
  addressFieldData?: { 
    value?: string; 
    source?: string; 
    reviewed?: boolean;
    requires_human_review?: boolean;
  };
  cityFieldData?: { value?: string; source?: string; reviewed?: boolean };
  stateFieldData?: { value?: string; source?: string; reviewed?: boolean };
  zipCodeFieldData?: { value?: string; source?: string; reviewed?: boolean };
  
  // Card status
  reviewStatus?: string;
  
  // Review handler
  onFieldReview?: (fieldKey: string) => void;
  
  // Styling
  className?: string;
  
  // Disable validation when modal is closing
  disabled?: boolean;

  // Is this a QR scan (no image available)
  isQrScan?: boolean;
}

export function AddressGroupSimple({
  address,
  city,
  state,
  zipCode,
  onAddressChange,
  onCityChange,
  onStateChange,
  onZipCodeChange,
  onBatchChange,
  addressFieldData,
  cityFieldData,
  stateFieldData,
  zipCodeFieldData,
  reviewStatus,
  onFieldReview,
  className = "",
  disabled = false,
  isQrScan = false,
}: AddressGroupSimpleProps) {
  // State to control auto-focus of address input
  const [autoFocusAddress, setAutoFocusAddress] = useState(false);

  // Check if card is in "Ready for Export" status
  // Cards that are "reviewed" are ready for export
  const isReadyForExport = reviewStatus === "ready_for_export" || reviewStatus === "reviewed";

  // Helper to mark all address fields as reviewed when validation succeeds
  const handleValidationSuccess = () => {
    logger.log("✅ Address validated successfully, marking fields as reviewed");

    // Mark all address fields as reviewed
    // We need to pass a flag to indicate this is NOT a toggle, but a set-to-reviewed action
    // For now, let's check if fields are already reviewed and skip if they are
    if (onFieldReview && !addressFieldData?.reviewed) {
      // Only call onFieldReview if address is NOT already reviewed
      // This prevents toggling back to "needs review" on subsequent selections
      onFieldReview('address');
    } else if (addressFieldData?.reviewed) {
      logger.log("⏭️ Address already reviewed, skipping toggle");
    }
  };

  // Check if address was actually verified by Google Maps during pipeline processing
  // IMPORTANT: ALL four components (address, city, state, zip) must be verified
  // to show the green "verified" badge
  const wasVerifiedByGoogleMaps = (
    // All four components must exist
    addressFieldData &&
    cityFieldData &&
    stateFieldData &&
    zipCodeFieldData &&
    // All four must have values
    addressFieldData.value &&
    cityFieldData.value &&
    stateFieldData.value &&
    zipCodeFieldData.value &&
    // Check that ALL components have Google Maps verification sources
    (
      (addressFieldData.source === "google_maps_verified" || addressFieldData.source === "google_maps_disambiguated") &&
      (cityFieldData.source === "google_maps_verified" || cityFieldData.source === "google_maps_disambiguated") &&
      (stateFieldData.source === "google_maps_verified" || stateFieldData.source === "google_maps_disambiguated") &&
      (zipCodeFieldData.source === "google_maps_verified" || zipCodeFieldData.source === "google_maps_disambiguated")
    )
  );

  // Simple logic for showing address status
  const showNeedsReviewMessage = addressFieldData?.requires_human_review && !addressFieldData?.reviewed;
  const showVerifiedMessage = addressFieldData?.reviewed || wasVerifiedByGoogleMaps;

  // Handler for clicking "Edit Address" message
  const handleEditAddressClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't clear the address - just select it for replacement
    // This prevents triggering validation state changes
    // The autoFocus will select all text so user can type to replace
    setAutoFocusAddress(true);
  };

  // Reset auto-focus after it's been triggered
  useEffect(() => {
    if (autoFocusAddress) {
      const timer = setTimeout(() => {
        setAutoFocusAddress(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocusAddress]);

  const renderAddressStatus = () => {
    if (showVerifiedMessage) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>Address verified</span>
        </div>
      );
    }

    if (showNeedsReviewMessage) {
      return (
        <div className="flex items-center gap-1.5 text-[13px]">
          <TriangleAlert className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-orange-500">
            <button
              type="button"
              onClick={handleEditAddressClick}
              className="font-semibold underline hover:no-underline focus:outline-none"
            >
              Edit Address
            </button>
            {' '}to validate
          </span>
        </div>
      );
    }

    return null;
  };

  // Check if address field needs review and show checkbox
  const addressNeedsReview = addressFieldData?.requires_human_review;
  const addressIsReviewed = addressFieldData?.reviewed;
  const showReviewCheckbox = addressNeedsReview && !addressIsReviewed && onFieldReview;

  const handleAddressAutocomplete = (addressData: {
    street: string;
    street2: string;
    city: string;
    state: string;
    zipCode: string;
  }) => {
    logger.log('🏠 handleAddressAutocomplete called with:', addressData);
    
    // Use batch update if available, otherwise fall back to individual calls
    if (onBatchChange) {
      logger.log('🔄 Using batch update for all address fields');
      onBatchChange({
        address: addressData.street,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zipCode
      });
    } else {
      logger.log('🔄 Using individual change handlers');
      onAddressChange(addressData.street);
      onCityChange(addressData.city);
      onStateChange(addressData.state);
      onZipCodeChange(addressData.zipCode);
    }
    
    logger.log('🔄 After calling change handlers');
    
    // Add a small delay to ensure the parent state updates before showing success
    setTimeout(() => {
      toast.success("✅ Address verified with Google Maps");
      // Automatically mark address fields as reviewed when autocomplete is used
      handleValidationSuccess();
    }, 100);
  };

  return (
    <div className={`space-y-2 ${className} overflow-hidden`}>
      {/* Street Address with Google Maps Autocomplete */}
      <div className="w-full sm:max-w-sm">
        {!disabled ? (
          <AddressAutocomplete
            label=""
            value={address}
            onChange={(value) => {
              onAddressChange(value);
            }}
            onAddressSelect={handleAddressAutocomplete}
            className="h-10 sm:h-8 text-sm w-full"
            locationContext={{
              zipCode: zipCode,
              city: city,
              state: state
            }}
            autoFocus={autoFocusAddress}
          />
        ) : (
          <Input
            type="text"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
            placeholder="Street Address"
            className="w-full h-10 sm:h-8 text-sm"
            disabled={disabled}
          />
        )}
      </div>

      {/* City, State, Zip Row - Responsive layout */}
      <div className="flex flex-wrap sm:flex-nowrap gap-2">
        <Input
          type="text"
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          placeholder="City"
          className="flex-1 min-w-0 sm:w-32 sm:flex-none h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
        <Input
          type="text"
          value={state}
          onChange={(e) => onStateChange(e.target.value)}
          placeholder="State"
          className="w-16 sm:w-16 h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
        <Input
          type="text"
          value={zipCode}
          onChange={(e) => onZipCodeChange(e.target.value)}
          placeholder="Zip"
          className="w-20 sm:w-20 h-10 sm:h-8 text-sm"
          disabled={disabled}
        />
      </div>

      {/* Validation Status and Review Checkbox Row */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {renderAddressStatus()}
        </div>
        
        {/* Mark as Reviewed Checkbox - Only show if address needs review */}
        {showReviewCheckbox && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 p-1 ml-2 ${
                    addressIsReviewed
                      ? "text-green-500"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => onFieldReview?.('address')}
                  disabled={disabled}
                >
                  <CheckCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>
                  {addressIsReviewed
                    ? "Mark as needing review"
                    : "Mark as reviewed"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

    </div>
  );
}