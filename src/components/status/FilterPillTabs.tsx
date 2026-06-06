import * as React from "react";
import { cn } from "@/lib/utils";
import { STATUS_TONE, type StatusKey } from "./statusConfig";

export interface FilterPillTab {
  /** stable value used by the parent's selected state */
  value: string;
  label: string;
  count?: number;
  /** status tone for the active state; defaults to "archived" (neutral) */
  tone?: StatusKey;
}

interface FilterPillTabsProps {
  tabs: FilterPillTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Status-colored filter pills (the event-detail tabs). Inactive pills are
 * neutral gray outlines; the active pill picks up the soft bg + border + ink
 * of its status tone, signaling "you are filtered to this status".
 */
export function FilterPillTabs({ tabs, value, onChange, className }: FilterPillTabsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)} role="tablist">
      {tabs.map((tab) => {
        const active = tab.value === value;
        const tone = STATUS_TONE[tab.tone ?? "archived"];
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm whitespace-nowrap transition-colors duration-150",
              active
                ? cn(tone.pill, "font-bold")
                : "border-border bg-transparent text-muted-foreground hover:bg-muted/60 font-medium",
            )}
          >
            <span
              className={cn("h-2 w-2 rounded-full", active ? tone.dot : "bg-muted-foreground/40")}
              aria-hidden
            />
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "min-w-[1.25rem] rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums",
                  active ? "bg-white/70" : "bg-muted text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
