# Invite Welcome Screen

> Reference mockup: `onboard_invite.png`

## Purpose
Landing screen for carriers who received a dispatcher invite. Shows pre-filled data, lets them confirm and begin.

## Layout
- Same dark navy background + centered white card as self-registration
- Card wider (~520px) to accommodate pre-filled fields
- Green "Invited by {orgName}" badge at top of card

## Content
- Badge: "Invited by Hussle Dispatch" — green chip with checkmark icon, positioned above heading
- Heading: "Hi {firstName}, welcome to Hussle Dispatch" (24px, bold)
- Subtext: "You've been invited as a carrier. Confirm your details and complete the form to get started." (14px, grey-600)
- Pre-filled fields (read-only appearance with light grey background):
  - Full Name: "{firstName} {lastName}"
  - Company: "{carrierName}"
  - Phone: "{phone}"
  - MC Number: "{mcNumber}" (if provided)
  - Email: "{email}" (editable — carrier may want to correct)
- Primary button: "Confirm & Start Onboarding →" (green, full-width — green because it's a confirmation/positive action, distinct from the blue "Continue" on registration)

## Interactions
- Fields are pre-populated from the carrier record the dispatcher created
- Email field is editable (carrier may want to update)
- On confirm: validates token, creates/loads onboarding session, redirects to interview
- Invalid/expired token: shows error card with "This invite link has expired. Contact your dispatcher for a new one."
- Revoked token: same error card

## States
- **Loading**: Spinner while validating token on initial load
- **Valid token**: Shows welcome card with pre-filled data
- **Invalid/expired token**: Error card with contact info
- **Submitting**: Button shows spinner

## Responsive
- Card max-width 520px, centers on viewport
- Below 480px: full-width with 16px padding

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Full Name | carrier.name (from session) | string |
| Company | carrier.name | string |
| Phone | carrier.phone | string |
| MC Number | carrier.mcNumber | string |
| Email | carrier.email | string (email) |
