---
phase: 1
slug: stabilize
status: draft
shadcn_initialized: false
preset: not applicable
created: 2026-05-13
---

# Phase 1 — UI Design Contract: Stabilize Carrier Onboarding

> Visual and interaction contract for finishing the 6-phase carrier onboarding portal. Extends — does NOT redesign — the conversational-form shell that already exists at `hussle-app-dispatch-ui/src/components/ConversationalForm/` and `features/carrier-portal/components/PortalLayout/`. The two authoritative visual references are `.planning-legacy/carrier-onboarding/designs/interview-shell.md` and `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` — every spec below traces to those plus the existing in-tree implementation.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (MUI v5 is the established system) |
| Preset | not applicable |
| Component library | MUI v5 (`@mui/material`, `@mui/lab`, `@mui/icons-material`) + `@ant-design/icons` (secondary icon set) |
| Icon library | `@ant-design/icons` primary; `@mui/icons-material` for stepper/check states; `lucide-react` already in deps but not required for Phase 1 |
| Font | Plus Jakarta Sans (`@fontsource/plus-jakarta-sans`) — already wired through the MUI theme |
| Styling mechanism | MUI `sx` prop only. `styled()` from `@mui/material/styles` allowed for reused styled components. No styled-components, no Tailwind, no inline `style={{}}`, no `makeStyles`. |
| Source of color/typography tokens | The MUI theme at `hussle-app-dispatch-ui/src/themes/`. Reference tokens (`primary.main`, `success.main`, `error.main`, `grey.*`, `text.primary`, `text.secondary`) — do not introduce new palette entries for Phase 1. |

**No `@mocho/ui` shared package.** The stale CLAUDE.md reference to `@mocho/ui/components/form-fields` does not resolve; all form fields used in Phase 1 come from MUI directly or from `src/components/ConversationalForm/` and `src/features/carrier-portal/components/`.

**Existing semantic Typography helpers** (`components/Typography/`) are available and should be used where they fit — `PageTitle`, `SectionTitle`, `BodyMuted`, `BodyStrong`, `KpiLabel`, `Meta`, `AmountDisplay`. Phase 1 introduces no new typography helpers.

---

## Spacing Scale

Inherits the MUI 8-point spacing scale (`theme.spacing(n)` = `n * 8px`). All `sx` values below resolve through the theme — use the numeric token, not raw pixels.

| Token | Value | Usage in Phase 1 |
|-------|-------|------------------|
| 0.5 | 4px | Icon gaps, tile grid gap on `StateGrid` |
| 1 | 8px | Pill chip horizontal padding, sub-question category-tag margin |
| 2 | 16px | Default vertical rhythm between question rows, expense-tile inner padding, `mb` on legend |
| 3 | 24px | Sub-question left indent (already implemented), result card inner padding, footer bar vertical padding |
| 4 | 32px | Section gaps in `PortalLayout`, gap between break-even card and minimum-rate card |
| 6 | 48px | Phase-divider vertical margin (above + below), result-card top padding from viewport edge |
| 8 | 64px | Result-card outer max-width breathing room on desktop |

**Hard-coded pixel exceptions (justified):**
- `StateGrid` tile: `width: 48, height: 48` — minimum touch target for phone use (matches Apple HIG 44px floor with margin).
- `PortalFooterBar` continue button: minimum height `48px` — primary CTA must be thumb-reachable.
- `interview-shell` content column `maxWidth: 680px` — narrative readability for the conversational thread.
- `CostResultCard` content `maxWidth: 700px` — matches legacy reference.
- Header bar height `56px` — preserves the existing `PortalHeader` height.
- Progress bar height `4px` — matches `interview-shell.md` spec.

---

## Typography

The MUI theme is the source of truth. Phase 1 declares the *roles* used and the size/weight pairing each role resolves to. Do not invent new variants.

