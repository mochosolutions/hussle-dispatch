# Dispatcher Approval Gate

> No reference mockup — follows existing carrier detail page patterns from `carrier-detail-general.png` and `carrier-detail-onboarding.png`

## Purpose
Dispatcher reviews all 6 phases of a carrier's completed onboarding and approves or rejects the application. Accessed from the carrier detail page (new "Review Application" state on the Onboarding tab) or from the dashboard pending carriers queue.

## Layout
Reuses the existing carrier detail page shell:
- Dark navy header with carrier name + status badge ("Pending Review" — amber badge)
- Horizontal tab bar (General, Dispatch Terms, **Onboarding**, Drivers, Vehicles, Load History, Documents, Notes)
- Onboarding tab is auto-selected when arriving from pending queue

## Onboarding Tab — Review Mode

When carrier has onboardingStatus=COMPLETED, the Onboarding tab transforms from a simple checklist into a full review interface:

### Action Bar (top of tab content)
- Left: "Application submitted {timeAgo}" (14px, grey-500)
- Right: Two buttons:
  - "Reject" — secondary/outline, red text. Opens reject dialog.
  - "Approve Carrier" — primary green button. Opens approve confirmation dialog.

### Review Sections (6 expandable cards, all expanded by default)

Each section is a white card with:
- Section header: phase name (16px, semibold) + status indicator (green "Complete" badge)
- Content area with the carrier's submitted data in read-only format

#### Section 1: Company Information
- Two-column field layout matching the existing General tab style
- Fields: Legal Name, MC#, DOT#, EIN, Phone, Email, Address, City/State/Zip
- Primary contact fields
- Factoring details (if provided)
- Fuel card providers as chips

#### Section 2: Equipment & Compliance
- Vehicle type badges (chips showing selected types)
- Per-vehicle table: Category | Year | Make/Model | VIN | Plate
- Compliance summary per type:
  - MC: "{number}" or "Not provided (optional)"
  - DOT: "{number}" or "Not required" or "Required — not provided" (red flag)
  - GVWR: "{weight} lbs" with threshold indicator color
  - Insurance: "${amount}/mo — attested" (green) or "Not attested" (red)
- Medical courier flag: if transportsPharma=true, show amber callout "Compliance call required — carrier transports pharmaceuticals"

#### Section 3: Drivers
- Driver cards: Name, Phone, Pay Type, Pay Rate
- Or "No additional drivers" note

#### Section 4: Cost Analysis
- Compact result summary (not the full-screen navy card — just the numbers):
  - Break-Even RPM: $X.XX
  - Minimum Booking Rate: $X.XX (bold, green)
  - Monthly Expenses: $X,XXX
  - Cost Profile Source: "Onboarding Estimate" badge (amber)
- Note: "This rate will activate in Load Intelligence after approval"

#### Section 5: Lane Preferences
- Home base: City, State
- Max days out: X days
- Preferred lanes as tag chips (origin → destination pairs)
- State preferences: mini state grid or list (preferred in green, avoided in red)
- Freight preferences as chips

#### Section 6: Documents
- Document table: Type | File | Status | Signed/Uploaded Date
  - Dispatch Agreement: "Signed {date}" with green badge, link to view signature
  - COI: "Uploaded {date}, expires {expiry}" with green/amber badge depending on expiry proximity
  - W-9: "Uploaded {date}" with green badge
  - Carrier Packet: "Uploaded {date}" with green badge
- View links to open documents
- Missing documents show red "Missing" badge (should not happen at COMPLETED status, but defensive)

### Approve Confirmation Dialog
- Modal (centered, elevation 4)
- Heading: "Approve {carrierName}?"
- Body: "This will activate the carrier and set their minimum rate to ${minimumRatePerMile}/mi in Load Intelligence. They'll receive an activation email and SMS."
- Buttons: "Cancel" (secondary) / "Approve & Activate" (green primary)

### Reject Dialog
- Modal (centered, elevation 4)
- Heading: "Reject {carrierName}'s application?"
- Body: "The carrier will be notified via email and SMS."
- Required field: "Reason for rejection" (textarea, min 10 chars)
- Buttons: "Cancel" (secondary) / "Reject Application" (red primary, disabled until reason entered)

## Dashboard — Pending Carriers Card

On the main dashboard (alongside existing Needs Attention and Fleet Status cards):

### PendingCarriersCard
- Card title: "Pending Carriers" with count badge
- List of pending carriers (max 5, "View all" link if more):
  - Each row: Carrier name | Type badge | Entry method chip (Invited/Self-Registered) | Submitted time ago | "Review" link
- Empty state: "No carriers pending review" with truck icon
- Clicking "Review" navigates to carrier detail → Onboarding tab

## Carrier List — Invite Button

On the carrier detail page header (for EXTERNAL_CARRIER only, when onboardingStatus is null or NOT_STARTED):
- "Send Onboarding Invite" button in the header action area (where existing action buttons are)
- Opens a small dialog:
  - Confirms carrier email and phone
  - Optional personal message textarea
  - "Send Invite" primary button
- After sending: button changes to "Resend Invite" with "Sent {timeAgo}" text below

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Carrier Name | carrier.name | string |
| Status | carrier.onboardingStatus | OnboardingStatus badge |
| MC Number | carrier.mcNumber | string |
| DOT Number | carrier.dotNumber | string |
| Entry Method | carrier.entryMethod | EntryMethod chip |
| Submitted | session.completedAt | relative time |
| Break-Even RPM | costAnalysis.breakEvenRpm | currency |
| Min Booking Rate | costAnalysis.minimumRatePerMile | currency |
| Monthly Expenses | costAnalysis.totalMonthlyExpenses | currency |
| Cost Profile Source | carrier.costProfileSource | CostProfileSource badge |
| Vehicle Count | vehicles.length | integer |
| Driver Count | drivers.length | integer |
| Insurance Attested | vehicles[].insuranceAttested | boolean badge |
| Transports Pharma | medicalCourierCompliance.transportsPharma | boolean flag |
| Document Status | documents[].reviewStatus | DocumentReviewStatus badge |
| Insurance Expiry | carrier.insuranceExpiry | date |
| Rejection Reason | rejectionReason (input) | string (textarea) |
