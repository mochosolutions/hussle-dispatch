# DocumentTable — Updates

## Purpose

The shared `DocumentTable` already renders documents inside every entity's Documents tab (load, carrier, driver, vehicle). This spec describes what changes to add per-row management: a kebab actions menu, expiry badge in the Expires cell, custom-label rendering for OTHER documents, row click → detail drawer, and a delete confirmation modal triggered from the menu.

The table itself stays an `NewDataGrid` — only the column definitions and renderers change. No new file paths beyond the modal.

## Layout (table — modified columns)

```
┌────────────────────────────────────── DocumentTable ────────────────────────────────────────┐
│ Type                File Name                Uploaded         Expires                  ⋮     │
│ ─────────────────── ──────────────────────── ─────────────── ─────────────────────────── ── │
│ Insurance Cert      insurance-2026.pdf       Apr 12, 2026    Sep 15  [Expires in 5 days] ⋮  │
│ W-9                 w9-acme.pdf              Mar 03, 2026    —                            ⋮  │
│ Customer Form       broker-special.pdf       Apr 22, 2026    —                            ⋮  │  ← Type cell shows metadata.customLabel for OTHER
│ License             cdl-jdoe.pdf             Feb 10, 2026    Jan 04, 2027 [warning chip] ⋮  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

The kebab (⋮) is a fixed-width Actions column on the right.

## Column Changes

| Column      | Before                                            | After                                                                                                  |
|-------------|---------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| Type        | `DOC_TYPE_CONFIG[type].label` only                | If `type === 'OTHER'` and `metadata.customLabel`, render the customLabel. Otherwise unchanged.         |
| File Name   | unchanged                                         | unchanged                                                                                              |
| Uploaded    | unchanged                                         | unchanged                                                                                              |
| Expires     | Date only                                         | Date + inline `<ExpiryBadge expiresAt={value} />`. `BodyMuted` em-dash if null.                        |
| **Actions** | _(does not exist)_                                | New column with kebab `IconButton` opening MUI `Menu`. Width 56px, `pinned: 'right'`. No header label. |

### Cell renderer changes (within `DocumentTable/index.tsx`)

- `DocTypeCellRenderer` — branches on `data.type === 'OTHER'`. Falls back to the config label when `customLabel` is missing.
- `ExpiresCellRenderer` (new, replaces inline `DateCellRenderer` for this column) — renders the formatted date (or em-dash) followed by `<ExpiryBadge expiresAt={value} />` in a `Stack direction="row" spacing={1} alignItems="center"`.
- `ActionsCellRenderer` (new) — uses `ActionsCell` from `mocho/components/DataGrid` if available, otherwise an MUI `IconButton` + `Menu` with the four items below.

### Row click

`onRowClicked` (AG Grid) opens the detail drawer via `useDrawerActions().openDrawer('documentDetail', { documentId })`. The kebab cell stops propagation so clicking the menu doesn't also open the drawer.

## Kebab Menu

| Item     | Visibility           | onClick                                                                                                            |
|----------|----------------------|--------------------------------------------------------------------------------------------------------------------|
| View     | Always               | `openDrawer('documentDetail', { documentId })`                                                                     |
| Download | Always               | Dispatches `getDownloadUrlRequest({ documentId })`; saga returns URL; `window.open(url, '_blank', 'noopener,...')` |
| Replace  | Always               | `openDrawer('documentUpload', { context, entityType, entityId, preselectedDocType: row.type, lockDocType: true })` |
| Delete   | Admin only (gated)   | `openModal('confirmDeleteDocument', { documentId, fileName, type })`                                               |

Items are separated visually only between Replace and Delete (`<Divider />`) so the destructive action stands apart.

## ConfirmDeleteDocumentModal (new — triggered from kebab)

Small modal (`size="sm"`, ~400px) registered in `modalRegistry` as `confirmDeleteDocument`.

```
┌─────────── Delete Document ───────────┐
│                                       │
│  Are you sure you want to delete:     │
│                                       │
│    Insurance Certificate              │
│    insurance-2026.pdf                 │
│                                       │
│  The document will be archived and    │
│  hidden from the list. An admin can   │
│  recover it from the audit log.       │
│                                       │
│  ─────────────────────────────────────│
│                  [ Cancel ]  [Delete] │  ← Delete is variant="contained" color="error"
└───────────────────────────────────────┘
```

- Title: "Delete Document" (`ModalTitle`).
- Body: `<Body>` "Are you sure...". A small section with `<BodyStrong>{typeLabel}</BodyStrong>` and `<BodyMuted>{fileName}</BodyMuted>`. Then `<BodyMuted>` recovery hint.
- Footer: `Cancel` (text button) + `Delete` (`variant="contained" color="error"`).
- On confirm, dispatches `archiveDocumentRequest({ documentId })`. Modal closes immediately (optimistic). On success, row disappears from the table (saga removes from entity slice). On failure, notistack toast surfaces the error.

## Components

### Reused
- `NewDataGrid` (`@mocho/ui/components`) — table itself.
- `ActionsCell` (`mocho/components/DataGrid`) — preferred kebab pattern per CLAUDE.md.
- `IconButton` + `Menu` + `MenuItem` + `Divider` (MUI) — fallback if `ActionsCell` does not fit the four-item shape.
- `ConfirmDialog` / project equivalent — wrap inside the new modal.
- `useDrawerActions`, `useModalActions` (`features/ui/...`) — never `useState` for drawer/modal lifecycle.
- `useAuth()` — gates the Delete menu item.

### New
- `ExpiryBadge` (separate spec).
- `ConfirmDeleteDocumentModal` registered via `modalRegistry` — rendered by the global `ModalManager`.

## Visible Data Fields

| UI Label   | Expected API Field                                                                | Format / Notes                                       |
|------------|-----------------------------------------------------------------------------------|------------------------------------------------------|
| Type       | `DOC_TYPE_CONFIG[type].label` or `metadata.customLabel` if `type === 'OTHER'`     | string                                               |
| File Name  | `fileName`                                                                        | string, single line, ellipsis on overflow            |
| Uploaded   | `createdAt`                                                                       | `MMM d, yyyy` via `date-fns/format`                  |
| Expires    | `expiresAt`                                                                       | `MMM d, yyyy` + `<ExpiryBadge>`. Em-dash if null.    |
| (Actions)  | _(no field)_                                                                      | Kebab triggers menu; menu items listed above.        |

## Interactions & States

- **Selection** — existing multi-select for bulk download stays. Clicking the kebab cell stops propagation so it doesn't toggle selection.
- **Loading** — existing AG Grid `loading` state (skeleton overlay) is preserved.
- **Empty** — existing `noDataMessage="No documents uploaded yet"` stays. (Out of scope: replace with `EmptyState` component — keep current behavior.)
- **Disabled menu items** — Delete is hidden, not disabled, for non-admins. Replace/Download are always enabled if the doc is loaded.
- **Optimistic delete** — row disappears as soon as the confirm modal closes. If the saga fails, a snackbar surfaces the error and the row reappears (entity slice rolls back via failure handler).

## Responsive

- The kebab column is `pinned: 'right'` and stays visible on horizontal scroll.
- On `< 768px`, the table itself uses AG Grid's responsive behavior — no card-list transformation in scope.
- Confirm modal uses MUI `fullScreen` breakpoint: full-screen on `xs`, fixed-width on `sm+`.

## Accessibility

- `IconButton` (kebab) gets `aria-label="Document actions"`.
- `Menu` items are buttons with text labels — screen readers read them naturally.
- `ExpiryBadge` is a `Chip` with text content + icon (see ExpiryBadge spec).
- Modal traps focus, `Esc` closes, focus returns to the kebab on close.
