import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, X } from "lucide-react";
import { SchoolService } from "@/services/SchoolService";
import type { SuggestedCardField } from "@/api/supabase/schools";
import { toast } from "@/lib/toast";

interface SuggestedFieldsProps {
  schoolId: string;
  suggestions: SuggestedCardField[];
  /** Called after a successful accept/dismiss so the parent can refetch. */
  onChange: () => void | Promise<void>;
  /** "section" for the settings page, "banner" for the review modal. */
  variant?: "section" | "banner";
  /** When provided, only suggestions whose key is in this list are shown. */
  filterKeys?: string[];
}

/**
 * Renders discovered-field suggestions with Accept / Dismiss controls.
 * Used both on the Field Preferences settings page (variant="section") and in
 * the review modal when the current card has an unconfigured field
 * (variant="banner").
 */
export function SuggestedFields({
  schoolId,
  suggestions,
  onChange,
  variant = "section",
  filterKeys,
}: SuggestedFieldsProps) {
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const visible = (suggestions || []).filter(
    (s) => s && s.key && (!filterKeys || filterKeys.includes(s.key))
  );
  if (visible.length === 0) return null;

  const labelFor = (s: SuggestedCardField) =>
    s.label || SchoolService.generateDefaultLabel(s.key);

  const act = async (s: SuggestedCardField, action: "accept" | "dismiss") => {
    setPendingKey(s.key);
    try {
      if (action === "accept") {
        await SchoolService.acceptSuggestedField(schoolId, s.key);
        toast.success(`Added "${labelFor(s)}" to your card fields`);
      } else {
        await SchoolService.dismissSuggestedField(schoolId, s.key);
        toast.success(`Dismissed "${labelFor(s)}"`);
      }
      await onChange();
    } catch (e) {
      toast.error(
        action === "accept"
          ? "Failed to add field. Please try again."
          : "Failed to dismiss suggestion. Please try again."
      );
    } finally {
      setPendingKey(null);
    }
  };

  const isBanner = variant === "banner";

  return (
    <div
      className={
        isBanner
          ? "rounded-lg border border-amber-300 bg-amber-50 p-3"
          : "rounded-lg border border-indigo-200 bg-indigo-50/50 p-4"
      }
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles
          className={isBanner ? "h-4 w-4 text-amber-600" : "h-4 w-4 text-indigo-600"}
        />
        <span className="text-sm font-medium text-gray-900">
          {isBanner
            ? visible.length === 1
              ? "New field detected on this card"
              : `${visible.length} new fields detected on this card`
            : "Suggested fields"}
        </span>
      </div>
      {!isBanner && (
        <p className="text-xs text-gray-600 mb-3">
          These fields were found on scanned cards but aren't in your card fields
          yet. Adding one shows it on this and future cards, in the table, and in
          review.
        </p>
      )}
      <ul className="space-y-2">
        {visible.map((s) => (
          <li
            key={s.key}
            className="flex items-center justify-between gap-3 rounded-md bg-white border border-gray-200 px-3 py-2"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {labelFor(s)}
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {s.field_type || "text"}
                </span>
              </div>
              {s.sample_value ? (
                <div className="text-xs text-gray-500 truncate">
                  Example: {s.sample_value}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={pendingKey === s.key}
                onClick={() => act(s, "dismiss")}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Dismiss
              </Button>
              <Button
                size="sm"
                disabled={pendingKey === s.key}
                onClick={() => act(s, "accept")}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add field
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
