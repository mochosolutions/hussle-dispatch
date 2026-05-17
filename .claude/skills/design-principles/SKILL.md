# Design Principles

Consolidated UI design rules for the `/design` command and `ui-designer` agent. Every screen spec must follow these principles — no arbitrary values, no generic defaults.

---

## 1. Design Philosophy

- **Feature-first**: Design the actual feature content before shell/navigation/chrome. Start with what users came to do.
- **Low-fidelity first**: Solve layout, spacing, and hierarchy in grayscale. Add color last — it's a finishing touch, not a structural tool.
- **Define systems early**: Before any screen, establish spacing scale, type scale, and color palette. Every value comes from the system.
- **Spacing scale** (px): `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128` — no other values.
- **Commit to an aesthetic direction**: Avoid default AI slop (Inter, Roboto, purple gradients, blue-grey everything). Pick a deliberate personality.
- **Personality spectrum**: Serious/elegant (serif or thin sans, muted palette, tight spacing, minimal borders) vs Playful/friendly (rounded sans, saturated accents, generous padding, illustrations). Most apps live somewhere between — pick a spot and be consistent.

## 2. Information Hierarchy & Density

### Three-tier text hierarchy
Use weight + color, not just size:
- **Primary**: Dark (900), semibold/bold — the thing users read first
- **Secondary**: Medium grey (600), normal weight — supporting detail
- **Tertiary**: Light grey (400), small — metadata, timestamps, labels

### De-emphasize to emphasize
Don't make everything bold. Weaken competing elements instead — softer color, smaller size, lighter weight. The important thing stands out by contrast.

### Labels
- Combine label with value when possible ("12 employees" not "Employees: 12")
- When separate, style labels as secondary content (smaller, grey, uppercase tracking or semibold)
- Never style labels the same as values

### Visual vs document hierarchy
HTML heading level (h1-h6) is for accessibility/semantics. Visual size/weight is independent — an h3 can be visually larger than an h2 if the design demands it.

### Button hierarchy
- **Primary** (1 per section): Solid fill, high contrast — the main action
- **Secondary**: Outline or muted fill — alternate actions
- **Tertiary**: Text/link style — cancel, back, less important
- **Destructive actions**: Use neutral styling initially. Red only in the confirmation step.

### Density by screen type
- **Dashboards**: High density, compact spacing (8-12px gaps), small text, many data points visible
- **List/table views**: Medium density, scannable rows (12-16px row padding)
- **Detail views**: Lower density, comfortable reading (24-32px section spacing)
- **Forms**: Low density, generous spacing (24-48px between groups), focused attention

## 3. Typography

### Type scale (px)
`12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60 · 72` — hand-picked, not mathematically derived. Skip sizes that look too similar.

### Font selection
- Require **5+ weights** — a font with only Regular/Bold is too limiting
- Avoid condensed faces and short x-height fonts — they reduce readability at body sizes
- **Distinctive over default**: Choose a typeface that signals personality. System fonts are fine for apps, but pick deliberately.
- One font family is enough. Two max (one for headings, one for body) — never three.

### Line height
Inversely proportional to font size:
- Body text (14-18px): line-height `1.5–1.7`
- Sub-headings (20-30px): line-height `1.3–1.4`
- Large headings (36px+): line-height `1.0–1.2`

### Line length
Optimal: **45-75 characters** per line. Enforce with `max-width` on text containers (e.g., `max-width: 65ch`). Never let text run full-width on wide screens.

### Alignment
- **Left-align** all body text and most labels (default)
- **Center** only: hero headlines, empty states, card titles when centered layout
- **Right-align**: numbers in tables/columns for decimal alignment
- Never justify (uneven word spacing)

## 4. Color System

### HSL model
Build palettes in HSL — it makes systematic shade generation predictable.

### Full palette structure
- **Greys**: 8-10 shades, tinted slightly toward your primary hue (pure grey looks dead)
- **Primary**: 5-10 shades from near-white to near-black for the brand color
- **Accents**: 5-10 shades each for semantic colors (success, warning, danger, info)
- Define all shades upfront. Pick from the palette — never interpolate on the fly.

