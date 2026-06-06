import { CalendarDays, Camera, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PipelineBar } from "@/components/status/PipelineBar";
import type { EventWithStats } from "@/types/event";

interface EventCardProps {
  event: EventWithStats;
  onOpen: (event: EventWithStats) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

/** Parse a YYYY-MM-DD string as a local date (no timezone shift) and format. */
function formatShortDate(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * An event tile in the board grid. Equal height, amber border when work is
 * pending, a pipeline bar + legend, and a footer status line. The whole card
 * opens the event; in select mode it toggles selection instead.
 */
export function EventCard({
  event,
  onOpen,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: EventCardProps) {
  const s = event.stats;
  const needsReview = s.needs_review || 0;
  const total = s.total_cards || 0;

  const handleClick = () => {
    if (selectMode) onToggleSelect?.(event.id);
    else onOpen(event);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cn(
        "group relative flex min-h-[188px] cursor-pointer flex-col rounded-2xl border bg-card p-5 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg",
        needsReview > 0 ? "border-status-review-border" : "border-border",
        selected && "ring-2 ring-status-exported-solid",
      )}
    >
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(event.id)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-4 top-4 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-0"
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[17px] font-bold tracking-tight text-foreground">
            {event.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{formatShortDate(event.date)}</span>
          </div>
        </div>
        {!selectMode && (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {total} {total === 1 ? "card" : "cards"}
          </span>
        )}
      </div>

      {/* Pipeline bar + legend */}
      <div className="mt-4">
        <PipelineBar
          counts={{
            review: needsReview,
            ready: s.ready_for_export || 0,
            exported: s.exported || 0,
          }}
        />
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <div className="my-3 border-t border-border" />
        <div className="flex items-center justify-between text-sm">
          {needsReview > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-status-review-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-status-review-solid" />
              {needsReview} need review
            </span>
          ) : total > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-status-ready-ink">
              <CheckCircle2 className="h-4 w-4" /> All reviewed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Camera className="h-4 w-4" /> Ready to scan
            </span>
          )}
          <span className="inline-flex items-center gap-0.5 font-semibold text-status-exported-solid">
            Open <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
