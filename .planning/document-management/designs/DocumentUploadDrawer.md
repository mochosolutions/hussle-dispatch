# DocumentUploadDrawer — Updates

## Purpose

`DocumentUploadDrawer` already orchestrates uploads across all entity contexts (load-detail, create-load, carrier-detail, driver-profile, vehicle-detail). This spec describes two additions in scope for the Document Management MVP:

1. **OTHER custom-label form** — when a user picks the OTHER doc type, a required "Document Name" field gates the upload. Saved as `metadata.customLabel`.
2. **Replace mode** — when opened with `preselectedDocType` + `lockDocType=true` from a `DocumentTable` row's "Replace" action, the picker is filtered to that one type and the title bar reflects the operation.

The drawer's existing layout (`EditDrawer` shell → `DocumentPicker` → optional `ComplianceForm` → upload status list) stays. Compliance form for INSURANCE_CERT, LICENSE, etc. is unchanged.

## Layout — Replace mode

```
┌──────────────── Drawer (right, 480px) ────────────────┐
│ ▌ Replace: Insurance Certificate              [×]      │
│ ────────────────────────────────────────────────────── │
│                                                        │
│  ┌────────── DocumentPicker ────────────────────────┐ │
│  │  ┌── Insurance Certificate (locked) ─────────────┐│ │
│  │  │ [icon]  Insurance Certificate                 ││ │
│  │  │         Compliance · expiry required          ││ │
│  │  │         (only card; no other type selectable) ││ │
│  │  └────────────────────────────────────────────────┘│ │
│  │                                                    │ │
│  │  Drop file here or click to browse                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌── ComplianceForm (since Insurance is compliance) ─┐ │
│  │  Expiration Date  [ 2026-09-15 ]                  │ │
│  │  Policy Number    [ AGI-3344-998 ]                │ │
│  │  [ Upload ]  [ Cancel ]                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  Uploads (after submit)                                │
│  • [⏳]  Insurance Certificate · insurance-new.pdf      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Title text changes: when `lockDocType && preselectedDocType`, the drawer title becomes `Replace: {DOC_TYPE_CONFIG[preselectedDocType].label}` instead of `Upload Documents`. This makes the destructive intent obvious — users know the prior doc will be archived.

## Layout — OTHER custom-label form

```
┌──────────────── Drawer (right, 480px) ────────────────┐
│ ▌ Upload Documents                            [×]      │
│ ────────────────────────────────────────────────────── │
│                                                        │
│  ┌────────── DocumentPicker (showing all cards) ────┐ │
│  │  Selected: Other                                  │ │
│  │  Drop file here or click to browse                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  ┌── OtherLabelForm (NEW) ────────────────────────────┐│
│  │  Document Name *                                   ││
│  │  [ ___________________________________________ ]   ││
│  │  Helper: "Required. Max 80 characters. Will       ││
│  │  appear as the document name in lists."           ││
│  │  [ Upload ]  [ Cancel ]                           ││
│  └────────────────────────────────────────────────────┘│
│                                                        │
└────────────────────────────────────────────────────────┘
```

Behaviorally this mirrors `ComplianceForm` — same gate-before-upload pattern, just a different field set. The drawer's existing `pendingCompliance` state hook is generalized to `pendingMetadata` (or a sibling `pendingOther` state) so the compliance/other branches don't entangle.

For doc types that are **both compliance and OTHER** (none currently exist, but defensive), the compliance form takes precedence — OTHER is intentionally configured as `compliance: false`, so this case shouldn't arise.

## Components

### Reused
- `EditDrawer` — outer shell with title bar.
- `DocumentPicker` — generic picker. Already supports `lockDocType` filtering via the existing `docTypes` prop (no API change). Already supports the OTHER card.
- `ComplianceForm` (existing internal subcomponent) — kept as-is for INSURANCE_CERT, LICENSE, MEDICAL_CARD, HAZMAT_ENDORSEMENT, TWIC_CARD, IFTA_LICENSE, IFTA_DECAL, IRP_CAB_CARD, BIT_INSPECTION, REGISTRATION, INSPECTION_CERT.
- `useDispatch` + `uploadDocumentRequest` — same upload pipeline.

### New
- `OtherLabelForm` — internal subcomponent inside `DocumentUploadDrawer/index.tsx` (sibling to `ComplianceForm`). Takes `{ onSubmit: (customLabel: string) => void; onCancel: () => void }`. Single text field with `maxLength={80}`, required, real-time character count. Submit disabled until `value.trim().length > 0`.

### Not changed
- `DocumentPicker` — does **not** need to know about the custom label. The drawer intercepts `onAdd`, sees `documentType === 'OTHER'`, and shows `OtherLabelForm` before calling `dispatchUpload`. Same pattern used today for compliance docs.

## Visible Data Fields

| Field             | Saved As                          | Format / Notes                                                      |
|-------------------|-----------------------------------|---------------------------------------------------------------------|
| Document Name (OTHER) | `metadata.customLabel`        | string, 1–80 chars, trimmed                                         |
| Expiration Date   | `expiresAt`                       | ISO date string (existing — unchanged)                              |
| Policy Number     | `metadata.policyNumber`           | (existing — unchanged)                                              |
| License Number    | `metadata.licenseNumber`          | (existing — unchanged)                                              |
| Issuing State     | `metadata.issuingState`           | (existing — unchanged)                                              |
| CDL Class         | `metadata.cdlClass`               | (existing — unchanged)                                              |

## Interactions

| Action                       | Behavior                                                                                                              |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------|
| Open via Replace from kebab  | Drawer opens with `lockDocType=true, preselectedDocType=row.type`. Title bar reflects "Replace: {label}".              |
| Pick OTHER card              | `OtherLabelForm` replaces the picker (same swap mechanism as `ComplianceForm`). Submit gated until label is non-empty. |
| Submit OTHER form            | `dispatchUpload(file, 'OTHER', clientId, undefined, { customLabel })`. Status row appears with `customLabel` as the label chip. |
| Cancel OTHER form            | Resets `pendingOther` state — picker reappears, file is discarded.                                                    |
| Submit compliance form for replaced doc | Same as today — compliance form blocks until expiry/metadata captured, then uploads. The existing `confirm` flow auto-archives the prior. |
| Close drawer mid-upload      | `EditDrawer` already shows a confirm dialog if uploads are pending. Unchanged.                                        |

## States

- **Replace mode + locked picker** — only the preselected card is visible; no other selectable. If somehow the preselected type is not in the current context's allowed list, fall back to the full unlocked picker (defensive — should not happen with normal flows).
- **OTHER selected, label empty** — Upload button disabled, helper text "Document name is required."
- **OTHER selected, label exceeds 80** — text input enforces `maxLength`. Counter `(80/80)` is shown in `BodyMuted` to the right of the input.
- **Upload-in-progress** — existing `UploadStatusRow` with progress / success / error states.

## Responsive

- Drawer stays 480px on desktop. Replace mode does not need extra width — the picker is reduced to a single card.
- `< 768px` — full-width drawer (existing behavior).

## Accessibility

- New text input gets `id="other-document-name"`, paired with a visible `<label htmlFor>` and helper text via `aria-describedby`.
- `maxLength={80}` enforced both at the field and verified in the saga (defensive — prevents bypass).
- Required state announced via `aria-required="true"`.
