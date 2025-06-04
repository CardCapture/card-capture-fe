import React, { useState, useMemo } from "react";
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  preferred_first_name: "Preferred Name",
  date_of_birth: "Birthdate",
  email: "Email",
  cell: "Cell Phone",
  permission_to_text: "Permission to Text",
  address: "Address",
  city: "City",
  state: "State",
  zip_code: "Zip Code",
  high_school: "High School",
  class_rank: "Class Rank",
  students_in_class: "Students in Class",
  gpa: "GPA",
  student_type: "Student Type",
  entry_term: "Entry Term",
  major: "Major",
  city_state: "City, State",
  gender: "Gender",
  // Add more as needed
};

interface ReviewFormProps {
  selectedCardForReview: ProspectCard | null;
  fieldsToShow: string[];
  formData: Record<string, string>;
  handleFormChange: (field: string, value: string) => void;
  handleFieldReview: (fieldKey: string, e: React.MouseEvent) => void;
  selectedTab: string;
  dataFieldsMap: Map<string, string>;
  majorsList?: string[];
  loadingMajors?: boolean;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  selectedCardForReview,
  fieldsToShow,
  formData,
  handleFormChange,
  handleFieldReview,
  selectedTab,
  dataFieldsMap,
  majorsList,
  loadingMajors,
}) => {
  console.log({ fieldsToShow });
  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-y-auto">
      <div className="space-y-3 sm:space-y-4">
        {selectedCardForReview ? (
          <>
            {fieldsToShow.map((fieldKey) => {
              const fieldData = selectedCardForReview.fields?.[fieldKey] || {};
              const label =
                ("actual_field_name" in fieldData && (fieldData as any).actual_field_name) ||
                FIELD_LABELS[fieldKey] ||
                dataFieldsMap.get(fieldKey) ||
                fieldKey.replace(/_/g, " ");
              const needsReview = !!(fieldData && (fieldData as any).requires_human_review);
              const isReviewed = !!(fieldData && (fieldData as any).reviewed);
              const reviewNotes = (fieldData && (fieldData as any).review_notes) || undefined;
              const showIcon = needsReview;
              let formattedValue = (fieldData && (fieldData as any).value) ?? "";
              if (fieldKey === "cell")
                formattedValue = formatPhoneNumber((fieldData && (fieldData as any).value) ?? "");
              if (fieldKey === "date_of_birth")
                formattedValue = formatBirthday((fieldData && (fieldData as any).value) ?? "");
              const tooltipContent =
                typeof reviewNotes === 'string' && reviewNotes.length > 0
                  ? reviewNotes
                  : needsReview ? "Needs human review" : null;
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
                    ) : fieldKey === "mapped_major" && Array.isArray(majorsList) && majorsList.length > 0 ? (
                      <Combobox
                        options={majorsList}
                        value={formData["mapped_major"] ?? ""}
                        onChange={(value) => handleFormChange("mapped_major", value)}
                        placeholder="Select Mapped Major"
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
            })}
          </>
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