| Role | Size | Weight | Line Height | MUI Token / Helper | Used For |
|------|------|--------|-------------|--------------------|----------|
| Body | 16px | 400 | 1.5 | `Body` helper / `body1` | Conversational thread default copy, hint text body |
| Body strong | 16px | 600 | 1.4 | `BodyStrong` helper | Answered-card value, sub-answer value |
| Body muted | 14px | 400 | 1.5 | `BodyMuted` / `body2` color `text.secondary` | Hints, disclaimers, "Saving…" indicator |
| Meta / overline | 12px | 700 (uppercase, letter-spacing 1px) | 1.4 | `Meta` / `KpiLabel` / `overline` | Phase breadcrumb ("EQUIPMENT"), category tags ("DOT REGISTRATION — REQUIRED"), result-card labels ("YOUR BREAK-EVEN RATE PER MILE") |
| Question (active) | 20px | 600 | 1.3 | `sx={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}` | Active question label in the thread |
| Sub-question (active) | 18px | 600 | 1.3 | Already implemented in `SubQuestion.tsx` | Sub-question label |
| Result heading | 30px | 700 | 1.2 | `sx={{ fontSize: { xs: 24, sm: 30 }, fontWeight: 700, lineHeight: 1.2 }}` | "Here's your real cost picture, {firstName}." |
| Result value (break-even) | 48px | 700 | 1.0 | `sx={{ fontSize: { xs: 36, sm: 48 }, fontWeight: 700, lineHeight: 1 }}` | "$1.94" animated value |
| Result value (minimum rate) | 60px | 700 | 1.0 | `sx={{ fontSize: { xs: 44, sm: 60 }, fontWeight: 700, lineHeight: 1 }}` color `success.light` | "$2.44" animated value |
| Expense tile value | 24px | 700 | 1.2 | `sx={{ fontSize: 24, fontWeight: 700 }}` | Monthly Fixed / Variable / Fuel-per-mile values |

Only **4 effective sizes** in the conversational thread (body 16, sub 18, question 20, meta 12) plus **3 display sizes** reserved exclusively for `CostResultCard` (heading 30, break-even 48, minimum rate 60). The result-card display sizes do not bleed into any other surface.

Only **2 weights** in regular use: 400 (regular) and 600 (semibold). 700 (bold) is reserved for the result-card heading + value displays and `Meta`/category tags.

---

## Color

Phase 1 uses the existing MUI palette tokens — no new palette entries. The 60/30/10 split below describes Phase-1 surfaces.

| Role | MUI Token | Hex (reference) | Usage |
|------|-----------|-----------------|-------|
| Dominant (60%) | `background.default` / `grey.50` | `#FAFAFB` | `PortalLayout` page background — the calm conversational canvas |
| Surface (30%) | `background.paper` / `#FFFFFF` | `#FFFFFF` | Question thread cards, answered-card backgrounds, header bar, footer bar |
| Accent (10%) | `primary.main` | (theme blue, ~`#3B82F6`) | Selected pill chip fill, primary CTA fill, stepper "active" dot, progress-bar fill, "Edit" link text, sub-question blue left border (compliance/required) |
| Success accent | `success.main` / `success.light` | ~`#22C55E` / `#86EFAC` | `StateGrid` "PREFERRED" tile, sub-question green left border (optional), `CostResultCard` minimum-rate value, "Continue" CTA on `CostResultCard` |
| Destructive | `error.main` / `error.light` | ~`#EF4444` / `#FCA5A5` | `StateGrid` "AVOIDED" tile, sub-question red left border (compliance flag), validation snackbar tint, error helper text |
| Neutral border | `grey.200` / `grey.300` / `grey.400` | — | Card borders, unselected pill chip border, stepper inactive dot, sub-question grey left border (neutral follow-up) |

**Accent reserved for** (explicit list — never "all interactive elements"):
1. Primary CTA button fill (`Continue` / `Save & Continue` in `PortalFooterBar`)
2. Selected `PresetTileSelector` chip (filled state)
3. Selected `YesNoInput` button (existing pattern — keep)
4. Active phase dot in `PortalStepper`
5. Progress-bar fill (bottom of viewport)
6. "Edit" link text on collapsed answered cards
7. Sub-question blue left border + matching tag color (required compliance info)
8. Active-tab indicator if used (not introduced in Phase 1)

**Result-card dark surface (one-off):**
- `CostResultCard` uses `bgcolor: '#0F172A'` (slate-900) full-viewport — matches `interview-cost-analysis.md` reference exactly. Text on this surface uses `color: 'common.white'` for the heading + values, `color: 'grey.300'` (`#D1D5DB`) for body subtext, `color: 'grey.400'` (`#9CA3AF`) for the label overlines and disclaimer. The minimum-rate value uses `color: 'success.light'` (~`#86EFAC`) so it pops against the dark surface — this is the only place green is used as a primary display value. The result card's "Continue →" CTA is `color: 'success.main'` filled with white text (full-width on mobile, 280px max on desktop).

