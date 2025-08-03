import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Check, ChevronLeft, MapPin } from "lucide-react";
import { type AddressSuggestion, type AddressSuggestionsResponse } from "@/api/backend/addressSuggestions";

interface AddressSuggestionsPanelProps {
  suggestions: AddressSuggestionsResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onApplySuggestion: (suggestion: AddressSuggestion) => void;
  className?: string;
}

export function AddressSuggestionsPanel({
  suggestions,
  isOpen,
  onClose,
  onApplySuggestion,
  className = "",
}: AddressSuggestionsPanelProps) {
  if (!isOpen) {
    return null;
  }

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
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">Address Suggestions</h3>
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
            {suggestions?.has_suggestions ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  We found {suggestions.suggestions.length} suggestion{suggestions.suggestions.length !== 1 ? 's' : ''} to improve this address:
                </p>
                
                {suggestions.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    {/* Full Address */}
                    <div className="mb-3">
                      <p className="font-medium text-gray-900 text-base leading-relaxed">
                        {suggestion.formatted_address}
                      </p>
                    </div>
                    
                    {/* Confidence Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        variant={suggestion.confidence === "high" ? "default" : "secondary"}
                        className={`text-xs px-2 py-1 ${
                          suggestion.confidence === "high" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {suggestion.confidence === "high" ? "High Confidence" : "Medium Confidence"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        via {suggestion.source === "google_maps" ? "Google Maps" : suggestion.source}
                      </span>
                    </div>
                    
                    {/* Enhancement Notes */}
                    {suggestion.enhancement_notes && (
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.enhancement_notes}
                      </p>
                    )}
                    
                    {/* Changes Made */}
                    {suggestion.changes_made.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-1">
                          Changes made:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.changes_made.map((change) => (
                            <Badge key={change} variant="outline" className="text-xs">
                              {change.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Apply Button */}
                    <Button
                      onClick={() => onApplySuggestion(suggestion)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Apply This Address
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No suggestions found</h4>
                <p className="text-sm text-gray-600">
                  We couldn't find any address suggestions for the current information. 
                  Please verify the address manually.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}