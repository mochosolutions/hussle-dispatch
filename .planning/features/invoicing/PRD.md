# Shared Context Preamble

> Every feature PRD should carry this context. It defines the business rules, roles, and patterns that span the entire system.

## Business Model

**Two Carrier Types, Two Financial Flows:**

- **COMPANY_ASSET (Own Fleet):** Company owns/leases the truck. Broker pays the company the full load rate. Dispatch fee calculated as percentage of load rate (or rate + accessorials if configured), split between company and Jr.
- **EXTERNAL_CARRIER (Dispatch Service):** Company dispatches for independent carriers with their own MC. Carrier must complete onboarding before load assignment. Broker pays carrier directly. Carrier pays company a dispatch fee, split between company and Jr.
- **OWNER_OPERATOR:** In data model but NOT implemented in MVP. System rejects attempts to use this carrier type.

**Financial Rules:**

| Rule | Formula |
|------|---------|
| Dispatch fee | `customerRate × feePercent` (or `(customerRate + accessorials) × feePercent` if carrier has feeIncludesAccessorials) |
| Partner split | `dispatchFee × partnerSplitPercent` |
| Company share | `dispatchFee − partnerSplit` |
| Rounding | Banker's rounding (half to even), 2 decimal places, applied once at final stored value |

**Financial field lifecycle:**
- QUOTED: customerRate may be set, financial fields are null
- BOOKED (carrier assigned): dispatchFee, partnerSplit, ratePerMile calculated and stored
- If carrier or rate changes while BOOKED: financials recalculate
- DISPATCHED and beyond: financial fields are frozen

**DISPATCHER role restriction:** API never includes partnerSplit in responses to DISPATCHER users.

**Prohibited Commodities:** Configurable per org. Default: garbage, refuse, recyclables, dirty recyclables. Checked only in Load Creator (not load intelligence).

## Role Permissions Matrix

| Permission | ADMIN | DISPATCHER | VIEWER |
|-----------|-------|------------|--------|
| Full access to all features | Yes | — | — |
| Create/manage loads | Yes | Yes | — |
| Upload broker rate cons | Yes | Yes | — |
| Update load statuses | Yes | Yes (except EXCEPTION, PAID) | — |
| Generate invoice drafts | Yes | Yes | — |
| Approve/send invoices | Yes | — | — |
| View carriers/drivers/vehicles/places | Yes | Yes | Yes (read-only) |
| Create/edit places | Yes | Yes | — |
| Delete carriers/drivers/vehicles/places | Yes | — | — |
| See partner split amounts | Yes | — | — |
| See financial data | Yes | Yes | — |
| Flag EXCEPTION | Yes | — | — |
| Mark PAID | Yes | — | — |
| Access load intelligence feed | Yes | Yes | — |
| View dispatch board (read-only) | Yes | Yes | Yes |
| Invite users | Yes | — | — |
| Cancel loads | Yes | Yes | — |

## State Machine Overview

**13 Statuses:** QUOTED → BOOKED → DISPATCHED → EN_ROUTE_PICKUP → AT_PICKUP → IN_TRANSIT → AT_DELIVERY → DELIVERED → INVOICE_PENDING → INVOICED → PAID. Plus EXCEPTION, CANCELED, TONU.

**Kanban Groups:**

| Column | Color | Statuses |
|--------|-------|----------|
| NEW | Yellow | QUOTED |
| BOOKED | Orange | BOOKED |
| ACTIVE | Green | DISPATCHED, EN_ROUTE_PICKUP, AT_PICKUP, IN_TRANSIT, AT_DELIVERY |
| DELIVERED | Purple | DELIVERED, INVOICE_PENDING |
| COMPLETE | Gray | INVOICED, PAID |
| ISSUES | Red | EXCEPTION, CANCELED, TONU |

**Transition Map:**

