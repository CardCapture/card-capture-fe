import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HighSchoolSuggestionsPanel } from "@/components/ui/high-school-suggestions-panel";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  AlertTriangle, 
  GraduationCap, 
  Lightbulb,
  Circle
} from "lucide-react";

interface HighSchoolSuggestion {
  id: string;
  name: string;
  ceeb_code: string;
  location: string;
  display_name: string;
  match_score: number;
  distance_info?: string;
}

interface HighSchoolValidationStatus {
  status: 'verified' | 'needs_validation' | 'no_matches' | 'unvalidated';
  match_type: 'auto' | 'suggestions' | 'manual';
  suggestions: HighSchoolSuggestion[];
  confidence: number;
}

interface HighSchoolFieldWithValidationProps {
  // Field value
  highSchool: string;
  onHighSchoolChange: (value: string) => void;
  
  // Field metadata from backend
  fieldData?: { 
    requires_human_review?: boolean; 
    reviewed?: boolean;
    source?: string;
    value?: string;
  };
  
  // Validation status from enhanced matching service
  validationStatus?: HighSchoolValidationStatus;
  
  // CEEB code handling
  ceebCode?: string;
  onCeebCodeChange?: (value: string) => void;
  
  // Styling
  className?: string;
  disabled?: boolean;
}

export function HighSchoolFieldWithValidation({
  highSchool,
  onHighSchoolChange,
  fieldData,
  validationStatus,
  ceebCode,
  onCeebCodeChange,
  className = "",
  disabled = false,
}: HighSchoolFieldWithValidationProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [appliedSuggestion, setAppliedSuggestion] = useState<HighSchoolSuggestion | null>(null);

  // Determine if field was verified during processing
  const wasVerifiedDuringProcessing = (
    fieldData && 
    !fieldData.requires_human_review &&
    fieldData.source?.includes('directory_verified')
  );

  // Check verification status
  const isVerified = validationStatus?.status === 'verified' || wasVerifiedDuringProcessing;
  const needsValidation = validationStatus?.status === 'needs_validation';
  const noMatches = validationStatus?.status === 'no_matches';
  const hasSuggestions = validationStatus?.suggestions && validationStatus.suggestions.length > 0;

  // Handle applying a suggestion
  const handleApplySuggestion = (suggestion: HighSchoolSuggestion) => {
    onHighSchoolChange(suggestion.name);
    
    // Update CEEB code if handler provided
    if (onCeebCodeChange && suggestion.ceeb_code) {
      onCeebCodeChange(suggestion.ceeb_code);
    }
    
    setAppliedSuggestion(suggestion);
    setIsPanelOpen(false);
    
    toast.success(`✅ High school verified: ${suggestion.name} (CEEB: ${suggestion.ceeb_code})`);
  };

  // Helper to get field styling based on review status
  const getFieldClassName = () => {
    const baseClasses = "h-10 sm:h-8 text-sm";
    
    if (fieldData?.reviewed || isVerified) {
      return `${baseClasses} border-green-300 focus-visible:ring-green-400 bg-green-50`;
    } else if (fieldData?.requires_human_review || noMatches) {
      return `${baseClasses} border-red-300 focus-visible:ring-red-400`;
    } else if (needsValidation) {
      return `${baseClasses} border-yellow-300 focus-visible:ring-yellow-400 bg-yellow-50`;
    }
    
    return baseClasses;
  };

  // Determine what status message to show
  const getStatusMessage = () => {
    if (isVerified) {
      const displayCeeb = appliedSuggestion?.ceeb_code || ceebCode;
      return {
        type: 'verified',
        icon: <CheckCircle className="w-3 h-3 text-green-600" />,
        text: `High school verified${displayCeeb ? ` (CEEB: ${displayCeeb})` : ''}`,
        textColor: 'text-green-600'
      };
    }

    if (needsValidation && hasSuggestions) {
      return {
        type: 'has_suggestions',
        icon: <Lightbulb className="w-3 h-3 text-amber-600" />,
        text: 'Click here to validate high school',
        textColor: 'text-amber-600',
        action: () => setIsPanelOpen(true)
      };
    }

    if (noMatches) {
      return {
        type: 'no_matches',
        icon: <AlertTriangle className="w-3 h-3 text-orange-600" />,
        text: 'No matches found - Edit to validate',
        textColor: 'text-orange-600',
        action: () => {
          const input = document.querySelector('input[placeholder*="High School"]') as HTMLInputElement;
          if (input) {
            input.focus();
            input.select();
          }
        }
      };
    }

    return null;
  };

  const status = getStatusMessage();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* High School Input */}
      <Input
        type="text"
        value={highSchool}
        onChange={(e) => onHighSchoolChange(e.target.value)}
        placeholder="High School Name"
        className={cn(getFieldClassName(), "w-full max-w-sm")}
        disabled={disabled}
      />

      {/* Status Messages */}
      {status?.type === 'verified' && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-3 h-3" />
          <span>{status.text}</span>
        </div>
      )}
      
      {status?.type === 'has_suggestions' && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Lightbulb className="w-3 h-3" />
          <button 
            onClick={status.action}
            className="text-amber-700 underline hover:no-underline font-medium"
          >
            {status.text}
          </button>
        </div>
      )}
      
      {status?.type === 'no_matches' && (
        <div className="flex items-center gap-2 text-sm text-orange-600">
          <AlertTriangle className="w-3 h-3" />
          <button 
            onClick={status.action}
            className="text-orange-700 underline hover:no-underline font-medium"
          >
            {status.text}
          </button>
        </div>
      )}

      {/* Suggestions Panel */}
      <HighSchoolSuggestionsPanel
        suggestions={validationStatus?.suggestions || []}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onApplySuggestion={handleApplySuggestion}
      />
    </div>
  );
}