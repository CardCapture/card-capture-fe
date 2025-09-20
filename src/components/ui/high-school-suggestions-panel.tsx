import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Check, ChevronLeft, GraduationCap, MapPin, Loader2 } from "lucide-react";
import { HighSchoolService, type HighSchool } from "@/services/HighSchoolService";

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
  schoolName: string; // The school name to search for
  studentCity?: string; // Student's city for location-aware search
  studentState?: string; // Student's state for location-aware search
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: HighSchool) => void;
  className?: string;
}

export function HighSchoolSuggestionsPanel({
  schoolName,
  studentCity,
  studentState,
  isOpen,
  onClose,
  onApplySuggestion,
  className = "",
}: HighSchoolSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<HighSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch suggestions when panel opens
  useEffect(() => {
    if (!isOpen || !schoolName || schoolName.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const response = await HighSchoolService.searchHighSchools(
          schoolName,
          15, // Get more suggestions
          studentState
        );
        
        // Sort results to prioritize schools in the student's city
        const sortedResults = [...response.results];
        if (studentCity) {
          sortedResults.sort((a, b) => {
            const aMatchesCity = a.city?.toLowerCase() === studentCity.toLowerCase();
            const bMatchesCity = b.city?.toLowerCase() === studentCity.toLowerCase();
            
            if (aMatchesCity && !bMatchesCity) return -1;
            if (!aMatchesCity && bMatchesCity) return 1;
            return 0;
          });
        }
        
        setSuggestions(sortedResults);
      } catch (error) {
        console.error("Failed to fetch school suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [isOpen, schoolName, studentCity, studentState]);

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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Finding schools...</span>
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  We found {suggestions.length} matching school{suggestions.length !== 1 ? 's' : ''} in our directory{studentCity ? ` (prioritized schools in ${studentCity})` : ''}:
                </p>
                
                {suggestions.map((suggestion, index) => {
                  const isLocalSchool = studentCity && suggestion.city?.toLowerCase() === studentCity.toLowerCase();
                  
                  return (
                    <div
                      key={suggestion.id || index}
                      className={`border rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors ${
                        isLocalSchool ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      {/* School Name */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-base leading-relaxed">
                            {suggestion.name}
                          </p>
                          {isLocalSchool && (
                            <Badge variant="outline" className="text-xs px-2 py-1 bg-green-100 text-green-800 border-green-200">
                              Local School
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{suggestion.city}, {suggestion.state}</span>
                        </div>
                      </div>
                      
                      {/* CEEB Code */}
                      {suggestion.ceeb_code && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge 
                            variant="outline"
                            className="text-xs px-2 py-1 bg-gray-50 text-gray-700 border-gray-300"
                          >
                            CEEB: {suggestion.ceeb_code}
                          </Badge>
                        </div>
                      )}
                      
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