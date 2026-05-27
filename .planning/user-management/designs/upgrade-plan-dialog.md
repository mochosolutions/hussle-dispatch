# Upgrade Plan Dialog

## Purpose

Reusable dialog shown when a subscription limit is reached. Blocks the action and prompts the user to upgrade. Used for both seat limits (invite blocked) and truck limits (vehicle creation blocked).

## Layout

Standard MUI `Dialog` — max-width `xs` (360px). Centered content, no form.

### Structure

```
┌───────────────────────────────────┐
│                                   │
│          [Warning Icon]           │
│                                   │
│      Plan Limit Reached           │
│                                   │
│  You've reached your plan limit   │
│  of 3 team members. Upgrade your  │
│  plan to add more.                │
│                                   │
│           [Got It]                │
│                                   │
└───────────────────────────────────┘
```

### Content

- **Icon**: MUI `WarningAmber` icon, amber color, 48px, centered
- **Title**: "Plan Limit Reached" — primary text, semibold, centered
- **Message**: Dynamic based on resource type:
  - Seats: "You've reached your plan limit of **[N] team members**. Upgrade your plan to add more."
  - Trucks: "You've reached your plan limit of **[N] vehicles**. Upgrade your plan to add more."
- **Bold the limit** within the sentence for emphasis

### Props

```typescript
interface UpgradePlanDialogProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'team members' | 'vehicles';
  limit: number;
}
```

### Actions

- **"Got It"** (primary button, full-width within content area): Closes dialog. That's it — no upgrade flow yet.

### Spacing

- 32px padding all around
- 16px between icon and title
- 8px between title and message
- 24px between message and button

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Limit count | `usage.[resource].limit` | number, interpolated into message |

## Component Hierarchy

```
UpgradePlanDialog (MUI Dialog)
  DialogContent (centered layout)
    WarningAmberIcon (amber, 48px)
    Typography ("Plan Limit Reached" — h6, semibold)
    Typography (dynamic message with bold limit)
    Button ("Got It" — contained primary)
```

## Notes

- This component lives in shared components (not inside the settings feature) since it's also used by the vehicle creation flow.
- No `DialogTitle` or `DialogActions` — everything is inside `DialogContent` for a cleaner centered layout.
- Escape key and backdrop click also close the dialog.
