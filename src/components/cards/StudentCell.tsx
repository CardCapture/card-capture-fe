import { InitialsAvatar } from "@/components/status/InitialsAvatar";
import { FlagChip } from "@/components/status/FlagChip";
import type { ProspectCard } from "@/types/card";

interface StudentCellProps {
  card: ProspectCard;
}

/** Pull a display name out of a card's dynamic fields. */
function readName(card: ProspectCard): { first: string; last: string; full: string } {
  const f = card.fields || {};
  const val = (k: string) => {
    const raw = (f as Record<string, { value?: string }>)[k]?.value;
    return typeof raw === "string" ? raw.trim() : "";
  };
  const first = val("first_name") || val("preferred_first_name");
  const last = val("last_name");
  const combined = `${first} ${last}`.trim();
  const full = combined || val("name") || "Unknown";
  return { first, last, full };
}

/** Count fields the AI flagged for human review that haven't been resolved. */
function flagCount(card: ProspectCard): number {
  return Object.values(card.fields || {}).filter((fd) => {
    const f = fd as { requires_human_review?: boolean; reviewed?: boolean };
    return f?.requires_human_review === true && f?.reviewed !== true;
  }).length;
}

/**
 * The consolidated Student cell: avatar + name + a single trailing indicator.
 * The status is already conveyed by the active tab, so we don't repeat it as a
 * pill — the only trailing marker is the amber flag chip when fields still need
 * review. Replaces the separate Status column.
 */
export function StudentCell({ card }: StudentCellProps) {
  const { first, last, full } = readName(card);
  const flags = flagCount(card);

  return (
    <div className="flex w-[244px] items-center gap-2.5">
      <InitialsAvatar first={first} last={last} name={full} />
      <span className="min-w-0 flex-1 truncate font-semibold text-foreground" title={full}>
        {full}
      </span>
      {flags > 0 && (
        <span className="flex-shrink-0">
          <FlagChip count={flags} />
        </span>
      )}
    </div>
  );
}
