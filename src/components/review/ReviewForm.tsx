import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { PhoneNumberInput } from "@/components/ui/phone-number-input";
import { CheckCircle } from "lucide-react";
import { formatPhoneNumber, formatBirthday } from "@/lib/utils";
import type { ProspectCard } from "@/types/card";

interface ReviewFormProps {
  selectedCardForReview: ProspectCard | null;
  fieldsToShow: string[];
  formData: Record<string, string>;
  handleFormChange: (field: string, value: string) => void;
  handleFieldReview: (fieldKey: string, e: React.MouseEvent) => void;
  selectedTab: string;
  dataFieldsMap: Map<string, string>;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  selectedCardForReview,
  fieldsToShow,
  formData,
  handleFormChange,
  handleFieldReview,
  selectedTab,
  dataFieldsMap,
}) => {
  console.log({ fieldsToShow });
  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-y-auto">
      <div className="space-y-3 sm:space-y-4">
        {selectedCardForReview ? (
          fieldsToShow.map((fieldKey) => {
            const fieldData = selectedCardForReview.fields?.[fieldKey];
            const label =
              fieldData?.actual_field_name ||
              dataFieldsMap.get(fieldKey) ||
              fieldKey.replace(/_/g, " ");
            const needsReview = fieldData?.requires_human_review === true;
            const isReviewed = fieldData?.reviewed === true;
            const reviewNotes = fieldData?.review_notes;
            const showIcon = needsReview;
            let formattedValue = fieldData?.value ?? "";
            if (fieldKey === "cell")
              formattedValue = formatPhoneNumber(fieldData?.value);
            if (fieldKey === "date_of_birth")
              formattedValue = formatBirthday(fieldData?.value);
            const tooltipContent =
              reviewNotes || (needsReview ? "Needs human review" : null);
            return (
              <div
                key={fieldKey}
                className="flex flex-col sm:grid sm:grid-cols-5 sm:items-center gap-2 sm:gap-x-4 sm:gap-y-1"
              >
                <Label
                  htmlFor={fieldKey}
                  className="sm:text-right sm:col-span-2 text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:justify-end"
                >
                  {showIcon && !isReviewed && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-red-400 flex-shrink-0 text-white text-[8px] font-bold leading-none">
                            !
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p>{tooltipContent}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {label}:
                </Label>
                <div className="sm:col-span-3 flex items-center gap-2">
                  {fieldKey === "cell" ? (
                    <PhoneNumberInput
                      id={fieldKey}
                      value={formData[fieldKey] ?? ""}
                      onChange={(value) => handleFormChange(fieldKey, value)}
                      className={`h-10 sm:h-8 text-sm flex-1 ${
                        isReviewed && selectedTab === "needs_human_review"
                          ? "border-green-300 focus-visible:ring-green-400 bg-green-50"
                          : showIcon
                          ? "border-red-300 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                  ) : (
                    <Input
                      id={fieldKey}
                      value={formData[fieldKey] ?? ""}
                      onChange={(e) =>
                        handleFormChange(fieldKey, e.target.value)
                      }
                      className={`h-10 sm:h-8 text-sm flex-1 ${
                        isReviewed && selectedTab === "needs_human_review"
                          ? "border-green-300 focus-visible:ring-green-400 bg-green-50"
                          : showIcon
                          ? "border-red-300 focus-visible:ring-red-400"
                          : ""
                      }`}
                    />
                  )}
                  {showIcon && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 sm:h-8 sm:w-8 p-1 ${
                              isReviewed
                                ? "text-green-500"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                            onClick={(e) => handleFieldReview(fieldKey, e)}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>
                            {isReviewed
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
          })
        ) : (
          <p className="text-gray-500 text-center mt-4 text-sm">
            No card selected for review.
          </p>
        )}
      </div>
    </div>
  );
};

export default ReviewForm;
