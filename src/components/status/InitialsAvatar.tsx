import { cn } from "@/lib/utils";

interface InitialsAvatarProps {
  first?: string;
  last?: string;
  /** fallback when first/last are empty (e.g. full name string) */
  name?: string;
  className?: string;
}

/** 4-color soft palette keyed by name (blue / indigo / green / amber). */
const PALETTE = [
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

function initialsFrom(first?: string, last?: string, name?: string): string {
  const f = (first || "").trim();
  const l = (last || "").trim();
  if (f || l) return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || "?";
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function paletteIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % PALETTE.length;
}

/**
 * The Student-cell avatar: a 34px circle with name initials on a soft tint
 * deterministically chosen from a 4-color palette so the same person always
 * gets the same color.
 */
export function InitialsAvatar({ first, last, name, className }: InitialsAvatarProps) {
  const initials = initialsFrom(first, last, name);
  const seed = `${first || ""}${last || ""}${name || ""}` || initials;
  const palette = PALETTE[paletteIndex(seed)];
  return (
    <span
      className={cn(
        "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        palette,
        className,
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
