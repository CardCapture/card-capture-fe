# Redesign Plan: Events Board, Card Detail, Review Modal

**Goal:** structurally delineate the Events board from the Card-detail table so users always know which level they're on, and bring the review modal + processing UI to the same visual system. Desktop + mobile in one effort. Source: `CardCapture Design System.zip` (Option A).

**Principle:** rebuild the mock's intent using our real stack (shadcn/ui, Tailwind, our CSS tokens, TanStack Table/Query). Prefer our tokens over the prototype's literal hex. Preserve existing behavior/features the mock omits.

---

## 0. Foundation (build first, shared by all screens)

These are the reusable pieces every screen leans on. Building them first keeps the three screens consistent.

1. **Status-color tokens** *(decided)*. Define HSL CSS variables in `index.css` (`--status-review-soft/-border/-ink/-solid`, etc.) and wire them into `tailwind.config` so we get ergonomic class names (`bg-status-review-soft`) + dark-mode support, matching the existing `--primary` pattern. Stops the ad-hoc `green-50/amber-50/...` hardcoding. Maps:
   - Needs review = amber (`#FEFCE8 / #FDE68A / #854D0E / #CA8A04`)
   - Ready = green (`#DCFCE7 / #BBF7D0 / #15803D / #16A34A`)
   - Exported = blue (white / `#BFDBFE` / `#0C56BC` / primary)
   - Archived = slate (`#F1F5F9 / #CBD5E1 / #64748B`)
   - AI-failed (ours, not in mock) = amber "Needs Retry" tone
2. **`<StatusPill>`** component (CVA variants by status) — used in the card table's Student cell, the header band chips, and the detail tabs.
3. **`<FilterPillTabs>`** — status-colored pill tab row (inactive = gray outline + count badge; active = soft bg + border + ink of that status). Replaces the custom button tabs in EventDetails and the segmented control logic.
4. **`<PipelineBar>`** — 8px rounded segmented bar (amber→green→blue over slate track) + legend. Used on event cards.
5. **`<InitialsAvatar>`** — 34px circle, initials from first+last, 4-color palette keyed by name. (shadcn `Avatar` exists; wrap it.)
6. **`<FlagChip>`** — amber pill with flag glyph + count, for the Student cell trailing indicator.

No new dependencies needed: `class-variance-authority`, `lucide-react`, `framer-motion`, shadcn `Avatar/Badge/Skeleton` all already present.

---

## 1. Events Board — `EventsHome.tsx` (table → card grid)

Currently a 1,265-line TanStack table. Rebuild the list region as a grid; keep all data/logic.

**Keep as-is (data layer):** `useEvents(schoolId)`, `EventWithStats.stats { total_cards, needs_review, ready_for_export, exported, archived }`, route nav `handleViewEvent` → `/events/:id`, `CreateEventModal`, tab categorization (upcoming/completed/archived), search, sort.