**Border-color semantics for `SubQuestion` / `SubAnswer`** (already implemented — confirm during execution):
| Color prop | MUI token | Semantic |
|------------|-----------|----------|
| `blue` | `info.main` | Required compliance / DOT-style info |
| `green` | `success.main` | Optional follow-up |
| `red` | `error.main` | Compliance flag requiring attention |
| `grey` | `grey.400` | Neutral follow-up |

---

## Copywriting Contract

All carrier-facing copy in Phase 1. Tone: **direct, calm, second-person, no jargon, no exclamation marks**. Carrier is on a phone, possibly mid-shift — copy should read like a dispatcher you trust.

### Phase labels (`features/carrier-portal/constants.ts` — STAB-04, STAB-13)

| Index | `PHASE_LABELS` string | Header breadcrumb (uppercase) |
|-------|----------------------|-------------------------------|
| 1 | `Company` | `COMPANY` |
| 2 | `Equipment` | `EQUIPMENT` |
| 3 | `Drivers` | `DRIVERS` |
| 4 | `Cost Analysis` | `COST ANALYSIS` |
| 5 | `Lane Preferences` | `LANE PREFERENCES` |
| 6 | `Documents` | `DOCUMENTS` |

`TOTAL_PHASES = 6`. Both `CarrierPortalPage` and `PortalLayout` must import from this constant — no duplicated arrays.

### Buttons & primary CTAs

| Element | Copy | Notes |
|---------|------|-------|
| Phase-advance CTA (phases 1–5) | `Save & Continue` | One label across all non-final phases. Saving spinner replaces text while in flight. |
| Final-phase CTA (phase 6, Documents) | `Submit onboarding` | Triggers `completeOnboarding` API dispatch (STAB-03). |
| `CostResultCard` CTA | `This looks right — Continue →` | Verbatim from `interview-cost-analysis.md`. Right-arrow is part of the label, not an icon. |
| Back button | `Back` | Hidden on phase 1; shown phases 2–6. |
| `PortalFooterBar` save-exit secondary | `Save & exit` | Already implemented; existing `ConfirmDialog` copy is preserved. |
| `PresetTileSelector` custom-affordance | `Custom` chip → reveals inline input below — no separate modal | Existing pattern — keep. |
| "Edit" link on answered card | `Edit` | Existing pattern. |

### Saving / progress indicators

| State | Copy | Mechanism |
|-------|------|-----------|
| Auto-saving in flight | `Saving…` | `PortalHeader` `savingAnswer` selector; subtle, near top-right; fades 400ms after success. |
| Just saved (within 4s) | `Saved {Xs ago}` or `Saved just now` | Same surface; `lastSavedAt` selector. |
| Save failed (auto-save) | `Changes not saved — check your connection` | Warning bar just below `PortalHeader`, persists until next successful save. Variant: `notistack` `warning` is too noisy for autosave; use the persistent bar pattern from `interview-shell.md`. |

### Validation feedback (STAB-02)

| State | Copy | Mechanism |
|-------|------|-----------|
| User taps `Save & Continue` with errors | `Please answer the highlighted questions before continuing.` | `notistack` `enqueueSnackbar(message, { variant: 'warning', anchorOrigin: { vertical: 'top', horizontal: 'center' }, autoHideDuration: 4000 })`. |
| Field-level helper text | Whatever the per-question Yup schema returns — keep existing messages, do not change copy in Phase 1. | `FormHelperText` already wired in `InputRendererWithError`. |
| Scroll-to-first-error behavior | After `validateForm()` returns errors and `setTouched(allTouched)` is called, find the first field id in `errors` whose DOM node carries `[data-question-id="{id}"]` (already present on `SubQuestion`; question cards must expose the same attribute), `el.scrollIntoView({ behavior: 'smooth', block: 'center' })`, focus the input if it accepts focus. Respect `prefers-reduced-motion` — if reduced, use `block: 'center'` with `behavior: 'auto'`. |

The snackbar is the **only** validation notification; do not add a banner or inline summary at the top of the form. Snackbar fires *once per failed Continue tap* — do not stack duplicates.

### Empty / loading / error states

