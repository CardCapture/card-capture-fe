import type { CardStatus } from "@/types/card";

/**
 * The four visual status tones from the design system. Every card/event
 * status maps onto one of these so colors stay consistent across the
 * events board, the card table, the tabs, and the review modal.
 *
 * Tailwind class names below are written out in full (never interpolated)
 * so the JIT compiler can see them. Colors come from the `status.*` tokens
 * defined in tailwind.config.ts / index.css.
 */
export type StatusKey = "review" | "ready" | "exported" | "archived";

/** Map the app's raw CardStatus union onto a visual tone. */
export function statusKeyForCard(status: CardStatus | string): StatusKey {
  switch (status) {
    case "reviewed":
      return "ready";
    case "exported":
      return "exported";
    case "archived":
      return "archived";
    // needs_review, processing, ai_failed all read as "needs attention" (amber)
    case "needs_review":
    case "processing":
    case "ai_failed":
    default:
      return "review";
  }
}

interface StatusToneClasses {
  /** soft bg + border + ink — for pills/chips on tinted surfaces */
  pill: string;
  /** solid color for the leading dot */
  dot: string;
  /** ink text color only */
  text: string;
  /** soft tint background only */
  softBg: string;
  /** border color only */
  border: string;
}

export const STATUS_TONE: Record<StatusKey, StatusToneClasses> = {
  review: {
    pill: "bg-status-review-soft border-status-review-border text-status-review-ink",
    dot: "bg-status-review-solid",
    text: "text-status-review-ink",
    softBg: "bg-status-review-soft",
    border: "border-status-review-border",
  },
  ready: {
    pill: "bg-status-ready-soft border-status-ready-border text-status-ready-ink",
    dot: "bg-status-ready-solid",
    text: "text-status-ready-ink",
    softBg: "bg-status-ready-soft",
    border: "border-status-ready-border",
  },
  exported: {
    pill: "bg-status-exported-soft border-status-exported-border text-status-exported-ink",
    dot: "bg-status-exported-solid",
    text: "text-status-exported-ink",
    softBg: "bg-status-exported-soft",
    border: "border-status-exported-border",
  },
  archived: {
    pill: "bg-status-archived-soft border-status-archived-border text-status-archived-ink",
    dot: "bg-status-archived-solid",
    text: "text-status-archived-ink",
    softBg: "bg-status-archived-soft",
    border: "border-status-archived-border",
  },
};

/** Default human labels per card status (used by pills/tabs). */
export const CARD_STATUS_LABEL: Record<string, string> = {
  needs_review: "Needs Review",
  reviewed: "Ready",
  exported: "Exported",
  archived: "Archived",
  ai_failed: "Needs Retry",
  processing: "Processing",
};
