# DocumentDetailDrawer

## Purpose

Right-anchored drawer that lets a dispatcher view, download, replace, or delete a single document — across every entity (load, carrier, driver, vehicle). Replaces "click → presigned download → open in new tab" with an inline preview alongside metadata and quick actions, matching the look-and-feel of the existing detail-page tabs.

## Layout (matches LoadDetailPage section-card pattern)

```
┌───────────────────────────────── Drawer (right, 640px) ─────────────────────────────────┐
│ ▌ DrawerTitle: <fileName or customLabel>                                  [×]            │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│                                                                                         │
│  ┌── SectionCard: "Document Details" ────────────────────────────────────────────────┐ │
│  │  Type             Insurance Certificate                                            │ │
│  │  File             insurance-2026.pdf                                               │ │
│  │  Uploaded By      Sarah Chen                                                       │ │
│  │  Uploaded         Apr 12, 2026                                                     │ │
│  │  Expires          Sep 15, 2026   [Expires in 5 days]   ← ExpiryBadge inline       │ │
│  │  Policy Number    AGI-3344-998                                                     │ │
│  │  Notes            (empty if none)                                                  │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  ┌── SectionCard: "Preview" ──────────────────────────────────────────────────────────┐ │
│  │  ┌──────────────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                                                                              │  │ │
│  │  │   <iframe src={signedUrl}>  (PDF) — height: min(60vh, 720px), 100% width    │  │ │
│  │  │       OR                                                                     │  │ │
│  │  │   <img src={signedUrl}>     (image) — maxWidth: 100%, maxHeight: 60vh       │  │ │
│  │  │       OR                                                                     │  │ │
│  │  │   "Preview unavailable for this file type" + Download CTA                    │  │ │
│  │  │                                                                              │  │ │
│  │  └──────────────────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                         │
│  (scrolls if content exceeds drawer height)                                             │
│                                                                                         │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│  Sticky footer:                                                                         │
│  [ Download ]  [ Replace ]                                          [ Delete ] (admin)  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Width:** 640px on desktop (matches the existing "wide drawer" convention in the app), full-width on viewports ≤768px.
- **Wrapper:** `EditDrawer` from `components/EditDrawer` — provides title bar, close button, and consistent slide-in animation. Same wrapper as `DocumentUploadDrawer` for visual consistency.
- **Body:** `<Stack spacing={2}>` with two `SectionCard` blocks (Document Details, Preview), matching the LoadDetailPage `OverviewTab` composition.
- **Footer:** Sticky `Box` with `borderTop: 1px solid divider`, padded `px: 3, py: 2`, actions in a `Stack direction="row"` justified `space-between` (left: Download + Replace, right: Delete).

## Components

### Reused
- `EditDrawer` (`components/EditDrawer`) — drawer shell with title and close handling.
- `SectionCard` (`components/SectionCard`) — same card used on every detail tab. Title + content slot.
- `DetailRow` (`components/Typography`) — label/value pairs in the metadata section.
- `BodyMuted` (`components/Typography`) — for "(none)" placeholder text and notes.
- `ExpiryBadge` (new — see separate spec) — chip rendered inline next to the Expires value.
- `Button` (MUI) — footer actions. Download/Replace = `variant="outlined"`. Delete = `variant="text" color="error"`.
- `useDrawerActions().openDrawer('documentUpload', ...)` — invoked when Replace is clicked, after `closeDrawer()`.

### New
- `DocumentDetailDrawer` itself (registered in `drawerRegistry` as `documentDetail`).
- `DocumentPreviewArea` (internal subcomponent) — encapsulates the mime-type → preview-element switch (`<iframe>` for PDF, `<img>` for image, fallback message otherwise). Kept inside the drawer file, not promoted to its own folder unless it gets reused.

### Not used
- `MainCard` — reserved for list-page table wrappers, not detail content.
- MUI `Dialog` — drawer is the agreed surface.

## Visible Data Fields

| UI Label      | Expected API Field                       | Format / Notes                                                         |
|---------------|------------------------------------------|------------------------------------------------------------------------|
| (Title bar)   | `fileName` or `metadata.customLabel`     | string — custom label preferred when type is `OTHER` and label exists  |
| Type          | derived from `type` via `DOC_TYPE_CONFIG[type].label` | string — for `OTHER` show `metadata.customLabel`              |
| File          | `fileName`                               | string                                                                 |
| Uploaded By   | `uploadedByUser.firstName` + `lastName`  | string — may need a new selector or join (see Open API question below) |
| Uploaded      | `createdAt`                              | `MMM d, yyyy` via `date-fns/format`                                    |
| Expires       | `expiresAt`                              | `MMM d, yyyy` + inline `ExpiryBadge`. If null, omit row entirely.      |
| Policy Number | `metadata.policyNumber`                  | string — only shown for INSURANCE_CERT                                 |
| License #     | `metadata.licenseNumber`                 | string — only shown for LICENSE                                        |
| Issuing State | `metadata.issuingState`                  | string — only shown for LICENSE                                        |
| CDL Class     | `metadata.cdlClass`                      | string — only shown for LICENSE                                        |
| Notes         | `notes`                                  | string with `whiteSpace: pre-wrap`. If empty, render `BodyMuted` "—".  |

## Interactions

| Action      | Behavior                                                                                                                                                                       |
|-------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Drawer open | Triggered by row click or kebab → "View" in `DocumentTable`. Dispatches `getDownloadUrlRequest({ documentId })`; preview renders skeleton until URL resolves.                  |
| Close       | × button or `Esc` calls `useDrawerActions().closeDrawer()`. No dirty-state to guard — drawer is read-only except for the Replace/Delete actions, which open their own surfaces. |
| Download    | Footer button → fetch presigned URL (cached if already loaded for preview) → `window.open(url, '_blank', 'noopener,noreferrer')`. No drawer close.                              |
| Replace     | Footer button → close this drawer → `openDrawer('documentUpload', { context, entityType, entityId, preselectedDocType, lockDocType: true })`. Existing flow takes over.        |
| Delete      | Admin only. Opens `ConfirmDeleteDocumentModal` (small confirmation modal — see DocumentTable.md). On confirm, archive saga runs; on success, drawer closes and row is removed. |
| Row → drawer transition | Already-loaded preview URL is invalidated when a different document is opened (drawer remounts on documentId change).                                                          |

## States

### Loading
- Body shows two `SectionCard`s with `<Skeleton>` placeholders inside (3 rows of `<Skeleton variant="text" width="60%" />` for the metadata section, one tall `<Skeleton variant="rectangular" height={420} />` for the preview area).
- Footer buttons rendered but disabled.

### Loaded — preview-able mime
- Metadata section: `DetailRow` per field, only rendering rows whose value is non-null.
- Preview section: full-width `<iframe>` for PDF (`height: min(60vh, 720px)`, `border: none`, `borderRadius: 1`) or `<img>` for image (`maxWidth: 100%`, `maxHeight: 60vh`, centered).

### Loaded — non-previewable mime
- Preview section shows a centered `EmptyState`-style block: a small icon (`InsertDriveFileOutlined`), `BodyMuted` "Preview is not available for this file type.", and a contained `Download` button. Footer Download remains visible too.

### Error
- If presigned URL fetch fails: preview section shows `WarningText` "Couldn't load preview. Try again?" with a small `Retry` text button. Metadata still renders. Download button still works (will retry the fetch).
- If document is not found (deleted while drawer was open): drawer auto-closes and a `notistack` "info" toast says "This document is no longer available."

### Empty
- N/A — drawer always opens with a known document id.

## Responsive Behavior

| Breakpoint | Behavior                                                                                                          |
|------------|-------------------------------------------------------------------------------------------------------------------|
| ≥ 1200px   | Drawer is 640px right-anchored; parent page scrolls behind a translucent backdrop.                                |
| 768–1200px | Same — drawer pushes other content out of view but parent page remains accessible behind backdrop.                |
| < 768px    | Drawer goes full-width (`100vw`). Footer becomes `Stack direction="column" spacing={1}` so buttons stack and have 44×44 minimum tap height. PDF iframe height drops to `50vh`. |

## Accessibility

- `EditDrawer` already manages focus trap, `Esc` to close, and focus return on close.
- `aria-label` on `<iframe>`: `"PDF preview of {fileName}"`.
- `<img>` has `alt={fileName}`.
- Footer buttons have visible labels (no icon-only buttons here).
- `ExpiryBadge` color is paired with its text (`"Expired"`, `"Expires in N days"`) — never color-only.
- Tab order: title close button → metadata fields (skipped, non-interactive) → preview area (focusable for keyboard scroll) → Download → Replace → Delete.

## Open API Question

`uploadedByUser` is not currently embedded in the document list response — only `uploadedByUserId`. Two options:

1. **Embed in API response** — add a `uploadedBy: { firstName, lastName }` object via Prisma `include`. Cleanest. (Recommended.)
2. **Resolve on the client** — fetch `/users/:id` lazily when the drawer opens. Extra request per open.

Resolve during `/contract-freeze`. The drawer must show the uploader name, so this is a hard requirement on whatever path is chosen.