| Surface | State | Copy / Visual |
|---------|-------|---------------|
| Portal initial load | Loading | 2–3 skeleton question cards (`Skeleton` from MUI, `variant="rectangular"`, height ~120, `borderRadius: 1`, `sx={{ my: 2 }}`). Use existing `SkeletonLoader` if present in `components/SkeletonLoader/`. |
| Portal resume | First view after reload | No copy. Auto-scrolls to the first unanswered question; all prior answers shown collapsed above. |
| Network error on save | Inline | Persistent warning bar below header: `Changes not saved — check your connection.` Auto-retry on next field change. |
| Phase save in flight | CTA state | `Save & Continue` button: `loading` prop true → MUI `CircularProgress` (size 20, color `inherit`) replaces text, button `aria-busy="true"`, disabled. |
| Final-phase submit success | Post-submit | Existing `PortalCompleteView` renders — Phase 1 reuses what's there. No new copy required from this spec. |
| `CostResultCard` calculating | Pre-numbers-settled | Show "0.00" then count up; no separate loading state — see Animations below. |

### Destructive actions

Phase 1 has **no destructive actions on the carrier-facing portal**. The only confirmation-style interaction is the existing "Save & exit" `ConfirmDialog` which is informational, not destructive. No "Delete answer" / "Reset phase" actions are introduced — out of scope.

### Sub-question category tags (existing pattern, examples used in Phase 1 schemas)

| Use case | Border color | Category tag copy |
|----------|--------------|-------------------|
| DOT info confirmation | `blue` | `DOT REGISTRATION — REQUIRED` |
| MC authority detail | `green` | `MC AUTHORITY — OPTIONAL` |
| Insurance lapsed flag | `red` | `INSURANCE — ATTENTION` |
| Generic follow-up | `grey` | (no tag — just hint text) |

---

## Component Inventory — Phase 1 Deliverables

The executor builds or finishes the components below. Each row maps to a STAB requirement.

### A. New components (build from scratch)

| Component | Path | STAB | Visual contract |
|-----------|------|------|-----------------|
| `CostResultCard` | `features/carrier-portal/components/CostResultCard/index.tsx` | STAB-08 | Dark `#0F172A` full-viewport surface, centered `maxWidth: 700px`, single-column. Order: overline `COST ANALYSIS COMPLETE` (12 / 700 / grey.400) → heading 30/700/white → subtext 16/400/grey.300 → break-even card (dark elevated, value 48/700/white, animated count-up from $0 over 1500ms ease-out) → minimum-rate card (slightly more elevated, value 60/700/success.light, count-up starts 300ms after break-even) → 3-tile expense breakdown (Monthly Fixed / Monthly Variable / Fuel Cost/Mile — value 24/700/white, label 13/400/grey.400; fade-in as group 600ms after numbers settle) → disclaimer 14/400/grey.400 max-width 600 → success.main CTA `This looks right — Continue →` full-width on mobile, 280px max on desktop. **`prefers-reduced-motion`:** skip all count-up + fade animations, render final values immediately. Receives `{ answers, firstName, onContinue }` props; computes break-even RPM + minimum booking rate inline (formula source: legacy design). |

### B. Components that already exist and need verification/wiring (no visual changes unless gaps found)