| From | Can Go To | Who |
|------|-----------|-----|
| QUOTED | BOOKED, CANCELED | ADMIN, DISPATCHER |
| BOOKED | DISPATCHED, CANCELED | ADMIN, DISPATCHER |
| DISPATCHED | EN_ROUTE_PICKUP, TONU, CANCELED | ADMIN, DISPATCHER |
| EN_ROUTE_PICKUP | AT_PICKUP, TONU | ADMIN, DISPATCHER |
| AT_PICKUP | IN_TRANSIT, TONU | ADMIN, DISPATCHER |
| IN_TRANSIT | AT_DELIVERY, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| AT_DELIVERY | DELIVERED, EXCEPTION | ADMIN, DISP (Exception: ADMIN only) |
| DELIVERED | INVOICE_PENDING, EXCEPTION | System (auto), ADMIN for Exception |
| INVOICE_PENDING | INVOICED | ADMIN (via invoice approval) |
| INVOICED | PAID | ADMIN (via mark paid) |
| PAID | (terminal) | — |
| EXCEPTION | INVOICED | ADMIN |
| CANCELED | (terminal) | — |
| TONU | INVOICED | ADMIN, DISPATCHER |

**Prerequisites:** BOOKED requires carrier. DISPATCHED requires driver + vehicle + onboarding gate (external). CANCELED/EXCEPTION require notes. TONU auto-creates $250 accessorial.

**Side Effects:** → BOOKED: calculate financials. → DISPATCHED: freeze financials. → DELIVERED: auto-generate invoice, → INVOICE_PENDING. → TONU: auto $250 accessorial + invoice. Every transition: LoadStatusHistory record.

**Warnings (soft):** → DISPATCHED without rate con. → DELIVERED without signed BOL. → DISPATCHED with driver < 10 available hours.

## Error Handling Patterns

All features must use typed error classes extending a common base. Specific patterns:

| Scenario | UX |
|----------|-----|
| Invalid status transition | Toast: "Cannot move to [status]. Allowed: [list]" |
| Concurrent edit | "Updated by [user] at [time]. Please refresh." |
| S3 upload fails | "Upload failed. Try again." Retry button. |
| Email fails (3 retries) | "Email failed. PDF saved — download manually." |
| Onboarding docs missing | Hard block: "[Carrier] missing: [doc list]. Complete onboarding first." |
| Insurance expired | Hard block: "[Carrier] insurance expired [date]." |
| Prohibited commodity | Hard block: "This commodity is prohibited per company policy." |
| Dispatching without rate con | Soft warning: "No broker rate con on file. Continue anyway?" |
| Invoice without signed BOL | Warning flag: "Missing signed BOL." |
| Driver no-go zone | Warning: "[Driver] has [state] as no-go zone. Assign anyway?" |
| Redis unavailable | Intel feed: "Load intelligence temporarily unavailable." Dispatch board unaffected. |
| Chrome extension: DOM changed | Extension pauses: "DAT layout may have changed — update available" |

## Directory Mapping (TDD → Actual Paths)

| TDD Reference | Actual Directory | Notes |
|---------------|-----------------|-------|
| `packages/api/` | `hussle-app-dispatch-api/` | Express + Prisma backend |
| `packages/web/` | `hussle-app-dispatch-ui/` | React + Vite + MUI frontend |
| `packages/shared/` | `mocho-ui/` (partial) | Component library; shared types/utils may need a new shared package or go in api |
| `extension/` | Created during chrome-extension feature | Chrome Extension (Manifest V3) |

## Pagination Standard

- Offset-based, default 25, max 100
- Response: `{ data, meta: { page, limit, total, totalPages, hasMore } }`
- Sort: `?sort=field&order=asc|desc` (default: createdAt desc)
- Decimals serialized as strings in JSON
- Intelligence feed: paginated from Redis sorted set, not Postgres

## Sequential Number Generation

- Load: `LD-{YYYY}-{NNNNNN}` — continuous, no annual reset
- Invoice: `INV-{YYYY}-{NNNNNN}` — continuous
- Postgres sequence. Retry on collision (max 3).