**Rebuild (UI):**
- **Header row:** `<h1>` "Your Events" + subtitle + **Create Event** primary button (top-right).
- **Controls row:** **Segmented control** (Upcoming / Completed / Archived with counts) replacing the badge-pills + secondary tabs. **Sort dropdown** (Date / Name / Needs review) — replaces sort-by-column-header. **Search** input with clear-✕.
- **Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]`, 12-item cap with "Show all N" / "Show less".
- **`<EventCard>`** (new component, min-height 188px, amber border when `needs_review > 0`): header (name + date + location + total-cards chip) → `<PipelineBar>` → legend → divider → footer (status line + "Open ›"). Whole card navigates to detail.
- **Empty/loading states:** per-tab empty states + 6 `<Skeleton>` cards.

**Board bulk actions** *(decided: Select mode)*: a **"Select" toggle** in the controls row reveals checkboxes on the event cards, enabling the existing bulk Archive (and Delete on the Archived tab) and a selection action bar. Exiting Select mode hides the checkboxes and clears selection.

**Mobile:** single-column stack of uniform fixed-height (128px) cards, sticky header (title + round + button), search, segmented filter. (Bottom tab bar already exists in app nav.)

---

## 2. Event Detail — `EventDetails.tsx` + `cards/CardTable.tsx`

The delineator. Add the tinted header band + pill tabs + consolidated Student cell.

**Tinted header band** (replaces the current `Card`-wrapped `EventHeader` styling):
- `linear-gradient(120deg, #EFF6FF, #F4F8FF)`, border `#BFDBFE`, radius 18, padding 24.
- Left: title (26/800) + pencil edit + date + location. Right: **Export** primary button.
- Below: four `<StatusPill>` chips — Needs Review (amber) / Ready (green) / Exported (blue) / Archived (slate). Counts from existing `getStatusCount`.
- **Processing status** (`CompactProcessingStatus`) relocated into/under the band, restyled to new tokens (see §4).

**Filter-pill tabs** (`<FilterPillTabs>`) replacing the custom button tabs:
- Needs Review (amber) / Ready to Export (green) / Archived (slate), plus conditional **Needs Retry** (`ai_failed`, amber) when count > 0. Exported stays folded into Ready via the existing **Hide Exported** switch.

**Toolbar:** Search cards… input + Hide-Exported switch (Ready tab only) on the left; **Add Card** dropdown (Capture / Import / Scan QR / [Sign-up Sheet] / Manual — already implemented) on the right, restyled to the mock's tinted-icon-tile menu rows.

**Card table** (`CardTable.tsx`) — the consolidation:
- **New `Student` cell** (sticky, 244px): `<InitialsAvatar>` + "First Last" (truncate) + trailing indicator — `<FlagChip>` (⚑ N) when the row has flagged fields, else `<StatusPill>`. **Remove the separate Status column** (its info now lives here).
- **Sticky columns:** checkbox (left:0) + Student (left:44), sticky header row, horizontal scroll preserved. Sticky cells inherit row bg.
- **Remaining columns stay dynamic** (`reviewFieldOrder`, school-configured). The name sub-fields (first/last/preferred) collapse into the Student cell and are dropped from the column list; everything else renders as today.
- **Flagged field cells:** amber tint (`rgba(202,138,4,.07)`, text `#854D0E`, 600) on the specific flagged field via `requires_human_review` — replacing today's red `!` badge. Phone/birthday use `tabular-nums`.
- **Row click** → review modal (unchanged trigger). Hover `#F8FAFC`, selected `#EFF6FF`.

**Bulk action bar:** already sticky + tab-aware (Export CSV/Slate, Archive, Move, Delete, Retry AI). Restyle to mock (`#EFF6FF` bg, `#BFDBFE` border, blue-ink count). Keep all existing actions.

**Pagination:** keep; restyle to "Rows per page: N · M total" + "Page X of Y" Prev/Next.

**Mobile:** table collapses to stacked **record cards** (avatar + name + trailing flag/status, email, phone, address; flagged values amber). Tap → bottom-sheet review (shadcn `Sheet`/`Drawer`, both present).

---

## 3. Review Modal — `review/ReviewForm.tsx` + modal in `EventDetails.tsx`

Already a two-column shadcn `Dialog` (image left, form right). Restyle, don't rebuild.

- **Header summary:** swap "N/M fields reviewed" for the mock's chip — amber **"N fields need attention"** (info icon) when flagged, else green **"All fields look good"** (check).
- **Flagged fields:** change today's **red** treatment to **amber** — amber "REVIEW" tag by the label, amber border + soft amber bg + amber focus ring, amber note below sourced from `FieldDetail.review_notes` (e.g. "Low confidence — confirm the ZIP").
- **Layout:** Name / Birthday / Email / Phone / Address, then City / State / Zip in a row (match mock grouping where our dynamic fields allow).
- **Image panel:** **keep our richer `ReviewImagePanel`** (zoom/rotate/pan, QR fallback) — superior to the mock's static placeholder.
- **Footer:** Archive Card (red outline) + Save Changes (blue) — already present.
- **Mobile:** existing responsive Dialog → on phones, present as bottom-sheet per mock (stacked fields, same amber treatment).

---

## 4. Processing UI (keep behavior, restyle + mobile)

- **`CompactProcessingStatus`** — restyle to new tokens, reposition within the header band, verify mobile (queued/processing/failed counts, progress bar, Retry/Stop/Dismiss).
- **`AIFailureBanner`** (in review form) — already amber; align radius/spacing/typography to the system, confirm mobile stacking.
- **`ScanStatusCard`** — align stat tiles to the status-color tokens.

No logic changes; `useProcessingStatus` polling/subscription untouched.

---

## 5. Sequencing

1. **Foundation** (§0): tokens + shared components (StatusPill, FilterPillTabs, PipelineBar, InitialsAvatar, FlagChip). Build + visually sanity-check in isolation.
2. **Event Detail** (§2): header band, pill tabs, Student-cell consolidation, sticky columns, flagged-cell amber, toolbar/bulk/pagination restyle. *(Highest-impact for the delineation.)*
3. **Review Modal** (§3): amber treatment + summary chip + notes.
4. **Processing UI** (§4): restyle the three components.
5. **Events Board** (§1): table → grid, segmented control, sort dropdown, EventCard, empty/loading.
6. **Mobile pass**: record cards, bottom-sheet review, uniform mobile event cards — verified at each step but hardened here.
7. **QA:** run `npm run dev`, click through both tables + review + processing on desktop and a mobile viewport; `npm run lint`; `npm run test:unit`.

Each numbered step is independently reviewable; I'll pause for your look after Foundation + Event Detail before continuing.

## 6. Resolved decisions
1. **Board bulk actions** — ✅ "Select" mode toggle reveals card checkboxes for bulk Archive/Delete.
2. **Status tokens** — ✅ HSL CSS vars in `index.css` + `tailwind.config` mapping (matches `--primary`, supports dark mode, ergonomic class names).
3. **Scope** — ✅ Build the mock as specced in full (incl. "Sort: Needs review", 12-item show-all cap, mobile bottom-sheet).
