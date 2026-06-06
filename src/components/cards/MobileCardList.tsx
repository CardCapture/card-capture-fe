import { InitialsAvatar } from "@/components/status/InitialsAvatar";
import { FlagChip } from "@/components/status/FlagChip";
import { cn, formatPhoneNumber } from "@/lib/utils";
import type { ProspectCard } from "@/types/card";

interface MobileCardListProps {
  cards: ProspectCard[];
  onRowClick: (card: ProspectCard) => void;
  bulkSelection: {
    isSelected: (documentId: string) => boolean;
    toggleSelection: (documentId: string) => void;
    selectedCount: number;
  };
}

function fieldVal(card: ProspectCard, key: string): string {
  const raw = (card.fields as Record<string, { value?: string }>)?.[key]?.value;
  return typeof raw === "string" ? raw : "";
}

function isFlagged(card: ProspectCard, key: string): boolean {
  const fd = (card.fields as Record<string, { requires_human_review?: boolean; reviewed?: boolean }>)?.[key];
  return !!fd?.requires_human_review && fd?.reviewed !== true;
}

function readName(card: ProspectCard) {
  const first = fieldVal(card, "first_name") || fieldVal(card, "preferred_first_name");
  const last = fieldVal(card, "last_name");
  const full = `${first} ${last}`.trim() || fieldVal(card, "name") || "Unknown";
  return { first, last, full };
}

function flagCount(card: ProspectCard): number {
  return Object.values(card.fields || {}).filter((fd) => {
    const f = fd as { requires_human_review?: boolean; reviewed?: boolean };
    return f?.requires_human_review === true && f?.reviewed !== true;
  }).length;
}

/**
 * Phone layout for the card table: each card becomes a stacked record card
 * (avatar + name + flag chip, then email / phone / address with flagged values
 * tinted amber). Tapping opens the review sheet. Shown only below `sm`.
 */
export function MobileCardList({ cards, onRowClick, bulkSelection }: MobileCardListProps) {
  const selecting = bulkSelection.selectedCount > 0;
  return (
    <div className="flex flex-col gap-3 sm:hidden">
      {cards.map((card) => {
        const { first, last, full } = readName(card);
        const flags = flagCount(card);
        const email = fieldVal(card, "email");
        const phone = fieldVal(card, "cell");
        const address = fieldVal(card, "address");
        const selected = bulkSelection.isSelected(card.document_id);
        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => onRowClick(card)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onRowClick(card);
            }}
            className={cn(
              "rounded-xl border bg-card p-4 shadow-sm transition-colors",
              selected ? "border-status-exported-border bg-status-exported-soft" : "border-border",
            )}
          >
            <div className="flex items-center gap-3">
              {selecting && (
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => bulkSelection.toggleSelection(card.document_id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600"
                />
              )}
              <InitialsAvatar first={first} last={last} name={full} />
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                {full}
              </span>
              {flags > 0 && <FlagChip count={flags} />}
            </div>

            <div className="mt-3 space-y-1.5 text-sm">
              {email && (
                <div
                  className={cn(
                    "truncate",
                    isFlagged(card, "email")
                      ? "font-semibold text-status-review-ink"
                      : "text-muted-foreground",
                  )}
                >
                  {email}
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                {phone && (
                  <span
                    className={cn(
                      "tabular-nums",
                      isFlagged(card, "cell")
                        ? "font-semibold text-status-review-ink"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatPhoneNumber(phone)}
                  </span>
                )}
                {address && (
                  <span
                    className={cn(
                      "ml-auto truncate text-right",
                      isFlagged(card, "address")
                        ? "font-semibold text-status-review-ink"
                        : "text-muted-foreground",
                    )}
                  >
                    {address}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
