# Design Spec — Settings Page Chrome

> Screen: `SettingsPage` shell (topbar + tabs + content zone)
> Source: `src/features/settings/pages/SettingsPage/index.tsx`

## Purpose

Re-chrome the Settings page so it is visually identical to every other top-level
page in the app. Today it rolls its own header (`PageHeader` title + subtitle inside
a bare `<Box>`); the target replaces that with the standard `ListLayout` topbar,
exactly like `ContactListPage` / ratecon `IndexPage`.

## Layout

```
PageWrapper (errorContext="SettingsPage" — NO isLoading prop)
 └─ ListLayout title="Settings"  primaryAction={Team-tab-only Invite button}
      ├─ [topbar] 56px white bar · PageTitle "Settings" · primaryAction slot (right)
      └─ [content] grey.100, scrollable, flex column
           ├─ DetailTabBar (General | Team)   ← directly under topbar
           └─ Box  px={{ xs: 2, sm: 3 }}, py: 3   ← active tab panel
                ├─ GeneralTab   (activeTab === 'general')
                └─ TeamTab      (activeTab === 'team', admin only)
```

- **Topbar:** rendered by `ListLayout` — `height: 56`, `bgcolor: background.paper`,
  1px `grey.200` bottom border + `0 1px 3px rgba(0,0,0,0.08)` shadow, `px: { xs: 2, sm: 3 }`.
  Left: `<PageTitle>Settings</PageTitle>`. Right: `primaryAction` slot.
- **Tabs:** keep the existing `DetailTabBar` component (unchanged) — it already drives
  the General/Team switch via `activeTab` / `onTabChange`. It now sits in the
  `ListLayout` content zone instead of a hand-rolled stack. No new tab component.
- **Content padding:** the tab-panel `<Box>` owns the standard `px: { xs: 2, sm: 3 }`
  horizontal padding + vertical padding (`py: 3`). The `grey.100` background comes from
  `ListLayout`'s content area — do **not** re-set it on the panel.

## Components (reused vs new)

| Component | Source | Reuse / New |
|-----------|--------|-------------|
| `PageWrapper` | `@mocho/ui/components` | reuse (errorContext only) |
| `ListLayout` | `components/ListLayout` | reuse — replaces the `PageHeader` block |
| `PageTitle` | `components/Typography` | reuse (rendered by `ListLayout`) |
| `DetailTabBar` | `components/DetailTabBar` | reuse — same tabs, new container |
| `GeneralTab` | `components/SettingsPage/GeneralTab` (NEW) | see `general-tab.md` |
| `TeamTab` | `components/TeamTab` | modify — see `team-tab.md` |
| `PageHeader` | — | **removed** from this page |

## Role-aware behavior

- `visibleTabs` keeps the existing `isAdminSelector` gate — the **Team** tab is hidden
  for non-admins; dispatchers see only **General**.
- The topbar `primaryAction` ("Invite Member") renders **only when** `activeTab === 'team'`
  (and therefore only for admins, since the Team tab is admin-only). On the General tab
  the `primaryAction` slot is empty.

## Data Fields

None at the chrome level — this screen is pure layout. Field-level data lives in the
General tab (`general-tab.md`) and the team grids (`team-tab.md`).

## States

- **Loading:** **No `isLoading` on `PageWrapper`** (per the list-page convention — it
  unmounts children). The chrome always renders; each tab owns its own loading state:
  - General tab → skeleton/placeholder sections while settings load (`general-tab.md`).
  - Team tab → grid `loading` prop (`team-tab.md`).
- **Error:** `PageWrapper`'s ErrorBoundary catches render crashes. The settings-fetch
  error banner moves **into** the General tab content (it is a General-tab concern, not
  page chrome) — see `general-tab.md`.
- **Empty:** N/A at chrome level.

## Interactions

- Clicking a tab in `DetailTabBar` → `setActiveTab(value)` → swaps the panel; the topbar
  `primaryAction` appears/disappears with the Team tab.
- Deep-link / refresh keeps `activeTab` default `'general'` (no URL sync required — matches
  current behavior; out of scope to add query-param persistence).

## Responsive

Inherits `ListLayout`. Topbar and tabs are full-width; content `px` collapses
`24 → 16` below `sm`. No bespoke breakpoints.

## Acceptance cross-check

- Renders `PageWrapper → ListLayout title="Settings"` — no `PageHeader`, no bare header box.
- Topbar visually identical to Contacts (56px, white, `PageTitle`, border+shadow).
- Tabs render/switch under the topbar; content in `grey.100` with `px: { xs: 2, sm: 3 }`.
- Dispatcher sees only General; admin sees both. Invite button only on Team tab.