## Presigned URL Upload Flow

1. Frontend requests presigned URL: `POST /api/v1/documents/presign`
2. API generates S3 PUT URL (15-min expiry) + document record in "pending" state
3. Frontend uploads directly to S3
4. Frontend confirms: `POST /api/v1/documents/{id}/confirm`
5. API verifies file exists, updates record to "confirmed"

S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`. File limits: PDFs max 5MB, uploads max 10MB. Accepted: PDF, PNG, JPG, JPEG.

---

# Feature 6: invoicing

## Summary

Invoice management with auto-generation on DELIVERED (CUSTOMER vs DISPATCH_FEE types based on carrier type), approval workflow, PDF generation (@react-pdf), SES email delivery with retry, payment tracking, and invoice list/detail pages.

## Scope

**Does:**
- Invoice auto-generation on DELIVERED: COMPANY_ASSET → CUSTOMER invoice (full rate), EXTERNAL_CARRIER → DISPATCH_FEE invoice (dispatch fee amount)
- Due date from contact's payment terms (default net 30)
- Warning flag if signed BOL is missing at generation time
- Invoice approval: ADMIN reviews and approves
- PDF generation: @react-pdf in browser, uploaded to S3 via presigned URL
- Email sending: AWS SES with 3-attempt retry, 5-second delay between
- Payment tracking: mark paid (amount, method, reference, date), partial payment support
- Invoice list with filters (status, type, date range, overdue, missing BOL), count badges, overdue highlighting
- Invoice detail page with line items, approval queue
- InvoicePdfTemplate component
- Email service (SES config, invoice template, dispatch agreement template)

**Does NOT:**
- Modify load status directly (load-management's state machine fires the event)
- Generate dispatch agreement PDFs (that's a V2 enhancement or fleet-management concern)
- Handle document upload flow (uses documents-bol)

## Capabilities

1. Auto-generation: load → DELIVERED triggers INVOICE_PENDING, invoice draft created with type based on carrier type, due date from contact payment terms, missing BOL flag
2. Invoice types: CUSTOMER (bills broker at full rate for COMPANY_ASSET), DISPATCH_FEE (bills carrier for dispatch fee for EXTERNAL_CARRIER)
3. Actions: Edit Draft (line items, notes, terms), Delete Draft (ADMIN only, load reverts to DELIVERED), Approve (ADMIN), Generate PDF & Send (PDF → S3, email → SES), Mark Paid (amount, method, reference, date)
4. Email: SES from `dispatch@[configurable-domain]`, reply-to dispatcher's email. Invoice delivery email with PDF attachment. 3 retries, 5s delay. On failure: "Email failed. PDF saved — download manually." Invoice stays APPROVED (not SENT).
5. Payment: partial → PARTIALLY_PAID, full → PAID, load → PAID

## Success Criteria

- GIVEN COMPANY_ASSET load DELIVERED THEN CUSTOMER invoice draft created for full rate
- GIVEN EXTERNAL_CARRIER load DELIVERED THEN DISPATCH_FEE invoice draft created for dispatch fee amount
- GIVEN invoice missing signed BOL THEN warning flag visible in list and detail
- GIVEN ADMIN deletes draft THEN invoice removed, load → DELIVERED
- GIVEN DISPATCHER tries to approve THEN rejected (ADMIN only)
- GIVEN email fails after 3 retries THEN "Email failed. PDF saved — download manually." Invoice stays APPROVED.

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Invoice (lines 733-766) — all fields including missingSignedBol, pdfUrl, sentAt/sentTo
- InvoiceType enum (lines 768-771): CUSTOMER, DISPATCH_FEE
- InvoiceStatus enum (lines 773-781): DRAFT, APPROVED, SENT, PARTIALLY_PAID, PAID, OVERDUE, VOID

**Depends on from foundation:**
- Financial calculations (to compute invoice amounts)
- Sequence generator (invoice numbers: `INV-{YYYY}-{NNNNNN}`)
- S3 presign (for PDF upload)
- Error classes, auth middleware, pagination

## User Flows

**Auto-Generation on Delivery:**
1. Load transitions to DELIVERED (via load-management state machine)
2. System determines carrier type → creates invoice draft
3. If COMPANY_ASSET: CUSTOMER invoice at full customerRate + accessorials
4. If EXTERNAL_CARRIER: DISPATCH_FEE invoice at dispatchFee amount
5. Due date = today + contact's paymentTermsDays
6. If no signed BOL: missingSignedBol=true, flag shown
7. Load status → INVOICE_PENDING

**Approve and Send:**
1. ADMIN navigates to invoice list → filters to DRAFT
2. Reviews invoice detail, edits if needed
3. Clicks "Approve" → status = APPROVED
4. Clicks "Generate PDF & Send" → @react-pdf generates PDF in browser → uploads to S3 → SES sends email
5. Status → SENT. If no recipient email: warning with manual download.

**Record Payment:**
1. ADMIN opens invoice detail (SENT status)
2. Clicks "Mark Paid" → enters amount, method, reference, date
3. If partial: PARTIALLY_PAID. If full: PAID, load → PAID.

## Affected Services

- `hussle-app-dispatch-api` — Invoices module, Email service (SES)
- `hussle-app-dispatch-ui` — Invoices list page, invoice detail, InvoicePdfTemplate, InvoiceApprovalQueue

## Technical Context

**mocho-ui components:**
`PageWrapper`, `PageHeader`, `MainCard`, `Tabs`, `DataGrid`/`ActionsCell`, `AnalyticEcommerce`, `Dot`, `ConfirmDialog`, `EmptyState`, `ListSkeleton`, `createCrudSlice`, `createEntityModule`

**Key technical decisions:**
- PDF generated client-side with @react-pdf, then uploaded to S3
- SES email is async with 3-attempt retry and 5s delay
- Invoice deletion allowed only in DRAFT status, only by ADMIN
- VOID status exists for cancellation after sending (no auto-use in MVP)
- Invoice auto-generation is triggered by domain event from load state machine, not by direct import

**API Endpoints:**

```
GET    /api/v1/invoices                     ?status=&type=&overdue=&missingBol=
GET    /api/v1/invoices/:id
PATCH  /api/v1/invoices/:id
DELETE /api/v1/invoices/:id
POST   /api/v1/invoices/:id/approve
POST   /api/v1/invoices/:id/send            { email }
POST   /api/v1/invoices/:id/mark-paid       { amount, method, reference, date }
```

**Email Templates:**

| Email | Trigger | Subject | Attachment |
|-------|---------|---------|------------|
| Invoice Delivery | ADMIN sends approved invoice | "Invoice [INV-2026-000042] — [Company Name]" | Invoice PDF |
| Dispatch Agreement | ADMIN clicks "Send Agreement" | "Dispatch Agreement — [Company Name]" | Generated agreement PDF |

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.7 Invoice Manager | 401-431 |
| `docs/prd.md` | S7 Email Specifications | 897-924 |
| `docs/tdd.md` | Invoice model + InvoiceType + InvoiceStatus enums | 733-781 |
| `docs/tdd.md` | P1 Invoice endpoints | 1449-1465 |

## Screenshots

None specific to invoicing in `docs/screenshots/`.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 401-431 (Invoice Manager) and 897-924 (Email Specs). TDD has Invoice model at lines 733-781 and endpoints at 1449-1465. Depends on load-management + documents-bol. Generate BE stories for invoice auto-generation + approval + PDF + SES email + payment tracking, FE stories for invoice list + detail + PDF template + approval queue.

## Dependencies

- **foundation** — Prisma schema (Invoice model), financial calculations, sequence generator, S3 presign, error classes
- **load-management** — Load state machine fires invoice generation event on DELIVERED
- **documents-bol** — Signed BOL status checked at invoice generation time