| Component | Path | STAB | Status |
|-----------|------|------|--------|
| `PresetTileSelector` | `features/carrier-portal/components/PresetTileSelector/index.tsx` | STAB-07 | **Built.** Pill chips via MUI `Chip` filled/outlined; Custom chip reveals inline number input. Executor must: (1) wire it into `InputRenderer` `presetTiles` case (currently a placeholder — STAB-12); (2) verify currency presets render with `$` prefix when a question opts in; (3) confirm touch target ≥ 32px height (default MUI `Chip` is 32 — acceptable on phone with the 8px gap). |
| `StateGrid` | `features/carrier-portal/components/StateGrid/index.tsx` | STAB-10 | **Built.** 48×48 tiles, 3-state cycle Neutral → Preferred → Avoided → Neutral, legend strip above grid. Already imported by `InputRenderer` `stateGrid` case. Executor must: (1) verify cycle order matches the spec (neutral start, removes key from object on neutral); (2) add `role="button"` + `aria-pressed` + `aria-label="{stateCode} preference: {Neutral|Preferred|Avoided}, tap to cycle"` for screen readers; (3) verify legend uses `Meta` typography helper (already does). |
| `SubQuestion` | `components/ConversationalForm/SubQuestion.tsx` | STAB-11 | **Built.** 4px `borderLeft` in blue/green/red/grey via MUI tokens. Verify `data-question-id` attribute is present (it is — line 36 of file) — this attribute is what scroll-to-error depends on. |
| `SubAnswer` | `components/ConversationalForm/SubAnswer.tsx` | STAB-11 | **Built.** Same border-color tokens, tinted background. Indented `ml: 4`. No changes required for Phase 1. |
| `PortalLayout` | `features/carrier-portal/components/PortalLayout/index.tsx` | STAB-04, STAB-13 | Replace the inline `PHASES = ['Company', 'Equipment', 'Drivers', 'Documents']` array (line 18) with import from `features/carrier-portal/constants.ts`. |
| `PortalStepper` | `features/carrier-portal/components/PortalStepper/index.tsx` | STAB-13 | Already accepts a `phases` prop — must render 6 dots, not 4. Verify mobile layout: on `xs` viewports the stepper compresses to "`Phase {N} of 6 — {Label}`" text per the existing `interview-shell.md` responsive spec; do not show 6 horizontal dots cramped on a phone. Use `useMediaQuery(theme.breakpoints.down('sm'))` to toggle. |
| `PortalFooterBar` | `features/carrier-portal/components/PortalFooterBar/index.tsx` | STAB-01, STAB-03 | Visual contract unchanged. Wire `isContinuing` to the new saga save-success signal; when at phase 6, the executor should ensure the dispatched action is `completeOnboarding` (API) — but this is a saga-wiring task, not a UI change. |
| `InputRenderer` | `components/ConversationalForm/InputRenderer.tsx` | STAB-12 | Replace `PresetTilesPlaceholder` (lines 293–307) with `<PresetTileSelector />`. `stateGrid` case already wired (line 410). Pass `value`, `onChange`, and a `presets: PresetOption[]` array derived from the question definition. |

### C. Question schemas to build (data, not UI — listed for completeness)

| File | STAB | Drives which UI |
|------|------|-----------------|
| `features/carrier-portal/questions/costAnalysisQuestions.ts` | STAB-06 | 6 questions per `interview-cost-analysis.md` §"Question Sequence" — all use `inputType: 'presetTiles'` with the listed preset values; Q1 has a `subQuestions` entry for "I own it outright" (yesNo → conditional skip). |
| `features/carrier-portal/questions/lanePreferencesQuestions.ts` | STAB-09 | Uses `inputType: 'stateGrid'` for the primary question. Additional follow-ups (preferred lanes, equipment-state pairings) are out of Phase 1 scope unless explicitly listed in the legacy design — keep to the minimum required to satisfy "Lane Preferences phase exists." |

The `QuestionDefinition` shape in `components/ConversationalForm/questionSchema.ts` does not currently expose a `presets?: PresetOption[]` field — Phase 1 must add one (no breaking change to existing question files). The added field is **typed**, not `any`.

---

## Interaction Contracts

### Save & Continue chain (STAB-01, STAB-03)

The contract the UI consumes — the saga wiring is a planner concern, but the UI's success signal must be:

```
1. User taps "Save & Continue" → handleContinue runs validateForm + setTouched.
2. If errors → snackbar warning + scroll-to-first-error. Stop. Do not dispatch.
3. If clean → dispatch carrierPortalActions.savePhaseRequest({ phase, answers }).
4. PortalFooterBar enters isContinuing=true (button shows spinner, disabled).
5. Saga calls API. On success → dispatch savePhaseSuccess({ phase }).
6. CarrierPortalPage has useEffect watching the per-phase save-success flag.
   - On rising edge: if phase < TOTAL_PHASES → setCurrentPhase(phase + 1) + window.scrollTo({ top: 0, behavior: 'smooth' }).
   - On rising edge: if phase === TOTAL_PHASES → dispatch completeOnboardingRequest. A second useEffect watches completeOnboardingSuccess → PortalCompleteView renders.
7. On saga failure → notistack error toast "We couldn't save your answers. Try again." + isContinuing=false. No phase advance.
```

UI consequence: `PortalFooterBar` reads `isContinuing` from the page; the page derives it from the loading-map composite key `savePhase:{currentPhase}` (matches the dual-slice loading-map convention documented in CLAUDE.md).

### Auto-save (existing pattern — preserve)

500ms debounced dispatch of `answerChanged` per field. `PortalHeader` shows `Saving…` indicator. No change required.

### Scroll-to-error (STAB-02)

