import { cn } from "@/lib/utils";

export interface PipelineCounts {
  review: number;
  ready: number;
  exported: number;
}

interface PipelineBarProps {
  counts: PipelineCounts;
  /** show the dot + count legend beneath the bar (default true) */
  showLegend?: boolean;
  className?: string;
}

const SEGMENTS: { key: keyof PipelineCounts; color: string; dot: string; label: string }[] = [
  { key: "review", color: "bg-status-review-solid", dot: "bg-status-review-solid", label: "review" },
  { key: "ready", color: "bg-status-ready-solid", dot: "bg-status-ready-solid", label: "ready" },
  { key: "exported", color: "bg-status-exported-solid", dot: "bg-status-exported-solid", label: "exported" },
];

/**
 * The per-event pipeline bar: an 8px rounded track segmented by proportion
 * (amber review → green ready → blue exported), with an optional legend.
 * An empty event renders a flat neutral track.
 */
export function PipelineBar({ counts, showLegend = true, className }: PipelineBarProps) {
  const total = counts.review + counts.ready + counts.exported;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {total > 0 &&
          SEGMENTS.map((seg) => {
            const value = counts[seg.key];
            if (value <= 0) return null;
            return (
              <div
                key={seg.key}
                className={cn("h-full", seg.color)}
                style={{ width: `${(value / total) * 100}%` }}
                aria-label={`${value} ${seg.label}`}
              />
            );
          })}
      </div>
      {showLegend && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
          {SEGMENTS.map((seg) => (
            <span key={seg.key} className="inline-flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", seg.dot)} aria-hidden />
              <span className="tabular-nums">{counts[seg.key]}</span> {seg.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
