import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Loader2 } from "lucide-react";

interface AddressValidationTriggerProps {
  hasValidation: boolean;
  hasGoogleVerification: boolean;
  isLoading: boolean;
  onClick: () => void;
  className?: string;
}

export function AddressValidationTrigger({
  hasValidation,
  hasGoogleVerification,
  isLoading,
  onClick,
  className = "",
}: AddressValidationTriggerProps) {
  // Don't show anything if no validation has occurred and not loading
  if (!hasValidation && !isLoading && !hasGoogleVerification) {
    return null;
  }

  // Show verified badge if Google confirmed the address
  if (hasGoogleVerification) {
    return (
      <Badge 
        variant="default" 
        className={`bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1 ${className}`}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center text-gray-500 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  // Show validate button when suggestions are available
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 ${className}`}
    >
      <MapPin className="w-3 h-3 mr-1" />
      Validate Address
    </Button>
  );
}