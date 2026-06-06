import { cn } from "@/lib/utils";

export interface SegmentedTab {
  value: string;
  label: string;
  count?: number;
}

interface SegmentedProps {
  tabs: SegmentedTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Segmented control (events board filter): a pill track where the active
 * segment is a white raised pill. The count is brand-blue when active.
 */
export function Segmented({ tabs, value, onChange, className }: SegmentedProps) {
  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-xl bg-muted p-1", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={cn(
                  "text-xs font-semibold tabular-nums",
                  active ? "text-status-exported-solid" : "text-muted-foreground/70",
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