```
const firstErrorId = Object.keys(errors)[0];
const el = document.querySelector(`[data-question-id="${firstErrorId}"]`);
if (el) {
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';
  el.scrollIntoView({ behavior, block: 'center' });
  const input = el.querySelector('input, textarea, [role="button"]');
  if (input instanceof HTMLElement) input.focus({ preventScroll: true });
}
```

Question-card containers (`QuestionCard.tsx`) must expose `data-question-id={question.id}` on the outer `Box` — same pattern `SubQuestion.tsx` already uses. Executor should verify and add if missing.

### Stepper interactivity

Stepper dots are **not clickable** in Phase 1. The carrier progresses linearly via `Save & Continue`. Going backwards is allowed only via the footer `Back` button (phases 2–6) or the existing "Edit" link on a collapsed answered card. Stepper is informational only — render with `cursor: 'default'` and no `onClick`.

### Phase divider in thread

When `currentPhase` increments, the thread renders a `PhaseDivider` above the next phase's first question: a full-width horizontal `Divider` with the new phase name centered above it (`Meta` helper, uppercase, letter-spacing 1px, `color: grey.400`). `48px` margin above and below. Already implemented in `PhaseDivider.tsx` — verify it picks up the new constants.

### CostResultCard takeover

The result card is rendered **inside** the conversational thread, not as a route — it replaces the active question slot for phase 4 once all 6 cost questions are answered. The header bar and stepper remain visible (per `interview-shell.md`, header is fixed). Card occupies the full content area between header and footer. Tapping the CTA dispatches `Save & Continue` for phase 4 — same chain as any other phase.

### Animations

