# Invite Member Dialog

## Purpose

Admin invites a new user to their organization by providing name, email, and role. This is a modal dialog — 4 fields, quick action, no need for a full page.

## Layout

Standard MUI `Dialog` — max-width `sm` (444px). Single-column form.

### Structure

```
┌─────────────────────────────────────┐
│  Invite Team Member            [X]  │
│─────────────────────────────────────│
│                                     │
│  First Name *                       │
│  [________________________]         │
│                                     │
│  Last Name *                        │
│  [________________________]         │
│                                     │
│  Email *                            │
│  [________________________]         │
│                                     │
│  Role *                             │
│  [  Select role          v]         │
│                                     │
│─────────────────────────────────────│
│              [Cancel]  [Send Invite]│
└─────────────────────────────────────┘
```

### Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| First Name | `TextField` | Required, min 1 char | Auto-focused on open |
| Last Name | `TextField` | Required, min 1 char | |
| Email | `EmailField` | Required, valid email format | |
| Role | `SelectField` | Required | Options: Admin, Dispatcher, Viewer, Driver. Default: Dispatcher |

### Spacing

- 24px padding inside dialog content
- 16px gap between fields
- 32px between last field and footer actions

### Actions

- **Cancel** (secondary/text button): Closes dialog, resets form
- **Send Invite** (primary button): Submits form
  - Shows spinner on button during submission
  - On success: closes dialog, shows success snackbar ("Invitation sent to [email]"), refreshes invitation list
  - On error: shows inline error below the form (e.g., "This email has already been invited")

### Validation

- Inline validation on blur for each field
- Email format validation via Yup schema
- Server-side duplicate check — API returns error if email already has a pending invite or active membership

### States

- **Initial**: Empty form, "Send Invite" enabled
- **Submitting**: Button disabled with spinner, fields disabled
- **Server error**: Error alert below fields, form re-enabled for correction

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| First Name | `firstName` | string (input) |
| Last Name | `lastName` | string (input) |
| Email | `email` | string (input) |
| Role | `role` | string enum (select) |

## Component Hierarchy

```
InviteMemberDialog (MUI Dialog)
  DialogTitle ("Invite Team Member" + close icon button)
  DialogContent
    Formik
      TextField (firstName)
      TextField (lastName)
      EmailField (email)
      SelectField (role)
      Alert (server error — conditional)
  DialogActions
    Button ("Cancel" — text)
    LoadingButton ("Send Invite" — contained primary)
```
