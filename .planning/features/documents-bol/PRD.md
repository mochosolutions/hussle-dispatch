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

# Feature 5: documents-bol

## Summary

Document management module with presigned URL upload flow, BOL two-stage workflow (unsigned at pickup, signed at delivery), broker rate con document handling, and shared DocumentUpload component.

## Scope

**Does:**
- Document module: presigned URL upload (request → S3 direct upload → confirm), list by load/carrier/type
- BOL two-stage workflow: unsigned BOL prompted at AT_PICKUP, signed BOL prompted at DELIVERED
- Broker rate con document handling: upload sets rateConReceivedAt, multiple uploads (latest is primary, previous archived)
- DocumentUpload shared component
- BolWorkflow component (prompts at AT_PICKUP and DELIVERED statuses)
- Document list on load detail and carrier detail pages

**Does NOT:**
- Generate invoice PDFs (that's invoicing)
- Send emails with attachments (that's invoicing)
- Manage carrier onboarding booleans (that's fleet-management)
- Handle load status transitions (that's load-management — documents-bol provides UI prompts)

## Capabilities

1. Presigned URL flow: `POST /api/v1/documents/presign` → S3 PUT URL (15-min expiry) + pending record → frontend uploads directly → `POST /api/v1/documents/:id/confirm` → verified
2. BOL at pickup (AT_PICKUP): prompt "Upload unsigned BOL from shipper", type=BOL_UNSIGNED, check call should capture arrival/loading ETA/broker notified
3. BOL at delivery (AT_DELIVERY→DELIVERED): prompt "Upload signed BOL", type=BOL_SIGNED. Warning if no signed BOL when transitioning to DELIVERED. Load tracks `bolSignedAt`.
4. Broker rate con: type=BROKER_RATE_CON, sets `rateConReceivedAt`. Multiple uploads: latest primary, previous archived (not deleted).
5. Document types supported: BROKER_RATE_CON, BOL_UNSIGNED, BOL_SIGNED, DISPATCH_AGREEMENT, INSURANCE_CERT, W9, CARRIER_PACKET, INVOICE, LUMPER_RECEIPT, SCALE_TICKET, OTHER
6. S3 structure: `{orgId}/loads/{loadId}/{type}/{filename}` and `{orgId}/carriers/{carrierId}/{type}/{filename}`
7. File limits: PDFs max 5MB, uploads (BOL, POD) max 10MB. Accepted: PDF, PNG, JPG, JPEG.

## Success Criteria

- GIVEN a load at AT_PICKUP WHEN dispatcher views load detail THEN an "Upload Unsigned BOL" prompt is visible
- GIVEN a load transitioning to DELIVERED without signed BOL WHEN dispatcher confirms THEN warning displayed and load transitions with bolSignedAt=null
- GIVEN a load at DELIVERED with signed BOL WHEN invoice auto-generates THEN invoice has no missing-BOL warning
- GIVEN a load at DELIVERED without signed BOL WHEN invoice auto-generates THEN invoice displays "Missing signed BOL" flag
- GIVEN a load in QUOTED status WHEN dispatcher uploads a broker rate con THEN document is stored and rateConReceivedAt is set
- GIVEN a load transitioning to DISPATCHED with no broker rate con uploaded THEN show warning: "No broker rate con on file"
- GIVEN a load with a broker rate con WHEN dispatcher uploads a new one THEN new document becomes primary, previous is archived

## Data Requirements

**Prisma models (defined in foundation, consumed here):**
- Document (lines 783-821) — all fields including uploadStatus, isArchived
- DocumentType enum (lines 809-821)

**Depends on from foundation:**
- S3 presign utility
- Error classes, auth middleware

## User Flows

**Upload Broker Rate Con:**
1. From load detail (QUOTED status), click "Upload Rate Con"
2. DocumentUpload component opens → select file
3. Frontend calls `POST /api/v1/documents/presign` → gets presigned URL
4. Frontend uploads file directly to S3
5. Frontend calls `POST /api/v1/documents/:id/confirm`
6. rateConReceivedAt set on load

**BOL Workflow:**
1. Load reaches AT_PICKUP → BolWorkflow component shows "Upload unsigned BOL from shipper"
2. Dispatcher uploads unsigned BOL
3. Load reaches AT_DELIVERY → dispatcher transitions to DELIVERED
4. BolWorkflow shows "Upload signed BOL"
5. If no signed BOL: warning "No signed BOL on file — payment may be delayed. Continue anyway?"
6. bolSignedAt set when signed BOL uploaded

## Affected Services

- `hussle-app-dispatch-api` — Documents module (routes, controller, service)
- `hussle-app-dispatch-ui` — DocumentUpload component, BolWorkflow component, document list components

## Technical Context

**mocho-ui components:**
`MainCard`, `DocumentImageUploadField`, `ConfirmDialog`, `LoadingButton`, `useDocumentUpload`

**Key technical decisions:**
- Direct-to-S3 upload via presigned URLs (API never handles file bytes)
- Orphaned S3 files cleaned by lifecycle rules (7 days)
- Document "pending" → "confirmed" two-step ensures file actually reached S3
- Archive old rate cons rather than delete (audit trail)
- BOL workflow is a UI component that integrates with load detail — it doesn't own status transitions

**API Endpoints:**

```
POST   /api/v1/documents/presign            { fileName, mimeType, loadId?, carrierId?, type }
POST   /api/v1/documents/:id/confirm
GET    /api/v1/documents                    ?loadId=&carrierId=&type=
```

## PRD/TDD Source References

| Source | Sections | Lines |
|--------|----------|-------|
| `docs/prd.md` | S4.5 BOL Workflow | 323-354 |
| `docs/prd.md` | S6 Document Types | 879-895 |
| `docs/prd.md` | S9 Presigned URL flow | 934-948 |
| `docs/tdd.md` | Document model + DocumentType enum | 783-821 |
| `docs/tdd.md` | P0 Documents endpoints | 1443-1447 |

## Screenshots

None specific to documents. BOL workflow is visible in load detail screenshots.

## /prd-refine Conversation Starter

> Requirements in docs/prd.md lines 323-354 (BOL Workflow), 879-895 (Document Types), 934-948 (Presigned URL flow). TDD has Document model at lines 783-821 and endpoints at 1443-1447. Depends on load-management. Generate BE stories for document presign/confirm/list + BOL workflow + rate con handling, FE stories for upload component + BOL prompts + document list.

## Dependencies

- **foundation** — Prisma schema (Document model), S3 presign, error classes, auth middleware
- **load-management** — Load detail page integrates document upload and BOL workflow
