# Self-Registration Flow

> Reference mockups: `onboard_signup.png`, `onboard_email_verify.png`

## Purpose
Public entry point for carriers who find Hussle on their own. Email → verify code → begin onboarding.

## Layout
- Dark navy (#0F172A) full-bleed background
- Centered white card (~440px wide), elevation 1 shadow
- "Hussle Dispatch" branding with icon at top of card
- Card vertically centered on viewport

## Screens

### Screen 1: Email Entry
- Heading: "Get started with Hussle" (20px, bold, dark)
- Subheading: brief welcome text (14px, grey-600)
- Single field: "Email Address" (text input, email format)
- Primary button: "Continue →" (blue, full-width within card)
- Footer link: "Already have an account?" → login redirect
- Below card: "Referred by a dispatch company?" link

### Screen 2: Email Verification
- Heading: "Check your email" (20px, bold)
- Subtext: "We sent a verification code to {email}" (14px, grey)
- Label: "ENTER VERIFICATION CODE" (12px, uppercase, grey-500)
- 6 individual digit input boxes (48px square each, 8px gap)
  - Auto-focus first box, auto-advance on digit entry
  - Paste support for full 6-digit code
- Primary button: "Verify & Continue →" (blue, full-width)
- Link below: "Resend code" (text button, blue)
- Error state: red border on boxes + "Invalid code — please try again" below

## Interactions
- Email field validates format on blur
- Continue button disabled until valid email entered
- On submit: shows loading spinner in button, sends POST /carrier-portal/register
- Verification screen: digit boxes auto-advance, paste fills all 6
- On verify success: redirects to /carrier-portal/:token (interview begins)
- Rate limit error (429): shows "Too many attempts. Please wait and try again."
- Code expired: shows "Code expired. Click Resend to get a new one."

## States
- **Loading**: Button shows spinner, inputs disabled
- **Error**: Red border on email field or digit boxes, error message below
- **Success**: Brief checkmark animation before redirect

## Responsive
- Card stays centered, max-width 440px
- Below 480px: card fills full width with 16px horizontal padding, no shadow (feels native)

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Email Address | email | string (email) |
| Org Slug | orgSlug | string (from URL query param) |
| Verification Code | code | string (6 digits) |