### Shade construction
- **Increase saturation at extremes**: Very light and very dark shades need more saturation to avoid looking washed out
- **Rotate hue**: Darker shades shift cooler (toward blue), lighter shades shift warmer (toward yellow/orange) — mimics natural light behavior
- 9 shades minimum per color: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Implementation
- All colors as **CSS custom properties** (`--color-primary-500`). Never hardcode hex/rgb in component styles.
- Supports dark mode by swapping property values, not rewriting styles.

### Usage rules
- **Dominant color + sharp accents** > evenly distributed rainbow palettes
- Use 1-2 primary shades for most UI, accent colors sparingly for emphasis
- **WCAG 4.5:1** minimum contrast for text. Use light text on dark backgrounds (or vice versa) — flip the contrast model rather than picking a mid-range grey that fails both.
- **Never rely on color alone**: Pair every color-coded status with an icon, label, or pattern. Colorblind users must get the same information.

## 5. Progressive Disclosure

- **Show minimum needed**: Default view has only what most users need most of the time.
- Additional detail goes behind interaction: expandable sections, "Show more" links, detail drawers.
- **Modal**: Quick confirmation, small forms (<5 fields), alerts. Never nested. Never for long content.
- **Slide-over / Drawer**: Detail views, editing a row's properties, secondary forms.
- **New page**: Complex creation flows, multi-step processes, anything needing its own URL.
- **Inline expansion**: Additional metadata on a row, collapsible sections within a detail view.
- **Flat architecture**: 2-3 navigation levels max. If users need a breadcrumb trail longer than 3 segments, the IA is too deep.

## 6. Status Visualization

### Color conventions
| Status | Color | Secondary indicator |
|--------|-------|-------------------|
| Success/Active | Green | Checkmark icon |
| Warning/Pending | Amber | Triangle/clock icon |
| Error/Failed | Red | X/alert icon |
| Info/In-progress | Blue | Info/spinner icon |
| Neutral/Disabled | Grey | Dash/empty icon |

Always pair color with icon or label — never color alone.

### Progress indicators
- **Determinate** (progress bar): When you know the total (uploads, multi-step forms)
- **Indeterminate** (spinner): When duration is unknown but short (<10s expected)
- **Skeleton screens**: When loading page sections — prefer over spinners for layout stability

### Transitions
Status changes use CSS transitions, `150-300ms` ease-out. No animation on initial paint.

## 7. Form Design & Validation

- **Single-column** default. Multi-column only for tightly related short fields (city/state/zip).
- Max form width: **~600px**. Forms stretching to full width are hard to scan.
- **Inline validation on blur**: Validate individual fields when the user leaves them.
- **Cross-field validation on submit**: Rules involving multiple fields validate together on submit.
- **Error messages**: Below the field, red text, specific ("Email must include @" not "Invalid input"). Include how to fix it.
- **Mark optional fields** (not required ones). Most fields in a well-designed form are required — marking the minority reduces noise.
- **Group spacing**: Space between groups (32-48px) > space within groups (16-24px). Visual grouping replaces most fieldset borders.
- **Submit button**: Primary style, right-aligned or full-width on mobile. Disable only briefly during submission (with spinner), never as validation gate.

## 8. Component Selection

### Data display
| Data shape | Best component | When |
|------------|---------------|------|
| Tabular, sortable, >10 rows | DataGrid | Comparing across rows, bulk actions |
| Tabular, ≤10 rows, simple | Table | Static data, settings |
| Mixed content, visual | Cards (grid) | Products, profiles, media |
| Sequential, homogeneous | List | Activity feeds, notifications, nav |

### Editing pattern
- **Inline editing**: Single field changes (rename, toggle status)
- **Modal/Drawer**: Edit a few fields on an existing record
- **Full page**: Create new records, complex editing with many fields

### Grouping content
- **Tabs**: 2-6 peer categories, user needs quick switching, content doesn't need comparison
- **Accordion**: Many sections, user typically opens 1-2, vertical space is tight
- **Steps/Stepper**: Sequential process, later steps depend on earlier ones

## 9. Interaction Patterns

