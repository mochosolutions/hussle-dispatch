# Settings > Team Tab

## Purpose

Admin manages their organization's team — view members, change roles, invite new users, and remove members. This is a new tab added to the existing Settings page.

## Layout

The Settings page gains a `DetailTabBar` at the top with two tabs:

- **General** — existing settings form content (Financial, Operations, Communication sections)
- **Team** — new tab (this spec)

The Team tab content sits below the tab bar inside `PageWrapper`. It has two sections stacked vertically:

1. **Header row** — "Team Members" title + seat usage indicator + "Invite Member" button
2. **Members Table** — active members
3. **Pending Invitations Table** — pending invites (collapsible, below members)

### Header Row

```
[Team Members (3 of 3 seats)]                    [+ Invite Member]
```

- Left: section title with seat count as secondary text — e.g., "3 of 3 seats used"
- Right: primary button "Invite Member"
  - If `currentUsers >= maxUsers`: clicking shows `UpgradePlanDialog` instead of `InviteMemberDialog`
  - Usage data is fetched on tab mount from `GET /subscription/usage`

## Members Table

Simple MUI `Table` (not DataGrid — expected <20 rows for this use case). Inside a `MainCard`.

### Columns

| Column | Width | Content |
|--------|-------|---------|
| Name | 30% | Full name (firstName + lastName), email as secondary text below |
| Role | 25% | Inline `Select` dropdown (admin, dispatcher, viewer, driver) |
| Joined | 20% | Date formatted as "Mar 15, 2026" |
| Actions | 25% | "Remove" text button (tertiary style, neutral color) |

### Interactions

- **Role dropdown**: Changing the value immediately triggers `PATCH /members/:id/role`. Server-confirmed — show inline spinner on the select while saving, then update.
  - If last-admin guard triggers, show snackbar error: "Cannot change role. Every organization must have at least one admin."
  - Revert the dropdown to the previous value on error.
- **Remove button**: Opens `ConfirmDialog` — "Remove [Name]?" / "They will lose access to [OrgName] immediately. This action cannot be undone." / Confirm (red) + Cancel.
  - If last-admin guard triggers, show snackbar error: "Cannot remove the only admin."
  - The admin's own row does not show a Remove button (cannot remove self).

### States

- **Loading**: Skeleton rows (3 rows of skeleton text)
- **Empty**: Should not happen — the admin themselves is always a member. But if it does: "No team members found."
- **Error**: Snackbar with retry option

## Pending Invitations Section

Below the members table. Inside a second `MainCard` with title "Pending Invitations". Only rendered if there are pending invitations (`invitations.length > 0`).

### Columns

| Column | Width | Content |
|--------|-------|---------|
| Name | 30% | firstName + lastName from invite |
| Email | 30% | Email address |
| Role | 15% | Role chip (text label, no interaction) |
| Sent | 15% | Date formatted as "Mar 15, 2026" |
| Expires | 10% | Relative — "in 5 days" or "Expired" in red text |

No actions on invitations for now (resend/revoke deferred to P1).

### States

- **Empty**: Section is hidden entirely (no empty state needed)

## Visible Data Fields

### Members Table

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Name | `user.firstName`, `user.lastName` | string, concatenated |
| Email | `user.email` | string, secondary text |
| Role | `role` | select dropdown (admin, dispatcher, viewer, driver) |
| Joined | `createdAt` | date — "MMM DD, YYYY" |

### Pending Invitations Table

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Name | `firstName`, `lastName` | string, concatenated |
| Email | `email` | string |
| Role | `role` | chip/text |
| Sent | `createdAt` | date — "MMM DD, YYYY" |
| Expires | `expiresAt` | relative time or "Expired" |

### Subscription Usage (header)

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Seats used | `usage.users.current` | number |
| Seats limit | `usage.users.limit` | number |

## Component Hierarchy

```
SettingsPage
  DetailTabBar (tabs: General, Team)
  {activeTab === 'general' && <GeneralSettingsForm />}  // existing content
  {activeTab === 'team' && <TeamTab />}

TeamTab
  Box (header row)
    Typography ("Team Members") + Typography secondary ("3 of 3 seats used")
    Button ("Invite Member") → opens InviteMemberDialog or UpgradePlanDialog
  MainCard ("Members")
    MemberTable
      Table → TableHead → TableBody → TableRow per member
        RoleSelect (inline Select per row)
        RemoveButton → ConfirmDialog
  MainCard ("Pending Invitations") — conditional
    InvitationTable
      Table → TableHead → TableBody → TableRow per invitation
  InviteMemberDialog (controlled by TeamTab state)
  UpgradePlanDialog (controlled by TeamTab state)
```

## Responsive Behavior

- **>768px**: Full table layout as described
- **<768px**: Hide "Joined" and "Expires" columns. Name + email stack vertically in first column. Role select and Remove action stay visible.
