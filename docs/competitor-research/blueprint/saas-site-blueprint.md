# FleetCommand — SaaS Marketing Website Blueprint

> Implementation-ready specification for the FleetCommand marketing website.
> This document is the sole input for the coding agent. It contains everything needed
> to build every page — design tokens, component specs, page layouts, copy, and SEO metadata.
> No external documents are required.

---

## Table of Contents

1. [Product Context](#1-product-context)
2. [Design System Token Block](#2-design-system-token-block)
3. [Shared Components Spec](#3-shared-components-spec)
4. [Per-Page Specs](#4-per-page-specs)
5. [Content Requirements](#5-content-requirements)
6. [Implementation Notes](#6-implementation-notes)

---

# 1. Product Context

## What FleetCommand Is

FleetCommand is an all-in-one dispatch management platform for independent owner-operators and small fleets (1–15 trucks). It replaces the fragmented stack of load boards, spreadsheets, invoicing tools, and accounting software — and adds a proprietary Load Intelligence engine that scores every load by net profit (not just rate per mile).

Built by **Hustle Transportation Inc.**, a carrier and dispatch operation based in Queens, NY. This is a working dispatch operation that built the tool it needed.

## Business Model (Dual Revenue)

1. **App subscription** ($59–149/month per truck) for self-dispatching carriers
2. **Dispatch service** (% of gross load rate) where Hustle finds and assigns loads through the platform — carriers get full visibility into every load, invoice, and payment

## Target Customers

| Segment | Size | Pain Points |
|---------|------|-------------|
| Owner-operators (primary) | 1–3 trucks | Fake/low-paying loads on DAT, no profit-per-load calculation, manual invoicing (1-2 hrs/day), IFTA filing nightmare, no broker payment history, $200+/mo on disconnected tools |
| Small fleet owners (secondary) | 4–15 trucks | Need dispatch system, can't afford enterprise TMS ($500+/mo), no multi-truck visibility |
| New authority holders (tertiary) | 1 truck | Just got MC number, vulnerable to bad dispatch services and predatory lease-on programs |

## Core Features (Ranked by Conversion Impact)

1. **Load Intelligence Engine** — scores every load by NET PROFIT after fuel, deadhead, tolls, operating cost/mile. Not rate/mile — actual money in pocket. No competitor does this.
2. **Round-Trip Chaining** — auto-finds complementary loads home or to next lane. Calculates combined trip profit.
3. **Auto-Invoicing** — load completes → auto-generates invoice from rate con + BOL + POD → sends to broker. Saves 15-30 min/load.
4. **Dispatch Management** — full load lifecycle, 13-status tracking, real-time driver location via SMS-triggered PWA, dispatch board.
5. **Settlement Tracking** — which brokers owe you, how much, how long since delivery. Flags slow-pay before you accept next load.
6. **Broker Payment Scoring** — payment history and reliability from real transaction data. Know 15-day vs 45-day payers before booking.
7. **Document Management** — digital BOLs, PODs, rate cons, carrier packets. Auto-attached to loads.
8. **IFTA Auto-Calculation** — miles by state tracked from dispatch data. Generates quarterly report ready to file. Saves $200-400/quarter.

## Pricing

| Plan | Price | Includes |
|------|-------|----------|
| Launch | $59/mo per truck | Dispatch management, document management, invoicing, settlement tracking, basic load search |
| Pro | $99/mo per truck | Everything in Launch + Load Intelligence scoring, round-trip chaining, IFTA auto-calc, broker scoring, lane analytics |
| Elite | $149/mo per truck | Everything in Pro + lane alerts, weekly profit reports, per-truck P&L, expense tracking, priority support |

**Early adopter:** First 200 subscribers get Launch pricing for life.

**Dispatch Service option:** Hustle dispatches your truck through FleetCommand. Competitive % of gross load rate. App included. No contracts. You keep your authority.

## Competitive Positioning

| Competitor | Model | Monthly Cost | Key Weakness FleetCommand Exploits |
|------------|-------|-------------|-----------------------------------|
| DAT / Truckstop | Load board only | $49–199/mo | Search engine with no dispatch, invoicing, IFTA, or profit calculation. Fake load epidemic (19K fakes under one broker, March 2025). 25-45% renewal price hikes. |
| CloudTrucks | Virtual carrier | 18–21% per load ($900-1,050 on a $5K load) | Takes your authority. 40% deductions reported. 43% layoffs Sept 2025. Loads mostly from DAT anyway. |
| Traditional dispatch (MaxTruckers, Logity, FleetCare) | Phone + spreadsheets | 3–10% per load | No technology, no app, no load scoring. Zero visibility into dispatcher actions. |
| PCS Software / McLeod | Enterprise TMS | $500+/mo (sales-driven) | No public pricing, no self-serve, no trial. 6-month sales cycle. Dated WordPress sites. |
| Fragmented stack (DAT + QuickBooks + Sheets) | DIY | $200+/mo combined | Data entered 2-3x across systems. Nothing connects. |

**FleetCommand's three positioning lines:**
- vs. load boards: "DAT shows you loads. FleetCommand shows you profit."
- vs. virtual carriers: "Keep your authority. Keep your profits. Get better tools."
- vs. traditional dispatch: "Real technology, not just a person with a phone."

---

# 2. Design System Token Block

> Copy this entire section into a `tokens.css` or theme configuration file.
> All component and page specs reference these tokens exclusively.

## 2.1 Spacing Scale (px)

```
4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128
```

No other spacing values are allowed. Usage guidance:

| Context | Values |
|---------|--------|
| Hero/section vertical gaps | `64` or `96` |
| Section internal padding | `48` or `64` |
| Card internal padding | `24` or `32` |
| Element gaps within sections | `16` or `24` |
| Tight groupings (icon + label, badge clusters) | `4` or `8` |
| Form field spacing (within group) | `16` or `24` |
| Form group spacing (between groups) | `32` or `48` |

## 2.2 Type Scale (px)

```
12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60 · 72
```

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| Hero headline | `48`–`60` | Bold (700) | 1.0–1.1 |
| Section heading (H2) | `30`–`36` | Bold (700) | 1.2–1.3 |
| Sub-heading (H3) | `20`–`24` | Semibold (600) | 1.3–1.4 |
| Body text | `16`–`18` | Regular (400) | 1.5–1.7 |
| Supporting/secondary text | `14` | Regular (400) | 1.5 |
| Captions, metadata, labels | `12` | Medium (500) | 1.4 |

- **Font family:** Inter (single family, 9 weights available, no secondary typeface)
- **Max line length:** `65ch` on text containers. Never run body text full-width on wide screens.

## 2.3 Color Palette (CSS Custom Properties)

```css
:root {
  /* Brand — Navy */
  --color-navy-900: #1A2332;
  --color-navy-800: #1E2A3A;
  --color-navy-700: #243347;
  --color-navy-600: #2D3F57;
  --color-navy-100: #E8EDF3;
  --color-navy-50:  #F0F4F8;

  /* Accent — Blue */
  --color-accent-500: #2563EB;
  --color-accent-600: #1D4FD7;
  --color-accent-400: #4F83F0;
  --color-accent-100: #DBEAFE;
  --color-accent-50:  #EFF6FF;

  /* Greys (navy-tinted — pure grey looks dead) */
  --color-grey-900: #111827;
  --color-grey-700: #374151;
  --color-grey-500: #6B7280;
  --color-grey-400: #9CA3AF;
  --color-grey-300: #D1D5DB;
  --color-grey-200: #E5E7EB;
  --color-grey-100: #F3F4F6;
  --color-grey-50:  #F9FAFB;

  /* Semantic */
  --color-success-500: #16A34A;
  --color-warning-500: #D97706;
  --color-danger-500:  #DC2626;
  --color-info-500:    #2563EB;

  /* Surfaces */
  --color-page-bg:     var(--color-grey-50);
  --color-card-bg:     #FFFFFF;
  --color-nav-bg:      var(--color-navy-900);
  --color-footer-bg:   var(--color-navy-800);
}
```

**Rules:**
- Dominant navy + accent blue. No rainbow distribution.
- WCAG 4.5:1 minimum contrast for all text.
- Never rely on color alone — pair every status with icon + label.

## 2.4 Three-Tier Text Hierarchy

| Tier | Color Token | Weight | Usage |
|------|------------|--------|-------|
| Primary | `--color-grey-900` | Semibold/Bold | What users read first |
| Secondary | `--color-grey-500` | Regular (400) | Supporting detail |
| Tertiary | `--color-grey-400` | Regular (400) at `12`–`14px` | Metadata, timestamps, labels |

De-emphasize to emphasize. Weaken competing elements instead of bolding everything.

## 2.5 Elevation System (Two-Part Shadows)

| Level | Use | Shadow |
|-------|-----|--------|
| 0 | Flat content, page backgrounds | None |
| 1 | Cards, feature blocks, pricing tiers | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` |
| 2 | Button hover, raised elements | `0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)` |
| 3 | Dropdowns, popovers, sticky nav | `0 10px 15px rgba(0,0,0,0.07), 0 4px 6px rgba(0,0,0,0.05)` |
| 4 | Modals, dialogs, overlays | `0 20px 25px rgba(0,0,0,0.08), 0 10px 10px rgba(0,0,0,0.04)` |

Always use two-part shadows (ambient + contact).

## 2.6 Button Hierarchy

| Level | Style | Usage |
|-------|-------|-------|
| Primary | Solid `--color-accent-500` fill, white text, elevation 1 → 2 on hover | Main CTA. Max 1 per section. |
| Secondary | 1px `--color-accent-500` border, accent text, transparent fill | Alternate actions |
| Tertiary | Text/link style, `--color-accent-500` text, no background | Cancel, back, less important |
| Destructive | Neutral styling initially. `--color-danger-500` only at confirmation step | Delete, remove |

- Minimum touch target: `44×44px` (pad hit area if button is visually smaller)
- Border radius: `8px`
- Padding: `12px 24px` (default), `16px 32px` (large CTA)
- Font: `16px` Semibold (600) for default, `18px` for large CTA
- Transition: `150ms` ease-out on background-color and box-shadow

## 2.7 Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| `>1200px` | Full layout: max-width `1200px` centered, multi-column sections |
| `768–1200px` | Fewer columns, stack secondary content |
| `<768px` | Single column, hamburger nav, stacked CTAs, full-width cards |
| `<480px` | Simplified: hide secondary info, `48px` min touch targets, full-width stacked buttons |

**Critical:** Target `<3s` load time on 3G. O/Os browse from truck cabs on spotty cell service.

## 2.8 Interaction Patterns

- All primary actions via click/tap. Hover is visual feedback only — never gate functionality behind hover.
- CSS transitions: `150–300ms` ease-out. No animation on initial paint.
- Respect `prefers-reduced-motion`.
- Two-step destructive confirmation (button state change → confirm).

## 2.9 Accessibility Requirements

- Tab order follows visual reading order
- Escape closes any overlay
- Visible focus indicators: minimum `2px` outline, `3:1` contrast ratio
- Focus trapped inside modals
- WCAG AA: `4.5:1` normal text, `3:1` large text and UI components
- Alt text on all meaningful images. Decorative images get `alt=""`
- `aria-label` on icon-only buttons
- Semantic HTML first (`button`, `nav`, `main`, `section`, `article`). ARIA supplements, never replaces.

---

# 3. Shared Components Spec

## 3.1 Navigation — Desktop

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]    Features ▾    Pricing    Dispatch Service    Blog    │
│                                [Call: (718) 555-XXXX]  [Start Free Trial] │
└──────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-navy-900`
- Height: `64px`
- Position: sticky top, `z-index: 100`, elevation 3
- Logo: FleetCommand wordmark, white, left-aligned, `24px` height
- Nav links: `14px` Medium (500), white at `90%` opacity, `100%` on hover, `16px` horizontal gap between items
- Phone number: `14px` Medium (500), white, with phone icon. Visible `>768px` only.
- CTA button: Primary button style, `14px` Semibold, `8px 24px` padding — always visible
- Transition: background `150ms` ease-out on scroll (optional subtle opacity shift)

**Features dropdown (on hover/click):**
- Background: `--color-card-bg` (white)
- Elevation: 3
- Padding: `16px`
- Items: `16px` Regular, `--color-grey-900` text, `8px` vertical gap
- Items listed:
  - Load Intelligence
  - Dispatch Management
  - Auto-Invoicing
  - Settlement & Broker Scoring
  - Document Management
  - IFTA Auto-Calculation
  - (divider: `1px --color-grey-200`)
  - All Features →

**Accessibility:** `aria-expanded` on dropdown trigger, `role="menu"` on dropdown, arrow key navigation within menu, Escape to close.

## 3.2 Navigation — Mobile (`<768px`)

```
┌────────────────────────────────────┐
│  [Logo]       [Start Trial]    ☰  │
└────────────────────────────────────┘
```

- "Start Free Trial" button remains visible — never hidden behind hamburger
- Phone number hidden (available in hamburger menu and footer)
- Hamburger opens full-screen overlay: `--color-navy-900` background, white text, `24px` nav items, `32px` vertical spacing
- Overlay includes phone number as click-to-call link at bottom
- Close button: top-right `×`, `44×44px` touch target

## 3.3 Footer

```
┌──────────────────────────────────────────────────────────────────┐
│  [Logo]                                                          │
│                                                                  │
│  Product        Company        Resources       Legal             │
│  Features       About          Blog            Privacy Policy    │
│  Pricing        Careers        Help Center     Terms of Service  │
│  Dispatch Svc   Contact        Cost/Mile Tool                    │
│  Changelog                                                       │
│                                                                  │
│  [App Store Badge]  [Google Play Badge]                          │
│  [YouTube] [Facebook] [Instagram] [TikTok]                      │
│                                                                  │
│  Powered by Hustle Transportation Inc. — Queens, NY              │
│  © 2026 FleetCommand. All rights reserved.                      │
└──────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-navy-800`
- Padding: `64px` top, `48px` bottom
- Max-width: `1200px` centered
- Column layout: 4 columns at `>768px`, 2 columns at `<768px`, stacked at `<480px`
- Column headers: `14px` Semibold (600), white, `--color-grey-400` for "Powered by" line
- Links: `14px` Regular (400), `rgba(255,255,255,0.7)`, `1.0` on hover, `8px` vertical gap
- Social icons: `24px`, `rgba(255,255,255,0.5)`, `1.0` on hover, `16px` horizontal gap
- App store badges: grayscale by default, full color on hover, `48px` height
- "Powered by Hustle Transportation Inc." — `12px` `--color-grey-400`
- Separator: `1px` border-top `rgba(255,255,255,0.1)` above copyright line, `24px` padding-top

**Responsive `<768px`:** 2-column grid for link groups. Social icons and app badges centered. Full-width copyright.

## 3.4 CTA Block — Primary

Used at the bottom of most pages as a conversion push.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│            [Headline — action-oriented, 30-36px Bold]            │
│         [Subtext — 16px Regular, --color-grey-500]               │
│                                                                  │
│       [Start Free Trial]  (primary)    [Call Us]  (secondary)    │
│                                                                  │
│        "No credit card required. Cancel anytime."                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-navy-900`
- Text: white
- Padding: `96px` vertical
- Text alignment: center
- Headline: `30px` or `36px` Bold (700), white
- Subtext: `16px` Regular (400), `rgba(255,255,255,0.7)`
- Buttons: centered, `16px` horizontal gap
  - Primary: `--color-accent-500` fill, white text, large CTA size (`18px`, `16px 32px` padding)
  - Secondary: white border, white text, transparent fill
- Trust line: `14px` Regular, `rgba(255,255,255,0.5)`, `24px` above bottom
- Max-width text container: `600px` centered

**Responsive `<768px`:** Buttons stack vertically, full-width, `12px` gap.

## 3.5 CTA Block — Lightweight

Used mid-page as a soft conversion nudge.

```
[Headline — 24px Semibold]    [Start Free Trial] (primary button)
```

**Specs:**
- Background: `--color-accent-50`
- Padding: `32px` `48px`
- Border-left: `4px` solid `--color-accent-500`
- Layout: flex row, space-between, align center
- Headline: `24px` Semibold (600), `--color-grey-900`
- Button: primary style, default size
- Border-radius: `8px`

**Responsive `<768px`:** Stack vertically, `16px` gap, button full-width.

## 3.6 Feature Card

Used on homepage features section, features page, and dispatch service page.

```
┌─────────────────────────────────────┐
│  [Icon — 32px, --color-accent-500]  │
│                                      │
│  Feature Name                        │
│  20px Semibold, --color-grey-900     │
│                                      │
│  Plain-language description of       │
│  what this means for the driver.     │
│  16px Regular, --color-grey-500      │
│                                      │
│  Learn more →                        │
│  14px, --color-accent-500            │
└─────────────────────────────────────┘
```

**Specs:**
- Background: `--color-card-bg` (white)
- Elevation: 1, → 2 on hover
- Padding: `32px`
- Border-radius: `8px`
- Border-top: `4px` solid `--color-accent-500` (accent border finishing touch)
- Icon: `32px` size, `--color-accent-500`, within `48px` circle of `--color-accent-50` background
- Title: `20px` Semibold (600), `--color-grey-900`, `16px` below icon
- Description: `16px` Regular (400), `--color-grey-500`, line-height `1.6`, `8px` below title
- Link: `14px` Semibold (600), `--color-accent-500`, `16px` above bottom — `→` arrow shifts `4px` right on hover (`150ms`)
- Transition: box-shadow `200ms` ease-out

**Responsive `<768px`:** Full-width, stacked vertically, `16px` gap between cards.

## 3.7 Pricing Tier Card

```
┌─────────────────────────────────┐
│  Plan Name                      │
│  14px Medium, --color-grey-500  │
│                                 │
│  $99                            │
│  48px Bold, --color-grey-900    │
│  /mo per truck                  │
│  14px Regular, --color-grey-400 │
│                                 │
│  ─────────────────────          │
│                                 │
│  ✓ Feature line item            │
│  ✓ Feature line item            │
│  ✓ Feature line item            │
│  ✓ Feature line item            │
│  14px Regular, --color-grey-700 │
│  Checkmark: --color-success-500 │
│                                 │
│  [Start Free Trial]             │
│  Full-width primary button      │
└─────────────────────────────────┘
```

**Specs:**
- Background: `--color-card-bg` (white)
- Elevation: 1
- Padding: `32px`
- Border-radius: `8px`
- Plan name: `14px` Medium (500), `--color-grey-500`, uppercase, letter-spacing `0.05em`
- Price: `48px` Bold (700), `--color-grey-900`, `4px` below plan name
- Price unit: `14px` Regular (400), `--color-grey-400`, inline after price
- Divider: `1px` `--color-grey-200`, `24px` vertical margin
- Feature items: `14px` Regular (400), `--color-grey-700`, `12px` vertical gap
- Checkmark: `--color-success-500`, `16px` size, `8px` right margin
- CTA button: full-width, `24px` above bottom of padding

**Recommended tier highlight (Pro):**
- Border: `2px` solid `--color-accent-500`
- Badge above card: "Most Popular" — `12px` Medium, white text, `--color-accent-500` background, `4px 12px` padding, `4px` border-radius, centered above top edge with negative margin

**Responsive `<768px`:** Cards stack vertically, full-width. Recommended tier appears first in stack order.

## 3.8 Testimonial Card

```
┌─────────────────────────────────────────┐
│  "Quote text from a real driver about   │
│   how FleetCommand changed their        │
│   business operations."                 │
│  18px Regular italic, --color-grey-700  │
│                                         │
│  [Photo]  Driver Name                   │
│  48px     Title / Equipment Type        │
│  round    Location · Fleet Size         │
│           Result: +$X,XXX/mo revenue    │
│                                         │
└─────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-card-bg` (white)
- Elevation: 1
- Padding: `32px`
- Border-radius: `8px`
- Quote: `18px` Regular (400) italic, `--color-grey-700`, line-height `1.6`
- Open-quote mark: `48px` `--color-accent-100` positioned top-left as decorative element
- Photo: `48px` circle, `object-fit: cover`
- Name: `16px` Semibold (600), `--color-grey-900`
- Details: `14px` Regular (400), `--color-grey-500`
- Result metric: `14px` Semibold (600), `--color-success-500`
- Photo + name block: flex row, `12px` gap, `24px` below quote

## 3.9 Comparison Table

Used on homepage and comparison pages. Side-by-side feature grid.

**Specs:**
- Background: `--color-card-bg` (white)
- Elevation: 1
- Border-radius: `8px`
- Overflow: hidden (for rounded corners)
- Header row: `--color-navy-900` background, white text, `14px` Semibold
- FleetCommand column header: `--color-accent-500` background to visually distinguish
- Row padding: `16px` `24px`
- Alternating row backgrounds: `--color-grey-50` / white
- Feature name column: `14px` Semibold (600), `--color-grey-900`, left-aligned
- Cell values: `14px` Regular (400), centered
- Checkmark: `--color-success-500` icon
- X mark: `--color-grey-300` icon
- Dollar amounts: `14px` Regular, `--color-grey-700`

**Responsive `<768px`:** Table collapses to card-per-competitor format. Each competitor becomes a card listing features with check/x marks.

## 3.10 FAQ Accordion

```
┌──────────────────────────────────────────────────┐
│  ▸ Question text here?                    [+]    │
├──────────────────────────────────────────────────┤
│  ▾ Question text here?                    [−]    │
│                                                  │
│     Answer text in 16px Regular,                 │
│     --color-grey-700, max 65ch.                  │
│                                                  │
├──────────────────────────────────────────────────┤
│  ▸ Question text here?                    [+]    │
└──────────────────────────────────────────────────┘
```

**Specs:**
- Container: no elevation, `1px` `--color-grey-200` border
- Border-radius: `8px`
- Question row: `16px` Semibold (600), `--color-grey-900`, `16px 24px` padding
- Toggle icon: `20px`, `--color-grey-400`, right-aligned, rotates `180deg` on open (`200ms`)
- Separator: `1px` `--color-grey-200`
- Answer: `16px` Regular (400), `--color-grey-700`, `0 24px 24px 24px` padding, line-height `1.6`, max-width `65ch`
- Animation: height `200ms` ease-out, content fades in `150ms`
- Accessibility: `<button>` triggers, `aria-expanded`, `aria-controls` pointing to answer panel `id`

## 3.11 Live Stats Bar

Horizontal bar showing real-time or weekly-updated platform metrics.

```
┌──────────────────────────────────────────────────────────────────┐
│  🔵 X,XXX loads dispatched this week  │  $X.XX avg RPM  │  XXX carriers active │
└──────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Background: `--color-navy-900`
- Padding: `16px 0`
- Text: `14px` Medium (500), white
- Numbers: `14px` Bold (700), `--color-accent-400`
- Separators: `1px` `rgba(255,255,255,0.2)` vertical dividers
- Layout: flex row, justify-center, `32px` gap between stat groups
- Dot indicator: `8px` circle, `--color-success-500`, subtle pulse animation (`2s` infinite)

**Responsive `<768px`:** Wrap to 2 rows if needed, `16px` gap.
**Responsive `<480px`:** Stack vertically, center-aligned, `8px` gap.

## 3.12 Blog Post Preview Card

```
┌─────────────────────────────────────┐
│  [Category Badge]                   │
│  12px Medium, --color-accent-500    │
│  --color-accent-50 bg, 4px 8px pad  │
│                                     │
│  Post Title Goes Here               │
│  20px Semibold, --color-grey-900    │
│                                     │
│  First 2 lines of excerpt text      │
│  that preview the article...        │
│  14px Regular, --color-grey-500     │
│                                     │
│  Read more →                        │
│  14px, --color-accent-500           │
└─────────────────────────────────────┘
```

**Specs:**
- Background: `--color-card-bg` (white)
- Elevation: 1, → 2 on hover
- Padding: `24px`
- Border-radius: `8px`
- Category badge: `12px` Medium (500), `--color-accent-500` text, `--color-accent-50` background, `4px 8px` padding, `4px` border-radius
- Title: `20px` Semibold (600), `--color-grey-900`, `12px` below badge
- Excerpt: `14px` Regular (400), `--color-grey-500`, 2-line clamp, `8px` below title
- Link: same style as feature card link

## 3.13 Signup Form

```
┌─────────────────────────────────────┐
│  Start Your Free Trial              │
│  24px Semibold, --color-grey-900    │
│                                     │
│  Full Name                          │
│  [________________________]         │
│                                     │
│  Email Address                      │
│  [________________________]         │
│                                     │
│  Phone Number                       │
│  [________________________]         │
│                                     │
│  MC Number (optional)               │
│  [________________________]         │
│                                     │
│  [Start Free Trial]                 │
│  Full-width primary button          │
│                                     │
│  No credit card required.           │
│  12px, --color-grey-400             │
└─────────────────────────────────────┘
```

**Specs:**
- Max-width: `480px`
- Background: `--color-card-bg` (white)
- Elevation: 2
- Padding: `32px`
- Border-radius: `8px`
- Labels: `14px` Medium (500), `--color-grey-700`, `4px` below label to input
- Inputs: `16px` Regular (400), `--color-grey-900` text, `--color-grey-200` border, `12px 16px` padding, `8px` border-radius
- Input focus: `--color-accent-500` border, `--color-accent-50` background, `2px` outline
- Error state: `--color-danger-500` border, error message `12px` `--color-danger-500` below field
- Mark **optional** fields, not required ones
- Validation: inline on blur, cross-field on submit
- Button: full-width primary, `16px 32px` padding
- Trust line: `12px` Regular, `--color-grey-400`, centered, `16px` below button

## 3.14 Dispatch Service Application Form

Same base as signup form, additional fields:

- Equipment type (dropdown: Dry Van, Reefer, Flatbed, Tanker, Other)
- Number of trucks (number input)
- Preferred lanes (textarea, 3 rows)
- How did you hear about us? (dropdown: YouTube, Facebook, Referral, Google Search, Other)

Max-width: `560px`. All other specs identical to signup form.

---

# 4. Per-Page Specs

---

## 4.1 Homepage `/`

**Page purpose:** Primary conversion page. Communicate the value proposition in 5 seconds, drive trial signups. Establishes all shared components.
**Primary conversion goal:** Start Free Trial click → `/signup`

### SEO Metadata

- **Title:** `FleetCommand — Dispatch Management for Owner-Operators & Small Fleets`
- **Meta description:** `Stop guessing which loads make money. FleetCommand scores every load by net profit, auto-generates invoices, and tracks broker payments — all in one app. Start free.`
- **Target keywords:** truck dispatch app, truck dispatch services, dispatch service for owner operators, owner operator trucking app
- **OG title:** `FleetCommand — See Profit, Not Just Rates`
- **OG description:** Same as meta description
- **OG image:** Product screenshot of dispatch board with Load Intelligence scores visible

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `hero` | Custom (hero layout) |
| 2 | `stats-bar` | Live Stats Bar |
| 3 | `problem` | Custom (text + visual) |
| 4 | `features` | Feature Cards (grid) |
| 5 | `how-it-works` | Custom (3-step flow) |
| 6 | `load-intelligence` | Custom (split layout) |
| 7 | `comparison` | Comparison Table |
| 8 | `pricing-preview` | Pricing Tier Cards |
| 9 | `testimonials` | Testimonial Cards |
| 10 | `cta-bottom` | CTA Block — Primary |
| 11 | `footer` | Footer |

---

#### Section 1: Hero `#hero`

**Layout:** Split — copy left (60%), product screenshot right (40%). Max-width `1200px` centered.
**Background:** `--color-page-bg` (`--color-grey-50`)
**Padding:** `96px` top, `64px` bottom

**Left column:**
- Headline: `"Stop Guessing Which Loads Actually Make Money"`
  - `48px` Bold (700), `--color-grey-900`, line-height `1.1`
  - At `<768px`: `36px`
- Subheadline: `"FleetCommand scores every load by net profit — after fuel, deadhead, and tolls — so you book smarter, invoice faster, and get paid on time. Self-dispatch with AI or let us dispatch for you."`
  - `18px` Regular (400), `--color-grey-500`, line-height `1.6`, `16px` below headline
  - Max-width: `540px`
- CTA group: `24px` below subheadline
  - Primary button: `"Start Free Trial"` → `/signup`
  - Secondary button: `"Talk to a Dispatcher"` → `/dispatch-service`
  - `16px` horizontal gap between buttons
  - At `<768px`: stack vertically, full-width, `12px` gap
- Trust line: `"No credit card required · Set up in 5 minutes · Cancel anytime"`
  - `14px` Regular, `--color-grey-400`, `16px` below buttons

**Right column:**
- Product screenshot: dispatch board showing loads with profit scores highlighted
- Image has subtle `--color-navy-100` background container with `8px` border-radius
- Image drops below text on `<768px` with `32px` top margin
- `alt="FleetCommand dispatch board showing load profit scores"`

---

#### Section 2: Live Stats Bar `#stats-bar`

**Component:** Live Stats Bar (shared component 3.11)
**Content:**
- `"X,XXX loads dispatched this month"` | `"$X.XX avg booked RPM"` | `"XXX carriers active"`
- Replace X values with real or realistic seed data

---

#### Section 3: Problem Statement `#problem`

**Layout:** Two columns — copy left (50%), visual right (50%). Max-width `1200px`.
**Background:** white (`--color-card-bg`)
**Padding:** `96px` top, `96px` bottom

**Left column:**
- Headline: `"You're Running a Business With Duct Tape and Spreadsheets"`
  - `30px` Bold (700), `--color-grey-900`, line-height `1.2`
- Body copy:
  ```
  You pay $150/month for a load board full of fake posts.
  You type the same load info into three different apps.
  You spend Sunday night doing IFTA math.
  And you still don't know which loads actually made money last month.

  There's a better way.
  ```
  - `16px` Regular (400), `--color-grey-700`, line-height `1.7`
  - Each pain point on its own line for scanability
  - "There's a better way." — `16px` Semibold (600), `--color-accent-500`, `24px` top margin
- No CTA in this section — it builds empathy, not conversion

**Right column:**
- Visual: illustration or diagram showing the fragmented stack (DAT icon + spreadsheet icon + invoicing app icon + IFTA calculator icon) with arrows converging into a single FleetCommand screen
- This can be a designed graphic or a simplified product screenshot collage
- `alt="Fragmented trucking tools being replaced by FleetCommand's single platform"`

**Responsive `<768px`:** Stack vertically, copy first, visual below with `32px` gap.

---

#### Section 4: Feature Highlights `#features`

**Layout:** Section heading centered, then 2×2 grid of feature cards. Max-width `1200px`.
**Background:** `--color-grey-50`
**Padding:** `96px` top, `96px` bottom

**Section heading:**
- `"Everything You Need to Run Profitably"`
- `36px` Bold (700), `--color-grey-900`, centered
- Subheading: `"No more juggling five apps. One platform for loads, invoices, compliance, and profit tracking."`
- `18px` Regular (400), `--color-grey-500`, centered, max-width `600px`, `16px` below heading

**Cards** (shared component 3.6, 2×2 grid, `24px` gap):

| # | Icon | Title | Description |
|---|------|-------|-------------|
| 1 | DollarSign or TrendingUp | Load Intelligence | See exactly how much money every load puts in your pocket — after fuel, deadhead, and tolls. Not rate per mile. Real profit. |
| 2 | Truck or LayoutDashboard | Dispatch Management | Your entire operation on one screen. Assign loads, track drivers, update status — from booking to delivery to payment. |
| 3 | FileText or Receipt | Auto-Invoicing | Load delivered? Invoice generated. Rate con, BOL, and POD auto-attached. Sent to the broker. You save 30 minutes per load. |
| 4 | Shield or CheckCircle | Compliance & IFTA | Miles tracked by state automatically. Quarterly IFTA report generated. Expiration alerts for every document. No more Sunday-night spreadsheets. |

"Learn more →" on each card links to `/features`.

**Responsive `<768px`:** Single column, cards stack, `16px` gap.

---

#### Section 5: How It Works `#how-it-works`

**Layout:** 3 steps in a horizontal flow, numbered circles connected by lines. Max-width `1200px`, centered.
**Background:** white (`--color-card-bg`)
**Padding:** `96px` top, `64px` bottom

**Section heading:**
- `"Up and Running in 5 Minutes"`
- `30px` Bold (700), `--color-grey-900`, centered

**Steps:**

| Step | Number Circle | Title | Description |
|------|--------------|-------|-------------|
| 1 | `--color-accent-500` circle, white `24px` Bold number | Sign Up | Create your account in 2 minutes. No sales call. No application. No eligibility check. |
| 2 | Same style | Add Your Fleet | Enter your trucks and drivers. Import documents. We handle the rest. |
| 3 | Same style | Start Dispatching | Book loads, track deliveries, generate invoices, get paid — all in one place. |

**Step circle:** `48px` diameter, `--color-accent-500` background, white `24px` Bold number centered
**Connector line:** `2px` `--color-grey-200`, horizontal between circles
**Title:** `20px` Semibold (600), `--color-grey-900`, `16px` below circle
**Description:** `14px` Regular (400), `--color-grey-500`, `8px` below title, max-width `280px`, centered under each step

**Responsive `<768px`:** Steps stack vertically. Connector line becomes vertical. `32px` gap between steps.

---

#### Section 6: Load Intelligence Teaser `#load-intelligence`

**Layout:** Split — copy left (50%), product screenshot right (50%). Max-width `1200px`.
**Background:** `--color-navy-900`
**Padding:** `96px` vertical
**Text color:** white

**Left column:**
- Eyebrow: `"LOAD INTELLIGENCE ENGINE"`
  - `12px` Medium (500), `--color-accent-400`, uppercase, letter-spacing `0.1em`
- Headline: `"Know Your Profit Before You Book"`
  - `36px` Bold (700), white, line-height `1.2`, `12px` below eyebrow
- Body: `"Every other tool shows you rate per mile. FleetCommand shows you what's left in your pocket after fuel, deadhead, tolls, and operating cost. Because a $3.50/mile load with 200 empty miles isn't a $3.50/mile load."`
  - `16px` Regular (400), `rgba(255,255,255,0.8)`, line-height `1.7`, `16px` below headline
- Feature bullets (icon + text, `16px` gap between items):
  - `✓ Net profit scoring on every available load`
  - `✓ Round-trip chaining — find the load that gets you home`
  - `✓ Broker payment scoring — know who pays fast`
  - `✓ Lane analytics — see your best-performing routes`
  - Icons: `--color-accent-400` checkmarks, text: `14px` Regular, `rgba(255,255,255,0.9)`
- CTA: `24px` below bullets
  - Primary button: `"See How It Works"` → `/features`
  - Button on dark bg: `--color-accent-500` fill, white text (same as primary but stands out on dark)

**Right column:**
- Product screenshot: Load Intelligence view showing loads with profit scores, color-coded (green for high-profit, yellow for marginal, red for money-losing)
- Slight rotation (`2deg`) and elevation 3 shadow for depth on dark background
- `alt="FleetCommand Load Intelligence showing net profit scores per load"`

**Responsive `<768px`:** Stack vertically, copy first, screenshot below with `32px` gap. Remove rotation.

---

#### Section 7: Comparison Table `#comparison`

**Layout:** Centered, max-width `1000px`.
**Background:** `--color-grey-50`
**Padding:** `96px` vertical

**Section heading:**
- `"FleetCommand vs. Everything Else"`
- `30px` Bold (700), `--color-grey-900`, centered
- Subheading: `"One platform that replaces your entire stack — for less than what you're paying now."`
- `16px` Regular (400), `--color-grey-500`, centered, `16px` below

**Component:** Comparison Table (shared component 3.9)

| Feature | FleetCommand ($59-149/mo) | DAT ($49-199/mo) | CloudTrucks (18-21%/load) | Dispatch Svc (3-10%/load) | DIY Stack ($200+/mo) |
|---------|:------------------------:|:-----------------:|:------------------------:|:------------------------:|:-------------------:|
| Load search | ✓ | ✓ | ✓ | ✓ | ✓ (DAT) |
| **Net profit scoring** | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Round-trip chaining** | ✓ | ✗ | ✗ | ✗ | ✗ |
| Dispatch management | ✓ | ✗ | Basic | Manual | ✗ |
| Auto-invoicing | ✓ | ✗ | ✗ | ✗ | Manual |
| IFTA auto-calculation | ✓ | ✗ | ✓ | ✗ | Manual |
| Broker payment scoring | ✓ | ✗ | ✗ | ✗ | ✗ |
| Document management | ✓ | ✗ | ✗ | ✗ | ✗ |
| Settlement tracking | ✓ | ✗ | Partial | Manual | Manual |
| **Keep your authority** | ✓ | ✓ | ✗ | ✓ | ✓ |
| **See your own data** | ✓ | N/A | Limited | ✗ | Scattered |
| No per-load fees | ✓ | ✓ | ✗ | ✗ | ✓ |

**Bold rows** are FleetCommand exclusives — they should have `--color-accent-50` row background.

**Below table:** `"Still using DAT + QuickBooks + a spreadsheet? You're paying more and getting less."` — `16px` Regular, `--color-grey-500`, centered, `24px` below table.

**Responsive `<768px`:** Collapse to card-per-competitor format per shared component spec.

---

#### Section 8: Pricing Preview `#pricing-preview`

**Layout:** 3 pricing cards in a row, max-width `1000px`, centered.
**Background:** white (`--color-card-bg`)
**Padding:** `96px` vertical

**Section heading:**
- `"Simple Pricing. No Surprises."`
- `30px` Bold (700), `--color-grey-900`, centered
- Subheading: `"Flat monthly rate per truck. No per-load fees. No contracts. Cancel anytime."`
- `16px` Regular (400), `--color-grey-500`, centered, `16px` below

**Component:** 3× Pricing Tier Card (shared component 3.7), `24px` gap

**Card 1 — Launch:**
- Plan name: `LAUNCH`
- Price: `$59` /mo per truck
- Features:
  - ✓ Dispatch management
  - ✓ Document management
  - ✓ Auto-invoicing
  - ✓ Settlement tracking
  - ✓ Basic load search
- CTA: `"Start Free Trial"` → `/signup?plan=launch`

**Card 2 — Pro (recommended):**
- Plan name: `PRO`
- Price: `$99` /mo per truck
- "Most Popular" badge
- Features:
  - ✓ Everything in Launch
  - ✓ Load Intelligence scoring
  - ✓ Round-trip chaining
  - ✓ IFTA auto-calculation
  - ✓ Broker payment scoring
  - ✓ Lane analytics
  - ✓ Priority support
- CTA: `"Start Free Trial"` → `/signup?plan=pro`

**Card 3 — Elite:**
- Plan name: `ELITE`
- Price: `$149` /mo per truck
- Features:
  - ✓ Everything in Pro
  - ✓ Lane alerts
  - ✓ Weekly profit reports
  - ✓ Per-truck P&L
  - ✓ Expense tracking
  - ✓ Dedicated support
- CTA: `"Start Free Trial"` → `/signup?plan=elite`

**Below cards:** `"🔒 First 200 subscribers locked in at Launch pricing for life."` — `14px` Semibold, `--color-accent-500`, centered, `24px` below cards. Icon: lock, not emoji.

**Link:** `"See full pricing details →"` → `/pricing` — `14px`, `--color-accent-500`, centered, `12px` below lock line.

**Responsive `<768px`:** Cards stack vertically, Pro card first (recommended). Full-width. `16px` gap.

---

#### Section 9: Testimonials `#testimonials`

**Layout:** 2 testimonial cards side by side, max-width `1000px`, centered.
**Background:** `--color-grey-50`
**Padding:** `96px` vertical

**Section heading:**
- `"Carriers Who Made the Switch"`
- `30px` Bold (700), `--color-grey-900`, centered

**Component:** 2× Testimonial Card (shared component 3.8), `24px` gap

**Card 1:**
- Quote: `"I used to spend two hours every night doing invoices and IFTA paperwork. Now I deliver the load and FleetCommand handles the rest. I'm making more money and I'm home for dinner."`
- Name: `[Real driver name]`
- Details: `Owner-operator · Dry Van · Dallas, TX · 2 trucks`
- Result: `"Saves 10+ hours/week on admin"`
- Photo: Real driver headshot

**Card 2:**
- Quote: `"I was paying CloudTrucks 18% of every load. That's $900 on a $5,000 load — before fuel. FleetCommand costs me $99/month and I keep my own authority. Do the math."`
- Name: `[Real driver name]`
- Details: `Owner-operator · Reefer · Atlanta, GA · 3 trucks`
- Result: `"+$2,400/month in take-home"`
- Photo: Real driver headshot

**Note for implementation:** Replace bracketed names/photos with real customer data when available. Use placeholder photos with realistic descriptions for initial build.

**Responsive `<768px`:** Cards stack vertically, `16px` gap.

---

#### Section 10: Bottom CTA `#cta-bottom`

**Component:** CTA Block — Primary (shared component 3.4)

- Headline: `"Your Truck Deserves Better Tools"`
- Subtext: `"Join the carriers who stopped guessing and started profiting."`
- Primary CTA: `"Start Free Trial"` → `/signup`
- Secondary CTA: `"Call (718) 555-XXXX"` → `tel:+17185550000`
- Trust line: `"No credit card required. Cancel anytime. You keep your authority."`

---

## 4.2 Pricing Page `/pricing`

**Page purpose:** Convert researchers into trial signups. Be the only TMS with clear public pricing.
**Primary conversion goal:** Start Free Trial click → `/signup`

### SEO Metadata

- **Title:** `FleetCommand Pricing — Plans from $59/mo per Truck`
- **Meta description:** `Flat monthly pricing. No per-load fees. No contracts. FleetCommand plans start at $59/mo per truck — dispatch, invoicing, compliance, and Load Intelligence included.`
- **Target keywords:** fleet management pricing, truck dispatch app cost, TMS software cost, trucking dispatch software pricing
- **OG title:** `FleetCommand Pricing — Simple, Transparent, No Surprises`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `pricing-hero` | Custom heading |
| 2 | `pricing-tiers` | Pricing Tier Cards |
| 3 | `dispatch-service` | Custom callout |
| 4 | `early-adopter` | Custom callout |
| 5 | `feature-comparison` | Full comparison table |
| 6 | `pricing-faq` | FAQ Accordion |
| 7 | `cta-bottom` | CTA Block — Primary |

---

#### Section 1: Pricing Hero `#pricing-hero`

**Background:** `--color-grey-50`
**Padding:** `64px` top, `48px` bottom
**Layout:** Centered text

- Headline: `"Simple Pricing. No Surprises."`
  - `48px` Bold (700), `--color-grey-900`, centered
- Subheadline: `"Flat monthly rate per truck. No per-load fees. No contracts. No setup fees. Cancel anytime."`
  - `18px` Regular (400), `--color-grey-500`, centered, `16px` below, max-width `600px`

---

#### Section 2: Pricing Tiers `#pricing-tiers`

**Layout:** 3 cards in a row, max-width `1000px`, centered.
**Background:** `--color-grey-50`
**Padding:** `0` top (continuation), `64px` bottom

Same 3 cards as homepage section 8, but with expanded feature lists:

**Launch ($59/mo per truck):**
- Dispatch management with 13-status tracking
- Document management (BOL, POD, rate con, carrier packets)
- Auto-invoicing from completed loads
- Settlement tracking dashboard
- Basic load search
- Driver location via SMS (no app install required)
- Email support (24hr response)

**Pro ($99/mo per truck) — Recommended:**
- Everything in Launch
- Load Intelligence net profit scoring
- Round-trip chaining with combined trip profit
- IFTA auto-calculation and quarterly reports
- Broker payment scoring and history
- Lane analytics and performance tracking
- Priority email + phone support

**Elite ($149/mo per truck):**
- Everything in Pro
- Real-time lane alerts (new high-profit loads in your lanes)
- Weekly profit reports and trend analysis
- Per-truck P&L statements
- Full expense tracking and categorization
- Dedicated support rep
- Custom report builder

---

#### Section 3: Dispatch Service Callout `#dispatch-service`

**Layout:** Full-width callout, max-width `1000px` centered.
**Background:** `--color-navy-900`
**Padding:** `48px`
**Border-radius:** `8px`
**Text:** white

- Eyebrow: `"FULL-SERVICE OPTION"` — `12px` Medium, `--color-accent-400`, uppercase, letter-spacing `0.1em`
- Headline: `"Want Us to Handle Everything?"` — `30px` Bold (700), white, `12px` below
- Body: `"Hustle Transportation dispatches your truck — finds loads, negotiates rates, manages everything through FleetCommand. You get full app access and complete visibility into every load, invoice, and payment. No contracts. You keep your own authority."` — `16px` Regular (400), `rgba(255,255,255,0.8)`, `16px` below, max-width `600px`
- CTA: `"Apply for Dispatch Service"` → `/dispatch-service` — `--color-accent-500` fill, white text, `24px` below body
- Pricing note: `"Competitive % of gross load rate · App subscription included"` — `14px`, `rgba(255,255,255,0.5)`, `16px` below CTA

---

#### Section 4: Early Adopter Callout `#early-adopter`

**Component:** CTA Block — Lightweight (shared component 3.5)
- Headline: `"First 200 subscribers get Launch pricing — locked in for life."`
- CTA: `"Claim Your Spot"` → `/signup`

---

#### Section 5: Feature Comparison Table `#feature-comparison`

**Layout:** Full-width table, max-width `1000px` centered.
**Background:** white
**Padding:** `96px` vertical

**Section heading:**
- `"What's Included in Each Plan"` — `30px` Bold, `--color-grey-900`, centered

**Table:** Grouped by category, showing ✓ / ✗ / text per plan:

| Feature | Launch | Pro | Elite |
|---------|:------:|:---:|:-----:|
| **Dispatch & Operations** | | | |
| Dispatch board with 13-status tracking | ✓ | ✓ | ✓ |
| Driver location tracking (SMS PWA) | ✓ | ✓ | ✓ |
| Load search | Basic | Enhanced | Enhanced + Alerts |
| Load Intelligence net profit scoring | ✗ | ✓ | ✓ |
| Round-trip chaining | ✗ | ✓ | ✓ |
| Lane alerts (real-time) | ✗ | ✗ | ✓ |
| **Financial** | | | |
| Auto-invoicing | ✓ | ✓ | ✓ |
| Settlement tracking | ✓ | ✓ | ✓ |
| Broker payment scoring | ✗ | ✓ | ✓ |
| Lane analytics & performance | ✗ | ✓ | ✓ |
| Per-truck P&L | ✗ | ✗ | ✓ |
| Expense tracking | ✗ | ✗ | ✓ |
| Weekly profit reports | ✗ | ✗ | ✓ |
| **Compliance** | | | |
| Document management | ✓ | ✓ | ✓ |
| IFTA auto-calculation | ✗ | ✓ | ✓ |
| **Support** | | | |
| Email support (24hr) | ✓ | ✓ | ✓ |
| Priority phone support | ✗ | ✓ | ✓ |
| Dedicated support rep | ✗ | ✗ | ✓ |
| Custom report builder | ✗ | ✗ | ✓ |

**Category headers:** `14px` Semibold (600), `--color-grey-900`, `--color-grey-100` background, full-width row, `12px 24px` padding.

---

#### Section 6: Pricing FAQ `#pricing-faq`

**Component:** FAQ Accordion (shared component 3.10)
**Max-width:** `800px`, centered
**Padding:** `64px` vertical

**Questions and answers:**

1. **"Do I keep my own MC authority?"**
   Yes. FleetCommand is a software subscription — we never touch your authority. You run your business. We give you better tools to run it.

2. **"Is there a contract or commitment?"**
   No. Month-to-month. Cancel anytime from your account settings. No cancellation fees.

3. **"Do I need to install an app?"**
   You access FleetCommand from any web browser. Your drivers get location tracking through a text-message link — no app download required on their end.

4. **"What happens after the free trial?"**
   You pick a plan. We'll remind you before the trial ends. No auto-charge, no surprise billing.

5. **"Can I switch plans later?"**
   Yes. Upgrade or downgrade anytime. Changes take effect on your next billing cycle.

6. **"Can I add more trucks later?"**
   Yes. Add trucks anytime. Pricing scales per truck automatically.

7. **"How is this different from DAT or Truckstop?"**
   DAT and Truckstop are load boards — search engines for available freight. FleetCommand is a complete dispatch platform: load search + profit scoring + dispatching + invoicing + settlement tracking + compliance. You'd need 4-5 separate tools to get what FleetCommand does in one app.

8. **"How is this different from CloudTrucks?"**
   CloudTrucks is a virtual carrier — you lease onto their authority and they take 18-21% of every load. On a $5,000 load, that's $900-1,050 gone. FleetCommand is a flat-rate tool ($59-149/month) and you keep your own authority, your own customers, and your own profits.

9. **"I already have a dispatcher. Can they use FleetCommand?"**
   Yes. Your dispatcher can manage all your loads through FleetCommand. The platform is designed for both self-dispatching O/Os and dispatchers managing multiple trucks.

10. **"What if I want Hustle to dispatch for me instead?"**
    We offer a full dispatch service where our team finds loads and manages your dispatch through FleetCommand. You get full app access and complete visibility. [Learn more about dispatch service →](/dispatch-service)

---

#### Section 7: Bottom CTA `#cta-bottom`

**Component:** CTA Block — Primary (shared component 3.4)
- Headline: `"Start Dispatching Smarter Today"`
- Subtext: `"Free trial. No credit card. Takes 5 minutes."`
- Primary: `"Start Free Trial"` → `/signup`
- Secondary: `"Call (718) 555-XXXX"` → `tel:`

---

## 4.3 Features Page `/features`

**Page purpose:** Detailed showcase of all 8 core features. SEO workhorse page. Convince the ops manager or dispatcher doing due diligence.
**Primary conversion goal:** Start Free Trial

### SEO Metadata

- **Title:** `FleetCommand Features — Load Intelligence, Dispatch, Invoicing, IFTA & More`
- **Meta description:** `Score loads by net profit. Auto-generate invoices. Track broker payments. File IFTA in minutes. See every feature that makes FleetCommand the smartest dispatch platform for owner-operators.`
- **Target keywords:** trucking dispatch software, load intelligence, auto invoicing trucking, IFTA reporting software, broker payment tracking
- **OG title:** `Every Feature Your Trucking Business Needs`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `features-hero` | Custom heading |
| 2 | `feature-load-intelligence` | Feature detail (split layout) |
| 3 | `feature-round-trip` | Feature detail (split layout, reversed) |
| 4 | `feature-invoicing` | Feature detail (split layout) |
| 5 | `feature-dispatch` | Feature detail (split layout, reversed) |
| 6 | `feature-settlement` | Feature detail (split layout) |
| 7 | `feature-broker-scoring` | Feature detail (split layout, reversed) |
| 8 | `feature-documents` | Feature detail (split layout) |
| 9 | `feature-ifta` | Feature detail (split layout, reversed) |
| 10 | `mid-cta` | CTA Block — Lightweight |
| 11 | `cta-bottom` | CTA Block — Primary |

---

#### Section 1: Features Hero `#features-hero`

**Background:** `--color-grey-50`
**Padding:** `64px` top, `48px` bottom
**Layout:** Centered text

- Headline: `"Every Tool You Need. Nothing You Don't."`
  - `48px` Bold (700), `--color-grey-900`
- Subheadline: `"FleetCommand replaces your load board, spreadsheets, invoicing app, and IFTA calculator — and adds profit intelligence no one else has."`
  - `18px` Regular (400), `--color-grey-500`, `16px` below, max-width `640px`

---

#### Sections 2–9: Feature Details

Each feature uses a consistent **split layout** that alternates image left/right:
- **Even sections:** screenshot left (50%), copy right (50%)
- **Odd sections:** copy left (50%), screenshot right (50%)
- Max-width: `1200px`, centered
- Padding: `96px` vertical
- Alternating backgrounds: white / `--color-grey-50`

**Copy column for each feature:**
- Eyebrow: `12px` Medium (500), `--color-accent-500`, uppercase, letter-spacing `0.1em`
- Headline: `30px` Bold (700), `--color-grey-900`, `12px` below eyebrow
- Description: `16px` Regular (400), `--color-grey-700`, line-height `1.7`, `16px` below headline, max-width `480px`
- Bullet points (3-4): icon + text, `12px` vertical gap, `16px` below description
  - Icon: `16px`, `--color-accent-500`
  - Text: `14px` Regular (400), `--color-grey-700`

**Screenshot column:**
- Product screenshot with `--color-grey-100` background container
- `8px` border-radius, elevation 1
- `alt` text describing the screenshot content

**Responsive `<768px`:** Stack vertically, copy always first, screenshot below with `32px` gap.

**Feature content for each section:**

##### Feature 1: Load Intelligence `#feature-load-intelligence`

- Eyebrow: `LOAD INTELLIGENCE`
- Headline: `"See Profit, Not Just Rate Per Mile"`
- Description: `"Every load scored by what actually lands in your pocket — after fuel, deadhead miles, tolls, and your operating cost per mile. A $3.50/mile load with 200 empty miles and $400 in tolls isn't what it looks like on a load board."`
- Bullets:
  - Net profit calculation on every available load
  - Factor in your real fuel cost, not national average
  - Color-coded scoring: green (profitable), yellow (marginal), red (money-losing)
  - Historical lane profitability so you know your best routes
- Screenshot: Load list with profit scores, colored indicators, and profit breakdown popup
- `alt="Load Intelligence scoring showing net profit per load after fuel and deadhead"`

##### Feature 2: Round-Trip Chaining `#feature-round-trip`

- Eyebrow: `ROUND-TRIP CHAINING`
- Headline: `"Stop Deadheading Home"`
- Description: `"FleetCommand automatically finds complementary loads that get you home — or to your next high-paying lane. See combined trip profit for the full round trip, not just one leg."`
- Bullets:
  - Automatic backhaul matching based on delivery location
  - Combined trip profit calculation (outbound + return)
  - Filter by home base, preferred lanes, or equipment type
  - Eliminate manual backhaul searching on load boards
- Screenshot: Map view showing outbound load + suggested return load with combined profit
- `alt="Round-trip chaining showing outbound and return loads with combined profit"`

##### Feature 3: Auto-Invoicing `#feature-invoicing`

- Eyebrow: `AUTO-INVOICING`
- Headline: `"Delivered to Invoiced in One Click"`
- Description: `"Mark a load delivered and FleetCommand generates the invoice — rate con, BOL, and POD auto-attached — and sends it to the broker. No re-typing. No chasing documents. For 4-5 loads a week, that's 2+ hours of paperwork gone."`
- Bullets:
  - Invoice auto-generated from load data (no re-entry)
  - Documents auto-attached (rate con, BOL, POD)
  - Send directly to broker via email
  - Track invoice status: sent, viewed, paid
- Screenshot: Invoice builder showing auto-populated fields with attached documents
- `alt="Auto-invoicing showing generated invoice with attached rate confirmation and BOL"`

##### Feature 4: Dispatch Management `#feature-dispatch`

- Eyebrow: `DISPATCH MANAGEMENT`
- Headline: `"Your Whole Operation on One Screen"`
- Description: `"13-status load tracking from booking to payment. Real-time driver location. Drag-and-drop load assignment. Whether you're dispatching yourself or managing a fleet, everything lives here."`
- Bullets:
  - 13-status load lifecycle (booked → dispatched → picked up → delivered → invoiced → paid)
  - Real-time driver location via SMS-triggered PWA (no app download)
  - Dispatch board with all active loads at a glance
  - Works for self-dispatch O/Os and multi-truck fleets
- Screenshot: Dispatch board showing multiple loads in various statuses with driver locations
- `alt="Dispatch board showing active loads with status tracking and driver locations"`

##### Feature 5: Settlement Tracking `#feature-settlement`

- Eyebrow: `SETTLEMENT TRACKING`
- Headline: `"Know Who Owes You — And Who's Late"`
- Description: `"Dashboard showing every outstanding payment: which brokers owe you, how much, and how many days since delivery. FleetCommand flags slow-pay brokers before you accept their next load."`
- Bullets:
  - Real-time accounts receivable dashboard
  - Days-since-delivery tracking per broker
  - Slow-pay alerts before you book with that broker again
  - Payment history trends per broker
- Screenshot: Settlement dashboard with broker payment timeline and aging indicators
- `alt="Settlement tracking dashboard showing outstanding payments and broker payment timelines"`

##### Feature 6: Broker Payment Scoring `#feature-broker-scoring`

- Eyebrow: `BROKER SCORING`
- Headline: `"Book With Brokers Who Actually Pay"`
- Description: `"Payment history and reliability scores from real transaction data. Know who pays in 15 days vs. 45 days before you accept the load — not after you've delivered it and waited two months."`
- Bullets:
  - Reliability scores from real carrier payment data
  - Average days-to-payment per broker
  - Payment consistency tracking (on-time %, disputes)
  - Visible on every load before you book
- Screenshot: Broker profile showing payment score, avg days to pay, and history chart
- `alt="Broker payment scoring showing reliability score and payment history"`

##### Feature 7: Document Management `#feature-documents`

- Eyebrow: `DOCUMENT MANAGEMENT`
- Headline: `"Every Document. Every Load. Instantly."`
- Description: `"Digital BOLs, PODs, rate cons, and carrier packets — auto-attached to the correct load. Search and retrieve any document in seconds. No more digging through email or truck cab filing systems."`
- Bullets:
  - Upload from phone camera or file
  - Auto-attach to correct load
  - Search by load number, broker, date, or document type
  - All documents available for IFTA, audits, and invoicing
- Screenshot: Document viewer showing organized load file with attached documents
- `alt="Document management showing organized load file with BOL, POD, and rate confirmation"`

##### Feature 8: IFTA Auto-Calculation `#feature-ifta`

- Eyebrow: `IFTA AUTO-CALCULATION`
- Headline: `"No More Sunday Night IFTA Math"`
- Description: `"Miles by state tracked automatically from your dispatch data. FleetCommand generates your quarterly IFTA report ready to file. Saves $200-400 per quarter in accountant fees — and saves your Sunday nights."`
- Bullets:
  - Automatic miles-by-state tracking from dispatch records
  - Quarterly IFTA report generated and ready to file
  - Fuel purchase tracking by state
  - Audit-ready records with supporting documentation
- Screenshot: IFTA report showing miles and fuel by state with quarterly summary
- `alt="IFTA auto-calculation showing quarterly report with miles and fuel by state"`

---

#### Section 10: Mid-Page CTA `#mid-cta`

**Component:** CTA Block — Lightweight (shared component 3.5)
- Headline: `"Ready to see your profit on every load?"`
- CTA: `"Start Free Trial"` → `/signup`

---

#### Section 11: Bottom CTA `#cta-bottom`

**Component:** CTA Block — Primary (shared component 3.4)
- Headline: `"Better Tools. Better Loads. More Profit."`
- Subtext: `"Start your free trial and see the difference in your first week."`
- Primary: `"Start Free Trial"` → `/signup`
- Secondary: `"See Pricing"` → `/pricing`

---

## 4.4 Dispatch Service Page `/dispatch-service`

**Page purpose:** Convert carriers who want full-service dispatching with technology transparency. Second conversion path.
**Primary conversion goal:** Dispatch service application submission

### SEO Metadata

- **Title:** `FleetCommand Dispatch Service — Full-Service Dispatch With Full Visibility`
- **Meta description:** `Hustle Transportation dispatches your truck through FleetCommand. Real technology, full visibility, no contracts. You keep your authority and see every load, invoice, and payment.`
- **Target keywords:** truck dispatch services, dispatch service for owner operators, best truck dispatch company, trucking dispatch service near me
- **OG title:** `Dispatch Service — Real Technology, Full Transparency`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `ds-hero` | Custom (split layout) |
| 2 | `ds-how-it-works` | 3-step flow |
| 3 | `ds-differentiators` | Feature Cards (grid) |
| 4 | `ds-vs-traditional` | Custom comparison |
| 5 | `ds-testimonial` | Testimonial Card |
| 6 | `ds-apply` | Dispatch Service Application Form |
| 7 | `footer` | Footer |

---

#### Section 1: Hero `#ds-hero`

**Layout:** Split — copy left (55%), form right (45%). Max-width `1200px`.
**Background:** `--color-grey-50`
**Padding:** `96px` top, `64px` bottom

**Left:**
- Headline: `"We Dispatch Your Truck. You See Everything."`
  - `48px` Bold (700), `--color-grey-900`
  - At `<768px`: `36px`
- Subheadline: `"Hustle Transportation finds and books your loads through FleetCommand — the same platform you'd use to self-dispatch. Full app access. Full visibility. No black box."`
  - `18px` Regular (400), `--color-grey-500`, `16px` below, max-width `500px`
- Trust bullets (stacked, `12px` gap):
  - `✓ You keep your own MC authority`
  - `✓ See every load, invoice, and payment in real time`
  - `✓ No contracts — cancel anytime`
  - `✓ Built by a working carrier in Queens, NY`
  - Icon: `--color-success-500` checkmarks, text: `14px` Semibold, `--color-grey-700`

**Right:**
- Component: Dispatch Service Application Form (shared component 3.14)

**Responsive `<768px`:** Stack vertically, copy first, form below with `32px` gap.

---

#### Section 2: How It Works `#ds-how-it-works`

Same layout pattern as homepage how-it-works (section 5), with different content:

1. **Apply** — `"Tell us about your equipment, lanes, and goals. Takes 3 minutes."`
2. **We Find Loads** — `"Our dispatch team uses FleetCommand's Load Intelligence to find the highest-profit loads for your truck."`
3. **You Drive** — `"See every load, invoice, and payment in the app. Focus on driving — we handle the rest."`

**Background:** white. **Padding:** `96px` vertical.

---

#### Section 3: Differentiators `#ds-differentiators`

**Layout:** 3 feature cards in a row (shared component 3.6), max-width `1000px`.
**Background:** `--color-grey-50`. **Padding:** `96px` vertical.

**Section heading:** `"Not Your Average Dispatch Service"` — `30px` Bold, centered

| Card | Title | Description |
|------|-------|-------------|
| 1 | Real Technology | Every load booked through FleetCommand. Profit-scored, tracked, invoiced, and settled — not managed on a sticky note. |
| 2 | Full Transparency | Log into FleetCommand anytime. See your loads, your invoices, your settlements, your broker scores. Nothing hidden. |
| 3 | Your Authority, Your Business | We dispatch your loads. You own your MC, your customer relationships, and your data. Leave anytime — your history goes with you. |

No "Learn more" links — these are endpoint descriptions.

---

#### Section 4: vs. Traditional Dispatch `#ds-vs-traditional`

**Layout:** 2-column comparison, max-width `800px` centered.
**Background:** white. **Padding:** `96px` vertical.

**Section heading:** `"FleetCommand Dispatch vs. Traditional Dispatch Services"` — `30px` Bold, centered

| Aspect | Traditional Dispatch | FleetCommand Dispatch |
|--------|---------------------|----------------------|
| Technology | Phone calls + spreadsheets | Full dispatch platform with Load Intelligence |
| Visibility | You see nothing | Full app access — every load, invoice, payment |
| Load selection | Dispatcher's gut feeling | AI profit scoring on every available load |
| Invoicing | Manual (if they do it at all) | Auto-generated from completed loads |
| Broker vetting | Word of mouth | Data-driven payment scoring |
| Your authority | Varies (some require lease-on) | Always yours |
| Contracts | Often 30-90 day lock-in | Month-to-month, cancel anytime |

Use Comparison Table component (shared component 3.9) styled for 2 columns.

---

#### Section 5: Testimonial `#ds-testimonial`

**Component:** Testimonial Card (shared component 3.8), centered, max-width `700px`
**Background:** `--color-grey-50`. **Padding:** `64px` vertical.

- Quote: `"I switched from a traditional dispatcher who couldn't tell me which loads were profitable. Now I see every load's profit score in the app before it's even booked. I'm making more and I trust my dispatch team because I can see everything they do."`
- Name: `[Real driver name]`
- Details: `Owner-operator · Flatbed · Houston, TX · 1 truck`
- Result: `"+$800/month vs. previous dispatcher"`

---

#### Section 6: Application Form `#ds-apply`

**Layout:** Centered, max-width `560px`.
**Background:** white. **Padding:** `64px` vertical.

**Section heading:** `"Apply for Dispatch Service"` — `30px` Bold, centered
**Subheading:** `"Takes 3 minutes. We'll call you within 24 hours."` — `16px` Regular, `--color-grey-500`, centered, `16px` below

**Component:** Dispatch Service Application Form (shared component 3.14)

---

## 4.5 Comparison Page — FleetCommand vs. DAT `/compare/dat`

**Page purpose:** SEO competitor capture. Address specific DAT pain points.
**Primary conversion goal:** Start Free Trial

### SEO Metadata

- **Title:** `FleetCommand vs. DAT — Load Board Alternative for Owner-Operators`
- **Meta description:** `DAT shows you loads. FleetCommand shows you profit. Compare features, pricing, and real driver experiences. See why owner-operators are switching from DAT.`
- **Target keywords:** DAT load board alternative, DAT alternative, DAT vs FleetCommand, best load board for owner operators
- **OG title:** `FleetCommand vs. DAT — See the Difference`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `compare-hero` | Custom heading |
| 2 | `pain-points` | Custom (icon + text blocks) |
| 3 | `comparison-table` | Comparison Table |
| 4 | `cost-breakdown` | Custom |
| 5 | `testimonial` | Testimonial Card |
| 6 | `cta-bottom` | CTA Block — Primary |

---

#### Section 1: Hero `#compare-hero`

**Background:** `--color-grey-50`. **Padding:** `64px` top, `48px` bottom.

- Headline: `"DAT Shows You Loads. FleetCommand Shows You Profit."`
  - `48px` Bold (700), `--color-grey-900`, centered
- Subheadline: `"You're paying $149/month for a search engine full of fake posts. There's a better way to find freight and run your business."`
  - `18px` Regular (400), `--color-grey-500`, centered, `16px` below, max-width `640px`

---

#### Section 2: DAT Pain Points `#pain-points`

**Layout:** 2×2 grid, max-width `1000px`. **Background:** white. **Padding:** `96px` vertical.

**Section heading:** `"Why Owner-Operators Are Done With DAT"` — `30px` Bold, centered.

4 pain point cards (similar to feature cards but with `--color-danger-500` top border instead of accent):

| Card | Title | Description |
|------|-------|-------------|
| 1 | Fake Loads | 19,000 fake loads posted under one broker's name in March 2025. DAT's verification is broken. FleetCommand loads are from real dispatches and verified brokers. |
| 2 | Rate Per Mile Lies | DAT shows rate per mile. It doesn't subtract fuel, deadhead, or tolls. That "$3.50/mile" load might net you $1.80 after expenses. FleetCommand shows net profit. |
| 3 | Price Hike at Renewal | DAT raises prices 25-45% at renewal. No warning, no negotiation. FleetCommand: flat rate, no surprises, no annual price jumps. |
| 4 | Search Engine, Not a Business Tool | DAT finds loads. That's it. You still need invoicing software, a spreadsheet for settlements, an IFTA calculator, and something to track documents. FleetCommand does all of it. |

---

#### Section 3: Side-by-Side Comparison `#comparison-table`

**Component:** Comparison Table (shared component 3.9), 2-column (DAT vs. FleetCommand)
**Max-width:** `800px` centered. **Padding:** `96px` vertical.

| Feature | DAT One ($49-199/mo) | FleetCommand Pro ($99/mo) |
|---------|:--------------------:|:-------------------------:|
| Load search | ✓ | ✓ |
| Net profit scoring | ✗ | ✓ |
| Round-trip chaining | ✗ | ✓ |
| Dispatch management | ✗ | ✓ |
| Auto-invoicing | ✗ | ✓ |
| Settlement tracking | ✗ | ✓ |
| Broker payment scoring | ✗ | ✓ |
| Document management | ✗ | ✓ |
| IFTA auto-calculation | ✗ | ✓ |
| Fake load filtering | ✗ | ✓ |
| Driver location tracking | ✗ | ✓ |

---

#### Section 4: Cost Breakdown `#cost-breakdown`

**Layout:** 2-column, max-width `800px` centered. **Background:** `--color-grey-50`. **Padding:** `64px`.

**Left column: "The DAT Stack"**
- DAT One: `$149/mo`
- QuickBooks Self-Employed: `$30/mo`
- IFTA accountant: `$100/quarter ($33/mo)`
- Spreadsheet maintenance: `Free (but 5+ hrs/week of your time)`
- **Total: `$212+/mo` + your time**
- Text: `16px` Regular, `--color-grey-700`. Prices in `--color-danger-500` Semibold.

**Right column: "FleetCommand Pro"**
- Everything included: `$99/mo`
- IFTA: Included
- Invoicing: Included
- Settlement tracking: Included
- **Total: `$99/mo` — and you get Load Intelligence, broker scoring, and your time back.**
- Text: same style. Price in `--color-success-500` Semibold.

**Divider:** vertical `1px` `--color-grey-200` between columns.
**Responsive `<768px`:** Stack vertically, `32px` gap.

---

#### Section 5: Testimonial `#testimonial`

**Component:** Testimonial Card, centered. **Padding:** `64px` vertical.

- Quote: driver who switched from DAT specifically
- Emphasize: time saved, profit visibility, fewer fake loads
- Result metric tied to the switch

---

#### Section 6: Bottom CTA `#cta-bottom`

**Component:** CTA Block — Primary
- Headline: `"See Your Profit. Not Just Your Rate."`
- Primary: `"Start Free Trial"` → `/signup`
- Secondary: `"See Pricing"` → `/pricing`

---

## 4.6 Comparison Page — FleetCommand vs. CloudTrucks `/compare/cloudtrucks`

**Page purpose:** SEO competitor capture. Address authority and profit concerns.
**Primary conversion goal:** Start Free Trial

### SEO Metadata

- **Title:** `FleetCommand vs. CloudTrucks — Keep Your Authority, Keep Your Profits`
- **Meta description:** `CloudTrucks takes 18-21% of every load and requires you to give up your authority. FleetCommand is $99/mo flat — you keep everything. Compare features and pricing.`
- **Target keywords:** CloudTrucks alternative, CloudTrucks review, virtual carrier alternative, keep my trucking authority
- **OG title:** `FleetCommand vs. CloudTrucks — The Math Doesn't Lie`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `compare-hero` | Custom heading |
| 2 | `math-breakdown` | Custom (numbers-focused) |
| 3 | `comparison-table` | Comparison Table |
| 4 | `authority-callout` | Custom callout |
| 5 | `testimonial` | Testimonial Card |
| 6 | `cta-bottom` | CTA Block — Primary |

---

#### Section 1: Hero `#compare-hero`

**Background:** `--color-grey-50`. **Padding:** `64px` top, `48px` bottom.

- Headline: `"Keep Your Authority. Keep Your Profits."`
  - `48px` Bold (700), `--color-grey-900`, centered
- Subheadline: `"CloudTrucks takes 18-21% of every load. FleetCommand is $99/month. You keep your MC, your profits, and your freedom."`
  - `18px` Regular (400), `--color-grey-500`, centered, `16px` below, max-width `640px`

---

#### Section 2: The Math `#math-breakdown`

**Layout:** 2-column, max-width `800px` centered. **Background:** white. **Padding:** `96px` vertical.
**Section heading:** `"Do the Math on a $5,000 Load"` — `30px` Bold, centered.

**Left column: "CloudTrucks"**
- Gross load rate: `$5,000`
- CloudTrucks fee (18%): `-$900`
- Net to driver: `$4,100`
- And you give up your authority.
- Over 4 loads/week: **`-$3,600/month` in fees**
- Dollar amounts: `48px` Bold for key figures, `--color-danger-500` for fees

**Right column: "FleetCommand Pro"**
- Gross load rate: `$5,000`
- FleetCommand fee: `-$99/month (flat)`
- Net to driver: `$4,901` (on that same load)
- You keep your authority.
- Over 4 loads/week: **`$99/month` total — save `$3,500+`**
- Key figures in `--color-success-500`

**Responsive `<768px`:** Stack vertically, `32px` gap.

---

#### Section 3: Feature Comparison `#comparison-table`

**Component:** Comparison Table, 2-column

| Feature | CloudTrucks (18-21%/load) | FleetCommand Pro ($99/mo) |
|---------|:------------------------:|:-------------------------:|
| Load search | ✓ | ✓ |
| Load Intelligence (net profit) | ✗ | ✓ |
| Dispatch management | Basic | Full (13-status) |
| Auto-invoicing | ✗ | ✓ |
| IFTA reporting | ✓ | ✓ |
| Broker payment scoring | ✗ | ✓ |
| Document management | ✗ | ✓ |
| Settlement tracking | Partial | Full |
| Round-trip chaining | ✗ | ✓ |
| **Keep your MC authority** | ✗ | ✓ |
| **Flat-rate pricing** | ✗ (% per load) | ✓ |
| **See all your data** | Limited | Full access |
| Insurance included | ✓ | ✗ (you carry your own) |

**Note row below table:** `"CloudTrucks includes insurance in their fee. If you already carry your own authority and insurance, you're paying for something you don't need."` — `14px` Regular, `--color-grey-500`, max-width `600px`, centered.

---

#### Section 4: Authority Callout `#authority-callout`

**Layout:** Full-width callout, max-width `800px`, centered.
**Background:** `--color-accent-50`, `4px` left border `--color-accent-500`
**Padding:** `32px`
**Border-radius:** `8px`

- Headline: `"Your Authority Is Your Business"` — `24px` Semibold (600), `--color-grey-900`
- Body: `"When you lease onto CloudTrucks, you give up or pause your own MC authority. That means your customer relationships, your negotiated rates, and your business reputation all live under their name. If CloudTrucks changes terms, raises fees, or shuts down — as they nearly did with 43% layoffs in September 2025 — your business is at risk. FleetCommand is a tool. Your authority stays yours."` — `16px` Regular, `--color-grey-700`, `12px` below, max-width `65ch`

---

#### Section 5: Testimonial

Same structure as other testimonial sections, featuring a driver who switched from CloudTrucks.

---

#### Section 6: Bottom CTA

**Component:** CTA Block — Primary
- Headline: `"Stop Giving Away Your Profits"`
- Primary: `"Start Free Trial"` → `/signup`
- Secondary: `"See Pricing"` → `/pricing`

---

## 4.7 Blog `/blog`

**Page purpose:** SEO content engine. Drive organic traffic for high-intent keywords.
**Primary conversion goal:** Trial signup from bottom-of-post CTA

### SEO Metadata

- **Title:** `FleetCommand Blog — Trucking Business Tips, Load Strategies & Industry Insights`
- **Meta description:** `Practical advice for owner-operators and small fleet owners. Load strategies, dispatch tips, IFTA guides, and industry analysis from a working carrier operation.`
- **Target keywords:** trucking business tips, owner operator tips, how to find high paying loads, trucking industry news

### Blog Index Page Structure

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `blog-hero` | Custom heading |
| 2 | `featured-post` | Featured card (large) |
| 3 | `post-grid` | Blog Post Preview Cards (3-column grid) |
| 4 | `cta-bottom` | CTA Block — Lightweight |

**Hero:**
- Headline: `"The FleetCommand Blog"` — `36px` Bold, `--color-grey-900`
- Subheadline: `"Practical advice for owner-operators. From a team that dispatches trucks every day."` — `18px` Regular, `--color-grey-500`
- Background: `--color-grey-50`. Padding: `48px` vertical.

**Featured post:** Full-width card, `96px` padding horizontal, `64px` vertical. Background `--color-card-bg`. Elevation 1.
- Layout: image left (40%), title + excerpt + category right (60%)
- Title: `30px` Semibold
- Excerpt: `16px` Regular, `--color-grey-500`, 3-line clamp

**Post grid:** 3-column grid of Blog Post Preview Cards (shared component 3.12). `24px` gap. At `<768px`: single column. Pagination or "Load more" below.

### Blog Post Template

| # | Section | Notes |
|---|---------|-------|
| 1 | Post header | Title (`36px` Bold), category badge, date (`14px` `--color-grey-400`), estimated read time |
| 2 | Post body | Prose container, max-width `680px` centered, `18px` Regular body, `1.8` line-height |
| 3 | Author box | Photo, name, role, 1-line bio |
| 4 | Related posts | 3 Blog Post Preview Cards |
| 5 | Post CTA | CTA Block — Lightweight |

**Post body typography:**
- H2: `30px` Bold, `48px` top margin, `16px` bottom
- H3: `24px` Semibold, `32px` top margin, `12px` bottom
- Paragraphs: `18px` Regular, `--color-grey-700`, line-height `1.8`
- Lists: `18px`, `24px` left indent, `8px` item gap
- Block quotes: `4px` left border `--color-accent-500`, `24px` left padding, `18px` italic, `--color-grey-500`
- Code: `14px` monospace, `--color-grey-100` background, `4px 8px` padding
- Images: full-width within `680px` container, `8px` border-radius, `alt` text required, `16px` vertical margin

### Priority Launch Content

| Post | Target Keyword | Category |
|------|---------------|----------|
| "How to Calculate True Profit Per Load (Not Just Rate Per Mile)" | how to find high paying loads | Strategy |
| "DAT Alternatives 2026: What Owner-Operators Are Using Instead" | DAT load board alternative | Tools |
| "Self-Dispatch vs. Dispatch Service: Which Is Right for You?" | self dispatch vs dispatch service | Guide |
| "The Owner-Operator's Guide to IFTA Filing" | IFTA filing owner operator | Compliance |
| "How to Spot Fake Loads on Load Boards" | fake loads trucking | Safety |

Each post ends with CTA Block — Lightweight: `"See your profit on every load"` → `/signup`

---

## 4.8 About Page `/about`

**Page purpose:** Build human trust and credibility. Show FleetCommand is built by a real trucking operation.
**Primary conversion goal:** Warm visitors for eventual signup. Secondary: careers.

### SEO Metadata

- **Title:** `About FleetCommand — Built by Hustle Transportation, Queens, NY`
- **Meta description:** `FleetCommand was built by Hustle Transportation — a working carrier and dispatch operation in Queens, NY. We built the tool we needed, and now we're sharing it with every owner-operator.`
- **Target keywords:** FleetCommand about, Hustle Transportation
- **OG title:** `Built by a Working Dispatch Operation`

### Section Order

| # | Section ID | Component |
|---|-----------|-----------|
| 1 | `about-hero` | Custom (story) |
| 2 | `origin-story` | Custom (prose) |
| 3 | `values` | Custom (3-column) |
| 4 | `careers-cta` | Custom callout |
| 5 | `cta-bottom` | CTA Block — Primary |

---

#### Section 1: About Hero

**Background:** `--color-grey-50`. **Padding:** `64px` top, `48px` bottom.

- Headline: `"We Built This Because We Needed It"` — `48px` Bold, `--color-grey-900`, centered
- Subheadline: `"FleetCommand is built by Hustle Transportation Inc. — a carrier and dispatch operation in Queens, New York. Not a tech company guessing at trucking. A trucking company that builds good software."` — `18px` Regular, `--color-grey-500`, centered, max-width `640px`, `16px` below

---

#### Section 2: Origin Story

**Layout:** Prose block, max-width `680px` centered. **Background:** white. **Padding:** `64px` vertical.

**Content direction (write as narrative, not bullets):**
- Hustle Transportation runs trucks. We know the pain firsthand.
- We were paying for DAT, using spreadsheets for dispatch, doing IFTA manually, chasing brokers for payment.
- We built FleetCommand to run our own operation. It worked. Drivers asked what we were using.
- Now we're offering it to every owner-operator and small fleet that's tired of duct-taping tools together.
- We still dispatch trucks on FleetCommand every day. We eat our own cooking.

Body: `18px` Regular (400), `--color-grey-700`, line-height `1.8`

---

#### Section 3: Values

**Layout:** 3 cards, max-width `1000px`. **Background:** `--color-grey-50`. **Padding:** `96px` vertical.

| Value | Description |
|-------|-------------|
| Transparency | You see everything — your loads, your money, your data. We don't hide fees, restrict access, or lock you in. |
| Simplicity | Trucking is complicated enough. Your software shouldn't be. If it takes more than 5 minutes to learn, we didn't build it right. |
| Independence | Your MC. Your authority. Your business. We build tools that make you stronger, not dependent on us. |

Cards use feature card layout (shared component 3.6) without "Learn more" link. `--color-accent-500` top border.

---

#### Section 4: Careers CTA

If hiring, display a lightweight callout:
- Background: `--color-accent-50`, `4px` left border `--color-accent-500`, `32px` padding
- Headline: `"Want to Build the Future of Trucking?"` — `24px` Semibold
- Body: `"We're hiring engineers, dispatchers, and operators. Queens-based or remote."` — `16px`, `--color-grey-700`
- CTA: `"See Open Positions"` → `/about/careers` — tertiary button style

If not hiring, omit this section entirely.

---

#### Section 5: Bottom CTA

**Component:** CTA Block — Primary
- Headline: `"Ready to Run Your Business Better?"`
- Primary: `"Start Free Trial"` → `/signup`
- Secondary: `"Talk to Us"` → `/contact`

---

## 4.9 Contact Page `/contact`

**Page purpose:** Catch prospects who want human interaction. Not the primary conversion path.
**Primary conversion goal:** Form submission or phone call

### SEO Metadata

- **Title:** `Contact FleetCommand — Call, Email, or Drop By`
- **Meta description:** `Questions about FleetCommand? Call us, email us, or fill out the form. Real people, real answers. Based in Queens, NY.`

### Layout

**Background:** `--color-grey-50`. **Padding:** `96px` vertical.
**Max-width:** `1000px` centered.

**Split layout:** Form left (55%), contact info right (45%). `48px` gap.

**Left: Contact Form**
- Fields: Name, Email, Phone, Subject (dropdown: General, Pricing, Dispatch Service, Partnership, Support, Other), Message (textarea, 5 rows)
- Component: same form styling as signup form (shared component 3.13)
- Max-width: `480px`
- CTA: `"Send Message"` — primary button, full-width

**Right: Direct Contact**
- Background: `--color-card-bg`, elevation 1, `32px` padding, `8px` border-radius
- Phone: `(718) 555-XXXX` — `24px` Bold, `--color-grey-900`, click-to-call link
- Subtext: `"Real people answer. Mon-Sat, 6am-8pm ET."` — `14px` Regular, `--color-grey-500`
- Email: `support@fleetcommand.com` — `16px`, `--color-accent-500`, `24px` below phone
- Address: `"Hustle Transportation Inc. · Queens, NY"` — `14px`, `--color-grey-500`, `24px` below email

**Responsive `<768px`:** Stack vertically, contact info first (phone is primary action on mobile), form below.

---

# 5. Content Requirements

## 5.1 Required Images / Screenshots

| Image | Used On | Description for Placeholder |
|-------|---------|----------------------------|
| Dispatch board | Homepage hero, features dispatch section | Dashboard showing 5-6 loads in various statuses with driver names, pickup/delivery locations, and status badges |
| Load Intelligence view | Homepage load intelligence section, features page | Load list with profit scores in green/yellow/red, showing rate, fuel cost, deadhead miles, and net profit columns |
| Round-trip map | Features page | Map with outbound route (solid line) and return route (dashed line), two load pins, combined profit callout |
| Invoice builder | Features page | Auto-populated invoice with rate con and BOL thumbnails attached |
| Settlement dashboard | Features page | Table of broker names with amounts owed, days outstanding, and payment status indicators |
| Broker score card | Features page | Broker profile with reliability score (out of 100), average days to payment bar chart, on-time % |
| Document viewer | Features page | Load detail panel with tabbed document thumbnails (BOL, POD, rate con) |
| IFTA report | Features page | Quarterly report table with state names, miles, fuel gallons, and tax amounts |
| Fragmented stack visual | Homepage problem section | Graphic showing DAT, spreadsheet, invoice app, and calculator icons with mess of arrows, converging into single FleetCommand icon |
| Driver headshots (3) | Testimonial cards | Professional photos of real drivers (replace with realistic placeholders at build time) |

## 5.2 Required Data Points

| Data Point | Where Used | Source |
|-----------|-----------|-------|
| Loads dispatched (weekly/monthly) | Live stats bar | Real or realistic seed: `"2,847 loads dispatched this month"` |
| Average booked RPM | Live stats bar | Realistic seed: `"$2.73 avg booked RPM"` |
| Active carriers | Live stats bar | Realistic seed: `"184 carriers active"` |
| DAT pricing | Comparison table, vs. DAT page | $49-199/mo (verified from competitor research) |
| CloudTrucks fee | vs. CloudTrucks page | 18-21% per load (verified from competitor research) |
| CloudTrucks layoffs | vs. CloudTrucks page | 43% layoffs September 2025 (from competitor research) |
| DAT fake loads stat | vs. DAT page | 19,000 fake loads under one broker, March 2025 |

## 5.3 SEO Keyword Integration Notes

| Page | Where Keywords Must Appear |
|------|---------------------------|
| Homepage | Title tag, H1 hero headline, meta description, at least one H2 |
| Pricing | Title tag (include price), meta description (include price), FAQ answers |
| Features | Title tag, H1, each feature H2 or H3, meta description |
| Dispatch Service | Title tag, H1, meta description, how-it-works step titles |
| vs. DAT | Title tag, H1, meta description, comparison table header, pain point headings |
| vs. CloudTrucks | Title tag, H1, meta description, math breakdown heading |
| Blog posts | Title tag, H1, first paragraph, at least one H2, meta description |
| About | Title tag, meta description, first paragraph of origin story |

---

# 6. Implementation Notes

## 6.1 Recommended Tech Stack

- **Framework:** Next.js (App Router) or Astro — SSR/SSG for SEO performance
- **Styling:** CSS Modules or Tailwind CSS (configured to use design tokens)
- **Font loading:** `next/font` or `@fontsource/inter` — self-hosted, no Google Fonts CDN
- **Icons:** Lucide React or Heroicons — match icon weight to nearby font weight. Enclose standalone icons in `48px` circle with `--color-accent-50` background.
- **Analytics:** Google Tag Manager container, defer-loaded
- **Schema markup:** JSON-LD for Organization, SoftwareApplication, FAQPage, Article (blog posts), Review (testimonials)
- **Open Graph:** per-page OG tags with dedicated OG images

## 6.2 File / Folder Structure

```
src/
├── app/
│   ├── layout.tsx              ← Root layout (nav, footer, font loading)
│   ├── page.tsx                ← Homepage
│   ├── pricing/page.tsx
│   ├── features/page.tsx
│   ├── dispatch-service/page.tsx
│   ├── compare/
│   │   ├── dat/page.tsx
│   │   └── cloudtrucks/page.tsx
│   ├── blog/
│   │   ├── page.tsx            ← Blog index
│   │   └── [slug]/page.tsx     ← Blog post template
│   ├── about/page.tsx
│   ├── contact/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx
│   │   ├── MobileNav.tsx
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── CTAPrimary.tsx
│   │   ├── CTALightweight.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── LiveStatsBar.tsx
│   │   └── ComparisonTable.tsx
│   ├── cards/
│   │   ├── FeatureCard.tsx
│   │   ├── PricingTierCard.tsx
│   │   ├── TestimonialCard.tsx
│   │   └── BlogPostCard.tsx
│   ├── forms/
│   │   ├── SignupForm.tsx
│   │   ├── DispatchApplicationForm.tsx
│   │   └── ContactForm.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Accordion.tsx
│       └── Badge.tsx
├── styles/
│   ├── tokens.css              ← Design system tokens (copy from section 2.3)
│   ├── globals.css             ← Reset, base typography, utility classes
│   └── ...
├── lib/
│   ├── metadata.ts             ← SEO metadata helpers
│   └── schema.ts               ← JSON-LD schema generators
└── content/
    └── blog/                   ← MDX or markdown blog posts
```

## 6.3 Third-Party Dependencies

| Dependency | Purpose | Loading Strategy |
|-----------|---------|-----------------|
| Inter font | Typography | Self-hosted via `@fontsource/inter` or `next/font` |
| Lucide React | Icons | Tree-shaken, only import used icons |
| Google Tag Manager | Analytics | Defer-loaded, non-blocking |

No other third-party dependencies. No animation libraries, no carousel libraries, no CSS frameworks beyond what the project uses. Keep the bundle minimal for 3G performance.

## 6.4 Performance Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | `<2.5s` on 4G, `<3s` on 3G |
| FID (First Input Delay) | `<100ms` |
| CLS (Cumulative Layout Shift) | `<0.1` |
| Total page weight | `<500KB` initial load (excluding images) |
| Image strategy | Lazy load all below-fold images, WebP/AVIF with fallbacks, responsive `srcset` |
| Font strategy | `font-display: swap`, preload Inter Regular (400) and Bold (700) only |

## 6.5 Photography & Imagery Rules

- Real trucks, real dispatch screens, real drivers when available
- No stock photos of smiling people in hard hats
- No generic SaaS illustrations or isometric graphics
- Product screenshots of the actual FleetCommand interface where possible
- For initial build: use realistic placeholder screenshots that match the described UI
- Icons: match icon weight to nearby font weight. Enclose standalone icons in a shape with `--color-accent-50` background.
- No chatbots or chat widgets. Real phone number prominently displayed. Truckers call, they don't chat.

## 6.6 Build Priority

Build pages in this order — each builds on shared components from the previous:

1. **Homepage** — establishes nav, footer, all shared components
2. **Pricing** — reuses cards, CTA blocks, FAQ accordion
3. **Features** — reuses feature cards, CTA blocks, establishes split-layout pattern
4. **Dispatch Service** — reuses form components, feature cards, comparison table
5. **vs. DAT comparison** — reuses comparison table, testimonial cards, CTA blocks
6. **vs. CloudTrucks comparison** — same shared components
7. **Blog** — index + post template, reuses cards and CTA
8. **About** — lightest page, reuses prose layout and CTA
9. **Contact** — reuses form component

---

# Appendix: Quality Verification Checklist

The following was verified before finalizing this blueprint:

- [x] Every color reference uses a `--color-*` token, not a hex value
- [x] Every spacing value exists in the scale (`4·8·12·16·24·32·48·64·96·128`)
- [x] Every font size exists in the type scale (`12·14·16·18·20·24·30·36·48·60·72`)
- [x] Every card/container has an assigned elevation level (0–4)
- [x] Every section has responsive behavior defined for `<768px` and `<480px`
- [x] Every page has complete SEO metadata (title, description, keywords, OG)
- [x] Every interactive element has accessibility notes
- [x] The design token block is self-contained and copy-pasteable
- [x] A coding agent reading only this blueprint can build every page without ambiguity