- **Click/tap for all primary actions**. Hover is for visual feedback and tooltips only — never gate functionality behind hover.
- **Two-step destructive confirmation**: First click changes button to "Are you sure?" / "Confirm delete" state (red). Second click executes. For critical operations, use a modal requiring typing the item name.
- **Optimistic updates**: For low-risk, easily reversible actions (toggle, reorder). Show immediately, revert on failure with toast.
- **Server-confirmed**: For important state changes (payments, deletes, role changes). Show spinner, then confirm.
- **Bulk action toolbar**: Appears above list/table when items are selected. Shows count + actions. Disappears when selection is cleared.
- **Filters**: Persist in URL query params so they survive refresh/share. Debounce text search inputs (300ms).
- **Sorting**: Click column header to sort. Show direction indicator. Default sort should be the most useful (usually newest first or alphabetical).
- **Motion**: CSS transitions first (transform, opacity). Reserve JS animation for high-impact moments (onboarding, celebration). Keep all transitions **≤300ms**. Respect `prefers-reduced-motion`.

## 10. Depth & Polish

### Light and shadow
- Assume **top light source**: Raised elements are lighter on top, darker on bottom.
- Inset elements (inputs, wells) are darker on top, lighter on bottom.

### 5-level elevation system
| Level | Use | Shadow |
|-------|-----|--------|
| 0 | Flat content, backgrounds | None |
| 1 | Cards, sections | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| 2 | Button hover, raised elements | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` |
| 3 | Dropdowns, popovers | `0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05)` |
| 4 | Modals, dialogs | `0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)` |

Use **two-part shadows** (ambient + contact) for realism. Single `box-shadow` looks flat.

### Icons
- Never scale up small icons — they look blurry. Use icons designed for the target size.
- Enclose icons in a shape (circle, rounded square) with a background color when they need to feel like a distinct element.
- Match icon weight to font weight nearby.

### Finishing touches
- **Accent borders**: A 3-4px colored left/top border on cards or alerts adds personality cheaply
- **Custom bullets**: Replace default list dots with icons or colored dots for visual interest
- **Empty states**: Always include illustration/icon + explanation + CTA to resolve the empty state
- **Hero sections** (marketing/landing): Subtle gradient meshes or noise textures add depth. Use sparingly in data-heavy UIs.

## 11. Responsive Strategy

### Sizing approach
- Use **`max-width`** over percentages for content areas. Sidebar widths are fixed; main content flexes.
- Content containers: `max-width: 1200px` (dashboards), `max-width: 768px` (article/form content).

### Breakpoint behavior
| Breakpoint | Layout |
|-----------|--------|
| >1200px | Full layout: sidebar + main + optional right panel |
| 768-1200px | Collapse optional panels, stack secondary content below |
| <768px | Single column, hamburger menu, bottom nav for key actions |
| <480px | Simplified: hide secondary info, larger touch targets, stacked buttons |

### Touch targets
- Minimum **44x44px** tap area (even if visual element is smaller, pad the hit area).
- Minimum **8px** gap between adjacent targets.

### Navigation transforms
- **Desktop sidebar** → **Mobile hamburger** or **bottom tab bar** (for ≤5 primary destinations)
- **Desktop tabs** → **Mobile scrollable tabs** or **dropdown selector**
- **Desktop table** → **Mobile card list** (each row becomes a card)

## 12. Accessibility

### Keyboard
- **Tab order** follows visual reading order (top-left to bottom-right, skip decorative elements)
- **Escape** closes any overlay (modal, dropdown, popover, drawer)
- **Arrow keys** navigate within compound widgets (tabs, menus, radio groups)
- **Enter/Space** activates buttons and links

### Focus management
- Visible focus indicators on all interactive elements (minimum 2px outline, `3:1` contrast against background)
- **Trap focus** inside modals — Tab cycles within modal, not behind it
- Return focus to trigger element when overlay closes

### Contrast
- **WCAG AA minimum**: 4.5:1 for normal text, 3:1 for large text (18px+ or 14px+ bold)
- 3:1 for UI components and graphical objects (borders, icons)
- Test with browser devtools contrast checker

### Screen readers
- **Alt text** on all meaningful images. Decorative images get `alt=""`
- **`aria-label`** on icon-only buttons and links
- **`aria-live="polite"`** on regions that update dynamically (toast notifications, inline validation)
- Use **semantic HTML first** (button, nav, main, article, section, aside). ARIA is a supplement, not a replacement.

## 13. Existing Pattern Reference

<!-- Populated by /bootstrap after scanning the project's existing pages and components. -->

### Admin/Dashboard UI Patterns
[Populated after bootstrap — list pages, forms, navigation, notifications]

### Public/Marketing UI Patterns
[Populated after bootstrap — page structure, styling, navigation, content layout]