| Animation | Duration | Easing | Honors `prefers-reduced-motion` |
|-----------|----------|--------|-------------------------------|
| Count-up break-even | 1500ms | `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out) | Yes — skip, render final |
| Count-up minimum rate | 1500ms, starts at +300ms | same | Yes |
| Expense tile group fade-in | 400ms, starts at +1800ms from card mount | `ease-out` | Yes — skip, render final |
| Question collapse | 250ms | `ease-in-out` | Yes — instant |
| Question fade-in (next) | 250ms | `ease-in-out` | Yes — instant |
| Scroll-to-error | 400ms (browser smooth) | native | Yes — instant |

Animations are implemented with `requestAnimationFrame` (count-up) and CSS transitions via the `sx` prop (`transition: 'opacity 400ms ease-out'`). **No new animation library is introduced** — Phase 1 does not pull in framer-motion just for the count-up (framer-motion is already in deps but reserved for places that need it, not used for the result card's count-up which is a simple RAF loop).

---

## Accessibility Contract

| Item | Requirement |
|------|-------------|
| Touch target | All tap targets ≥ 44×44 CSS pixels. `StateGrid` tiles 48×48 ✓. `Chip` defaults to 32px height — wrap in 48px-tall row with `gap: 8px` so the tap area extends; this is acceptable because the chips are inside a `display: flex` row with `alignItems: 'center', minHeight: 48`. Footer CTA `minHeight: 48`. |
| Focus rings | Use MUI defaults (`:focus-visible`). Do not strip the outline. |
| `aria-label` | Every `IconButton` and every clickable `Box` (`StateGrid` tile, "Edit" link if rendered as Box) gets a descriptive `aria-label`. |
| `aria-pressed` | `StateGrid` tiles: `aria-pressed={preference !== undefined}` with `aria-label="{name}: {state}"`. |
| `aria-busy` | `Save & Continue` button while saving. |
| `role="alert"` | Validation snackbar uses notistack's built-in `role` (it already sets `role="alert"` on warning/error variants). Field-level `FormHelperText` already has implicit `role="alert"` when `error` is true. |
| Screen-reader-only labels for color-coded tiles | `StateGrid` tiles include the cycled preference state in the `aria-label` so they are not color-only signals. |
| `prefers-reduced-motion` | Honored across count-up, scroll, collapse, fade — see Animations table. Detect with `window.matchMedia('(prefers-reduced-motion: reduce)').matches`. |
| Keyboard | Tab order follows DOM order. `StateGrid` tiles are reachable via Tab and activate on Enter/Space (`role="button"` + keydown handler). `PresetTileSelector` chips already keyboard-accessible via MUI `Chip` `onClick`. |
| Heading hierarchy | Page has one `<h1>` for the phase label area (visually hidden if not in design — `PortalHeader` breadcrumb can carry it). Question labels are `<h2>` semantically (not visually) — use `component="h2"` on the question's outer Typography to avoid empty heading levels. |

---

## Responsive Contract

The portal is **mobile-first**. Carrier completes onboarding on a phone in under 15 minutes — this is the project's core value prop.

| Surface | Mobile (`xs`, < 600px) | Tablet (`sm`–`md`) | Desktop (`md`+) |
|---------|------------------------|---------------------|-----------------|
| Content column | full-width, `px: 2` (16px) | `maxWidth: 680px`, `px: 3` (24px) | `maxWidth: 680px`, centered |
| Header | brand left, phase breadcrumb **hidden** — shown as the phase name above the first question of the phase instead. `Save & exit` icon-only on `xs`, text on `sm+`. | brand + breadcrumb + save-exit | same |
| Stepper | Compressed: `Phase {N} of 6 — {Label}` text row, 4px progress bar below | 6 dots horizontal | 6 dots horizontal |
| Footer bar | full-width sticky, `Back` icon-only on `xs`, `Save & Continue` full-width button below back row OR right-aligned with `flex: 1` — keep existing `PortalFooterBar` layout; just verify the continue button gets the lion's share of width on `xs` | inline row | inline row |
| `PresetTileSelector` | wraps to 2 rows; chips flow `flexWrap: 'wrap'`, `gap: 1` | single row | single row |
| `StateGrid` | 5-wide grid (5 × 10 rows) at 48×48 — verify total width fits in `xs` viewport with `px: 2`; if not, drop to 44×44 on `xs` only via `width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 }` | 10-wide × 5 rows | 10-wide × 5 rows |
| `CostResultCard` | full-viewport dark, content `px: 3`, heading 24px, break-even value 36, minimum rate 44, expense tiles stack vertically | content `px: 4`, type sizes 30 / 48 / 60 | same as tablet, max-width 700 centered |
| Question label | 20px | 20px | 20px |

`useMediaQuery(theme.breakpoints.down('sm'))` is the toggle for mobile-specific behavior (stepper, header breadcrumb, icon-only buttons). No new breakpoints introduced.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | (not applicable — no shadcn in project) | not required |
| Third-party registries | none | not required |

The project does not use shadcn or any third-party component registry. All components are built in-tree from MUI v5 primitives. No external block fetching, no `npx shadcn add` operations. Phase 1 introduces no new npm dependencies.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — phase labels, CTAs, validation snackbar, saving indicators, sub-question category tags all declared verbatim
- [ ] Dimension 2 Visuals: PASS — component inventory mapped 1:1 to STAB requirements; visual contracts defer to legacy designs where they specify pixels
- [ ] Dimension 3 Color: PASS — uses existing MUI palette tokens only; one justified dark surface for `CostResultCard`; accent reserved-for list is explicit
- [ ] Dimension 4 Typography: PASS — 4 thread sizes + 3 result-display sizes, 2 weights (400/600) with 700 reserved for displays
- [ ] Dimension 5 Spacing: PASS — MUI 8-point scale, 4 hard-coded pixel exceptions all justified (touch targets, content widths)
- [ ] Dimension 6 Registry Safety: PASS — no shadcn, no third-party registry, no new deps

**Approval:** pending

---

## Pre-population Sources

| Source | Decisions Used |
|--------|---------------|
| `.planning/phases/01-stabilize/01-CONTEXT.md` | Locked tech stack, locked legacy design refs, deferred items, open research items |
| `.planning/REQUIREMENTS.md` (STAB-01..STAB-15) | Every component scope, file:line precision, what's "build new" vs "verify/wire" |
| `.planning-legacy/carrier-onboarding/designs/interview-shell.md` | Header/footer chrome, content column max-width, question typography, sub-question border colors, animations, responsive rules |
| `.planning-legacy/carrier-onboarding/designs/interview-cost-analysis.md` | `CostResultCard` exact layout, copy, count-up timing, color choices (`#0F172A`, green minimum rate), preset values |
| Existing codebase (`PresetTileSelector`, `StateGrid`, `SubQuestion`, `SubAnswer`, `InputRenderer`, `PortalLayout`, `PortalFooterBar`) | What's already built — Phase 1 verifies and wires rather than rebuilding |
| `hussle-app-dispatch-ui/CLAUDE.md` | MUI v5 + `sx` prop only, Typography helpers, no `@mocho/ui`, dual-slice + saga conventions, no thunks, notistack variants |
| Project `CLAUDE.md` + global standards | TypeScript strictness, no `any`/`as`/`!`, naming, file organization |
