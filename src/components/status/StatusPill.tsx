import * as React from "react";
import { cn } from "@/lib/utils";
import { STATUS_TONE, type StatusKey } from "./statusConfig";

interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusKey;
  label: string;
  /** optional count shown in a trailing mini-badge */
  count?: number;
  /** optional leading icon (lucide). Replaces the default dot when provided. */
  icon?: React.ReactNode;
  /** show the leading status dot (default true unless an icon is given) */
  withDot?: boolean;
  size?: "sm" | "md";
}

/**
 * A soft, status-colored pill used for the header-band status chips and the
 * Student-cell status indicator. Color comes from the shared status tokens.
 */
export const StatusPill = React.forwardRef<HTMLSpanElement, StatusPillProps>(
  ({ status, label, count, icon, withDot, size = "md", className, ...props }, ref) => {
    const tone = STATUS_TONE[status];
    const showDot = withDot ?? !icon;
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap tabular-nums",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          tone.pill,
          className,
        )}
        {...props}
      >
        {icon ? (
          <span className="flex items-center [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        ) : showDot ? (
          <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden />
        ) : null}
        <span>{label}</span>
        {typeof count === "number" && (
          <span className="ml-0.5 rounded-full bg-white/70 px-1.5 text-[11px] font-semibold">
            {count}
          </span>
        )}
      </span>
    );
  },
);
StatusPill.displayName = "StatusPill";
