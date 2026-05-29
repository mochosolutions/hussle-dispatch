# Design Spec — Team Tab (Members + Invitations grids)

> Screen: Team tab — `NewDataGrid` for members and pending invitations
> Modify: `src/features/settings/components/TeamTab/index.tsx`,
>   `components/MemberTable/index.tsx`, `components/InvitationTable/index.tsx`
> New: `components/MemberCellRenderers.tsx`, `components/InvitationCellRenderers.tsx`
> Analog: `ContactListPage` (`NewDataGrid` + `gridOptions`)

## Purpose

Migrate the two raw MUI `<Table>`s to the app-standard `NewDataGrid` so the Team tab looks
like every other list in the app. Behavior is unchanged — the grids dispatch the same
existing Redux actions (`changeMemberRoleRequest`, `removeMemberRequest`,
`resendInvitationRequest`, `revokeInvitationRequest`).

## Layout

```
[topbar Invite Member button lives in ListLayout — see settings-page-chrome.md]

TeamTab  (maxWidth: 800, Stack spacing 3)
  ┌ Team Members  ·  "3 of 5 seats used" ───────────────┐   ← section label + seat usage
  │ MainCard (content={false})                          │
  │   NewDataGrid — Members                              │
  └─────────────────────────────────────────────────────┘

  ┌ Pending Invitations ────────────────────────────────┐   ← only when invitations exist
  │ MainCard (content={false})                          │
  │   NewDataGrid — Invitations                          │
  └─────────────────────────────────────────────────────┘
```

- The inner **"Invite Member"** button is **removed** from the TeamTab header (it moves to
  the `ListLayout` topbar `primaryAction`, rendered only on the Team tab — see
  `settings-page-chrome.md`). Keep the "Team Members" `SectionTitle` + "N of M seats used"
  `BodyMuted` line.
- The seat-limit logic (`usage.users.current >= usage.users.limit` → `upgradePlan` modal
  else `inviteMember` modal) moves with the button to wherever the topbar action is wired,
  but the **decision logic is unchanged**.

## Shared grid options (both grids)

Per the table standard — memoized `gridOptions`:

| Option | Value |
|--------|-------|
| `rowHeight` | `56` |
| `headerHeight` | `44` |
| `pagination` | `true` |
| `paginationPageSize` | `25` |
| `domLayout` | `'normal'` |
| `loading` | `loading={!hasLoadedOnce}` (don't flicker on refetch) |
| `noDataComponent` | `<EmptyState variant="no-results" entityName="…" compact />` |

Columns + cell logic live in co-located `*CellRenderers.tsx` — never inline.

## Members grid

Columns:

| Header | Field | Renderer / format |
|--------|-------|-------------------|
| Name | `user.firstName` + `user.lastName` + `user.email` | `TwoLineCell` — name (primary) over email (secondary) |
| Role | `role` | inline MUI `Select` (keep existing `ROLE_OPTIONS`: Admin/Dispatcher/Viewer/Driver) → dispatches `changeMemberRoleRequest({ membershipId, role })` |
| Joined | `createdAt` | `format(date, 'MMM d, yyyy')` (date-fns) |
| Actions | — | **text button** "Remove" → opens existing `ConfirmDialog` → `removeMemberRequest`. Hidden for the current user's own row (`member.userId === currentUserId`). |

- Role `Select` stays inline and editable (it is the one inline-edit affordance) — rendered
  via a cell renderer, not inline JSX.
- Remove keeps the existing two-step `ConfirmDialog` ("Remove {name}?", severity error).

### Members empty state
`<EmptyState variant="no-results" entityName="Member" compact />` (rare — an org always has
≥1 member, but provide it for grid completeness).

## Invitations grid

Rendered only when `invitations.length > 0` (keep the conditional `MainCard`).

Columns:

| Header | Field | Renderer / format |
|--------|-------|-------------------|
| Name | `firstName` + `lastName` | plain text |
| Email | `email` | plain text |
| Role | `role` | outlined `Chip`, capitalized (keep `capitalizeFirst`) |
| Sent | `createdAt` | `format(date, 'MMM d, yyyy')` |
| Expires | `expiresAt` | expiry renderer: `Expired` (ErrorText) if past, else `in N day(s)` (Meta). Keep `getExpiryText`. |
| Actions | — | **text buttons** "Resend" + "Revoke" (error color) → `resendInvitationRequest` / `revokeInvitationRequest`. Both disabled while that row's op is pending (`loading[resend:id]` / `loading[revoke:id]` === 'Pending'). |

### Row-action presentation (decided: text buttons)

Keep the current **text buttons** ("Resend" / "Revoke" / "Remove") inside the Actions cell
rather than icon `ActionsCell` — clearer non-CRUD verbs. They live in the
`*CellRenderers.tsx` files (not inline). This is a deliberate deviation from the
icon-`ActionsCell` table standard, chosen for verb clarity; note it in /build so the
table-standard lint/review doesn't "fix" it back to icons.

## Visible Data Fields

### Members
| UI Label | Expected API Field | Format |
|----------|--------------------|--------|
| Name | `user.firstName` / `user.lastName` | two-line w/ email |
| (sub) Email | `user.email` | string |
| Role | `role` | Select (admin/dispatcher/viewer/driver) |
| Joined | `createdAt` | `MMM d, yyyy` |
| Actions | `id` (membershipId), `userId` | Remove button (hidden for self) |

### Invitations
| UI Label | Expected API Field | Format |
|----------|--------------------|--------|
| Name | `firstName` / `lastName` | string |
| Email | `email` | string |
| Role | `role` | chip, capitalized |
| Sent | `createdAt` | `MMM d, yyyy` |
| Expires | `expiresAt` | "Expired" / "in N days" |
| Actions | `id` (inviteId) | Resend / Revoke (disabled while pending) |

(No API changes — same `Member` / `Invitation` shapes from `utils/api/team/teamApi`.)

## States

- **Loading:** grid `loading` prop driven by `loading.fetchTeam === 'Pending'` via the
  `loading={!hasLoadedOnce}` pattern (no overlay flicker on refetch). Replaces MemberTable's
  bespoke `Skeleton` rows.
- **Empty (members):** grid `noDataComponent` `EmptyState`.
- **Empty (invitations):** the whole Pending Invitations card is hidden (no rows → no card).
- **Per-row pending:** invitation Resend/Revoke buttons disable while that row's op is
  pending; member role `Select` reflects the server-confirmed value.

## Interactions

- Change role → `changeMemberRoleRequest` (server-confirmed; Select shows the new value).
- Remove → `ConfirmDialog` → `removeMemberRequest`.
- Resend → `resendInvitationRequest`; Revoke → `revokeInvitationRequest` (row disables while pending).
- Invite Member (topbar) → seat-limit check → `inviteMember` or `upgradePlan` modal.
- No row-click navigation (team rows have no detail page).

## Responsive

`maxWidth: 800`. Grids scroll horizontally below `sm` (AG Grid default). Buttons stay in the
Actions cell. No bespoke breakpoints.
