# Registry: hussle-emails

Package: `@hussle/emails` — React Email transactional templates.
Built with `@react-email/components`, outputs `{ subject, html }` via async render functions.

## 1. Inventory

### Render Functions (public API via `src/index.ts`)

| Name | Path | Signature | Purpose |
|------|------|-----------|---------|
| `renderInvoiceEmail` | `invoice/renderInvoiceEmail.ts` | `(data: InvoiceEmailData) => Promise<{ subject; html }>` | Invoice with amount, due date, payment terms |
| `renderStatusChangeEmail` | `statusChange/renderStatusChangeEmail.ts` | `(data: StatusChangeEmailData) => Promise<{ subject; html }>` | Load status change notification |
| `renderCheckCallEmail` | `checkCall/renderCheckCallEmail.ts` | `(data: CheckCallEmailData) => Promise<{ subject; html }>` | Check call update with location/ETA |
| `renderWelcomeEmail` | `welcome/renderWelcomeEmail.ts` | `(data: WelcomeEmailData) => Promise<{ subject; html }>` | Org welcome with role-based next steps |
| `renderInvitationEmail` | `invitation/renderInvitationEmail.ts` | `(data: InvitationEmailData) => Promise<{ subject; html }>` | Team member invitation with accept CTA |
| `renderInvitationAcceptedEmail` | `invitationAccepted/renderInvitationAcceptedEmail.ts` | `(data: InvitationAcceptedEmailData) => Promise<{ subject; html }>` | Notification that invitee joined |

### Shared Components

| Name | Path | Purpose |
|------|------|---------|
| `EmailLayout` | `layout/EmailLayout.tsx` | Standard layout: branded header, content, footer |
| `DataTable` | `shared/DataTable.tsx` | Key-value table with optional highlight |
| `CtaButton` | `shared/CtaButton.tsx` | Centered primary-color link button |
| `emailStyles` | `shared/emailStyles.ts` | Brand colors, font family, reusable style objects |

## 2. Key Types

```typescript
interface InvoiceEmailData {
  invoiceNumber: string; loadNumber: string; carrierName: string;
  totalAmount: string; dueDate: string; paymentTerms: string; replyToEmail: string;
}

interface StatusChangeEmailData {
  loadNumber: string; fromStatus: string | null; toStatus: string; trackingUrl: string | null;
}

interface CheckCallEmailData {
  loadNumber: string; location: string | null; status: string | null;
  eta: string | null; trackingUrl: string | null;
}

interface WelcomeEmailData {
  firstName: string; orgName: string; orgRole: 'CARRIER' | 'DISPATCH_COMPANY'; dashboardUrl: string;
}

interface InvitationEmailData {
  inviterName: string; orgName: string; role: string; inviteUrl: string; expiresAt: string;
}

interface InvitationAcceptedEmailData {
  inviteeName: string; inviteeEmail: string; orgName: string; role: string; teamSettingsUrl: string;
}
```

## 3. Representative Pattern

Every template follows the same two-file pattern: a React component + an async render function.

```typescript
// renderFooEmail.ts — public API
export interface FooEmailData { /* fields */ }

export const renderFooEmail = async (
  data: FooEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Subject line with ${data.field}`,
  html: await render(FooEmail(data)),
});
```

```tsx
// FooEmail.tsx — React component (not exported from index)
const FooEmail = ({ field }: FooEmailData) => (
  <EmailLayout preview="..." headerTitle="..." headerSubtitle="...">
    <Text style={textBody}>Body text</Text>
    <DataTable rows={[{ label: 'Label', value: field }]} />
    <CtaButton href={url}>Action</CtaButton>
  </EmailLayout>
);
```
