import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlagChipProps {
  count: number;
  className?: string;
}

/**
 * The amber flag chip shown in the Student cell when a card has fields the
 * AI flagged for human review. Replaces a separate Status column.
 */
export function FlagChip({ count, className }: FlagChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-status-review-border bg-status-review-soft px-2 py-0.5 text-[11px] font-semibold text-status-review-ink tabular-nums",
        className,
      )}
      title={`${count} field${count === 1 ? "" : "s"} need review`}
    >
      <Flag className="h-3 w-3" />
      {count}
    </span>
  );
}
