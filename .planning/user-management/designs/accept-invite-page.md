# Accept Invite Page

## Purpose

Public page where an invited user sets their password and joins the organization. Accessed via email link at `/invite/accept/:token`.

## Layout

Uses the same `AuthWrapper` + `AuthFormWrapper` layout as the existing login and register pages — centered card on a minimal background. No sidebar, no app navigation.

### Structure

```
┌─────────────────────────────────────────┐
│              [App Logo]                 │
│                                         │
│        Join [Organization Name]         │
│                                         │
│  You've been invited to join as a       │
│  [Role].                                │
│                                         │
│  Name                                   │
│  [John Doe                 ] (readonly) │
│                                         │
│  Email                                  │
│  [john@example.com         ] (readonly) │
│                                         │
│  Password *                             │
│  [________________________]             │
│                                         │
│  Confirm Password *                     │
│  [________________________]             │
│                                         │
│  [        Accept Invitation           ] │
│                                         │
│  Already have an account? Log in        │
│                                         │
└─────────────────────────────────────────┘
```

### Flow

1. Page loads → calls `POST /auth/invites/:token/verify` with the token from URL params
2. **Valid token**: Renders the form pre-filled with invite data (name, email, role, org name)
3. **Expired token**: Shows error state (see below)
4. **Invalid token**: Shows error state (see below)
5. User enters password + confirm password → submits
6. Calls `POST /invitations/accept` with token + password
7. On success → redirect to `/login` with success snackbar: "Account created. Please log in."

### Fields

| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Name | `TextField` | — | Readonly, pre-filled from invite (firstName + lastName) |
| Email | `TextField` | — | Readonly, pre-filled from invite |
| Password | `PasswordField` | Required, min 8 chars, must contain uppercase + lowercase + number | Standard password requirements |
| Confirm Password | `PasswordField` | Required, must match password | |

### States

- **Loading**: Centered spinner while verifying token (skeleton of the card)
- **Valid**: Form rendered with invite details, password fields active
- **Submitting**: Button disabled with spinner, fields disabled
- **Expired token**: Error card —
  ```
  [Clock icon]
  Invitation Expired
  This invitation has expired. Please ask your admin to send a new one.
  [Back to Login]
  ```
- **Invalid token**: Error card —
  ```
  [Error icon]
  Invalid Invitation
  This invitation link is not valid. It may have been revoked or already used.
  [Back to Login]
  ```
- **Server error on accept**: Inline alert below the form with error message, form re-enabled

### Spacing

- Follows existing `AuthFormWrapper` spacing (consistent with login/register)
- 24px between form sections
- 16px between fields within a group

## Visible Data Fields

| UI Label | Expected API Field | Format |
|----------|-------------------|--------|
| Organization Name | `organizationName` | string (from verify response) |
| Role | `role` | string, capitalized (from verify response) |
| Name | `firstName`, `lastName` | string, concatenated, readonly input |
| Email | `email` | string, readonly input |

## Component Hierarchy

```
AcceptInvitePage
  AuthWrapper
    AuthFormWrapper
      // Loading state:
      CircularProgress

      // Error state (expired/invalid):
      Box (centered)
        Icon (AccessTime or ErrorOutline)
        Typography (title)
        Typography (message)
        Button ("Back to Login" — link to /login)

      // Valid state:
      Typography ("Join [OrgName]" — h5)
      Typography ("You've been invited as a [Role]" — secondary)
      Formik
        TextField (name — readonly)
        TextField (email — readonly)
        PasswordField (password)
        PasswordField (confirmPassword)
        Alert (server error — conditional)
        LoadingButton ("Accept Invitation" — full width, primary)
      Link ("Already have an account? Log in" — to /login)
```

## Route

```typescript
{ path: '/invite/accept/:token', element: <AcceptInvitePage /> }
```

This is a **public route** — no `AuthGuard` or `PersistLogin` wrapper. Uses `AuthWrapper` for layout (same as login/register).

## Notes

- Password requirements should match whatever Cognito is configured with. Display them as helper text below the password field.
- The token is extracted from URL params via `useParams()`.
- If the user is already logged in and visits this page, they should still see it (don't redirect to dashboard — they may be accepting an invite for a different org).
