# Decisions — fleet-management

## LOCKED (L) — Must follow exactly

- **L-001: Express + Prisma for all fleet CRUD** — All routes use Express.js, all data access uses Prisma client (per foundation L-001)
- **L-002: UUID for entity IDs** — All entities use `@id @default(uuid())` (per foundation L-009)
- **L-003: Offset-based pagination** — Default 25, max 100, response envelope `{ data, meta: { page, limit, total, totalPages, hasMore } }`, sort via `?sort=field&order=asc|desc` (per foundation L-010)
- **L-004: Soft delete via deletedAt** — All entity deletes set `deletedAt` timestamp; all queries filter `WHERE deletedAt IS NULL`; no hard deletes
- **L-005: Onboarding booleans set manually in MVP** — dispatchAgreementOnFile, insuranceCertOnFile, w9OnFile, carrierPacketOnFile are toggled by ADMIN in the carrier form; no automated document verification
- **L-006: Driver preferences as JSON** — preferredLanes and noGoZones stored as JSON fields on Driver model, not separate tables (per TDD schema)
- **L-007: CPM calculated client-side** — Cost per mile = total monthly expenses / monthly miles target; computed in the frontend, not stored as a database field
- **L-008: MUI sx prop + Redux Toolkit + Saga + Formik + Yup** — Frontend follows existing dispatch-ui conventions for styling, state, and forms
- **L-009: Admin/dispatcher-facing only** — This feature only builds dispatch admin pages; carrier portal (self-service) is a separate feature
- **L-010: OWNER_OPERATOR rejected at runtime** — POST /carriers with type=OWNER_OPERATOR returns 400 (per foundation X-001)
- **L-011: Financial fields on carrier** — dispatchFeePercent, partnerSplitPercent, feeIncludesAccessorials are editable on carrier; Decimal.js with banker's rounding for any calculations (per foundation L-002)
- **L-012: DISPATCHER role cannot see partnerSplitPercent** — API strips partnerSplit fields from responses for DISPATCHER users (per PRD role matrix)

## DEFERRED (D) — Agent decides at implementation

- **D-001: Form field ordering and grouping** — Agent decides based on screenshot layout and DynamicForm section capabilities
- **D-002: DataGrid column widths and sort defaults** — Agent decides; default sort by createdAt desc
- **D-003: Toast notification wording** — Agent decides using notistack for success/error messages
- **D-004: Component decomposition within detail pages** — Agent decides how to split tabs/sections into subcomponents
- **D-005: Carrier list search debounce timing** — Agent decides (suggest 300ms)
- **D-006: Expense editor UX** — Agent decides inline-edit vs modal for expense rows

## EXCLUDED (X) — Out of scope

- **X-001: Carrier portal** — Self-service onboarding, carrier-facing dashboard, carrier preferences page, carrier documents page are all separate feature scope
- **X-002: FMCSA verification** — Shown as "Coming Soon" in designs; not implemented
- **X-003: Self-service onboarding link** — URL generation and email-to-carrier functionality excluded
- **X-004: Performance statistics** — Total loads, revenue, avg rate/mile, on-time %, avg days out require load data; UI shows placeholder/zero until load-management is built
- **X-005: "Find Matching Loads" / "Dispatch Load" buttons** — Shown in designs but belong to load-intelligence and load-management features; include as disabled placeholders
- **X-006: Weekly gross history chart** — Requires load data from load-management; show empty chart placeholder
- **X-007: Driver fit endpoint (GET /drivers/:id/fit)** — Belongs to load-intelligence feature, not fleet-management
- **X-008: Document upload flow** — Actual S3 upload belongs to documents-bol; onboarding uses manual boolean toggles in MVP
- **X-009: Dispatch agreement PDF generation** — Belongs to invoicing feature
- **X-010: Carrier onboarding pipeline view** — The pipeline/list view for managing onboarding workflow is carrier portal scope
- **X-011: Min Book Rate on driver** — Shown in driver detail screenshot but not in Prisma schema; carrier portal preference field, excluded from MVP
