# Interview — Completion Screen

> Reference mockup: `carrier_complete.png`

## Purpose
Shown after the carrier submits the final phase (Documents). Confirms submission and sets expectations for the review process.

## Layout
- White background (returns from navy cost analysis card to white)
- Centered content, max-width ~600px
- Generous top padding (64px)

## Content

### Success Header
- Green checkmark in a circle (48px, centered, green-500 fill with white check)
- Heading: "You're submitted, {firstName}." (30px, bold, grey-900)
- Subtext: "Your onboarding is complete. {orgName} will review your application and activate your account — usually within a few hours. You'll get an email when you're live." (16px, grey-600, max-width ~500px, centered)

### Completion Checklist
- Section label: "WHAT YOU COMPLETED" (12px, uppercase, grey-400, letter-spacing)
- Checklist items, each with green checkmark icon:
  - "Company info — {carrierName}, MC: {mcNumber}"
  - "Vehicles configured — {vehicleCount} vehicle(s)"
  - "Cost analysis — ${minimumRatePerMile}/mi minimum rate"
  - "Lane preferences — {homeBaseState} preferred, {noGoCount} zones avoided"
  - "Dispatch agreement — signed"
  - "COI uploaded — expires {insuranceExpiry}"
  - "Cost profile saved — Break-even: ${breakEvenRpm}/mi"
- Each item: green check icon (16px) + text (14px, grey-700)
- 8px vertical spacing between items

### Post-Activation Callout
- Card with amber/yellow left border (4px)
- Title: "Few things to do after activation" (16px, semibold)
- Items:
  - "Complete your full expense profile with your dispatcher — this makes your rate more precise"
  - "Download the FleetCommand app to track loads on the go"
  - Any other relevant next steps
- 14px, grey-600

### Footer
- "Questions? Contact {orgName} at {dispatcherEmail}" (14px, grey-500, centered)
- No navigation — this is a dead end. Carrier waits for activation email.

## States
- **Submitting**: Shows brief spinner before transitioning to this screen (POST /session/complete in progress)
- **Submit failed**: Shows error card with retry button instead of success
- **Already submitted**: If carrier revisits the link after submission, show this same screen (read from session.completedAt)

## Responsive
- Content max-width 600px, 24px padding on mobile
- Checklist items stack vertically (no change needed)
- Checkmark + text on same line at all sizes

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Carrier Name | carrier.name | string |
| MC Number | carrier.mcNumber | string |
| Vehicle Count | vehicles.length | integer |
| Min Rate/Mile | costAnalysis.minimumRatePerMile | currency |
| Break-Even RPM | costAnalysis.breakEvenRpm | currency |
| Home Base State | lanePreferences.homeBaseState | string (2-char) |
| Insurance Expiry | document.insuranceExpiry | date |
