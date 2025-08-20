import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Check, ChevronLeft, GraduationCap, MapPin } from "lucide-react";

interface HighSchoolSuggestion {
  id: string;
  name: string;
  ceeb_code: string;
  location: string;
  display_name: string;
  match_score: number;
  distance_info?: string;
}

interface HighSchoolSuggestionsPanelProps {
  suggestions: HighSchoolSuggestion[];
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: HighSchoolSuggestion) => void;
  className?: string;
}

export function HighSchoolSuggestionsPanel({
  suggestions,
  isOpen,
  onClose,
  onApplySuggestion,
  className = "",
}: HighSchoolSuggestionsPanelProps) {
  if (!isOpen) {
    return null;
  }

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.85) {
      return {
        text: "High Match",
        className: "bg-green-100 text-green-800 border-green-200"
      };
    } else if (score >= 0.70) {
      return {
        text: "Good Match", 
        className: "bg-blue-100 text-blue-800 border-blue-200"
      };
    } else {
      return {
        text: "Possible Match",
        className: "bg-yellow-100 text-yellow-800 border-yellow-200"
      };
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Sliding Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        ${className}
      `}>
        <Card className="h-full border-0 rounded-none shadow-none">
          <CardHeader className="border-b bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">High School Suggestions</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 overflow-y-auto flex-1">
            {suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  We found {suggestions.length} matching school{suggestions.length !== 1 ? 's' : ''} in our directory:
                </p>
                
                {suggestions.map((suggestion, index) => {
                  const confidence = getConfidenceBadge(suggestion.match_score);
                  
                  return (
                    <div
                      key={suggestion.id || index}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      {/* School Name */}
                      <div className="mb-3">
                        <p className="font-semibold text-gray-900 text-base leading-relaxed">
                          {suggestion.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{suggestion.location}</span>
                        </div>
                        {suggestion.distance_info && (
                          <p className="text-xs text-gray-500 mt-1">
                            {suggestion.distance_info}
                          </p>
                        )}
                      </div>
                      
                      {/* CEEB Code and Confidence */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge 
                          variant="outline"
                          className="text-xs px-2 py-1 bg-gray-50 text-gray-700 border-gray-300"
                        >
                          CEEB: {suggestion.ceeb_code || 'N/A'}
                        </Badge>
                        
                        <Badge 
                          variant="outline"
                          className={`text-xs px-2 py-1 ${confidence.className}`}
                        >
                          {confidence.text} ({(suggestion.match_score * 100).toFixed(0)}%)
                        </Badge>
                      </div>
                      
                      {/* Action Button */}
                      <Button
                        onClick={() => onApplySuggestion(suggestion)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Select This School
                      </Button>
                    </div>
                  );
                })}
                
                {/* Additional Options */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    Don't see your school?
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      // Focus the input field for manual entry
                      setTimeout(() => {
                        const input = document.querySelector('input[placeholder*="High School"]') as HTMLInputElement;
                        if (input) {
                          input.focus();
                          input.select();
                        }
                      }, 100);
                    }}
                    className="w-full text-sm h-9"
                  >
                    Enter School Manually
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No matching schools found</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    // Focus the input field for manual entry
                    setTimeout(() => {
                      const input = document.querySelector('input[placeholder*="High School"]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                        input.select();
                      }
                    }, 100);
                  }}
                  className="text-sm"
                >
                  Enter School Manually
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}