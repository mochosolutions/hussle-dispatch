# Decisions — foundation

## LOCKED (L) — Must follow exactly

- **L-001: Express + Prisma backend** — API uses Express.js 4.x + Prisma 5.x on Node.js (per TDD §1)
- **L-002: Decimal.js with banker's rounding** — All financial math uses Decimal.js with ROUND_HALF_EVEN, 2 decimal places, applied once at final stored value (per PRD §2)
- **L-003: State machine is pure data** — Transition maps + pure functions, not a class. Side effects are string tags resolved at runtime by load-management (per TDD §5)
- **L-004: Scoring utils in API package** — All scoring utilities (minBookRate, compositeScore, chainScore, driverFit, CPM) live in `hussle-app-dispatch-api/src/shared/scoring/`. Extract to shared package later if frontend needs them.
- **L-005: Redis for ephemeral, Postgres for permanent** — Load intelligence, market data, geo centroids in Redis. All business entities in Postgres (per TDD §1)
- **L-006: Geo data from CSV** — US city centroids bootstrapped from `data/us-cities.csv` at API startup, not fetched from external API (per TDD §2)
- **L-007: Auth middleware from existing package** — Foundation integrates with the existing auth module (`packages/auth/`), does not reimplement auth
- **L-008: TDD for business logic** — Financial calculations, state machine, onboarding gate, and scoring utilities use test-first (RED-GREEN-REFACTOR) approach
- **L-009: UUID for entity IDs** — All Prisma models use `@id @default(uuid())` (per TDD §3 schema)
- **L-010: Offset-based pagination** — Default 25, max 100, response envelope with meta (per PRD §11)
- **L-011: Sequence format** — Loads: `LD-{YYYY}-{NNNNNN}`, Invoices: `INV-{YYYY}-{NNNNNN}`, continuous, Postgres sequence, retry on collision max 3 (per PRD §8)

## DEFERRED (D) — Agent decides at implementation

- **D-001: Jest configuration details** — Test runner setup (transforms, module resolution, coverage thresholds) decided by implementing agent
- **D-002: Express middleware ordering** — Exact middleware chain order (cors, helmet, body-parser, auth, error handler) decided by implementing agent
- **D-003: Internal function signatures** — Parameter ordering, return types for internal helpers decided by implementing agent
- **D-004: Redis client library** — ioredis vs redis (node-redis) — agent chooses based on current best practice
- **D-005: S3 SDK version** — @aws-sdk/client-s3 v3 preferred, agent confirms

## EXCLUDED (X) — Out of scope

- **X-001: OWNER_OPERATOR implementation** — Data model includes the enum value but system rejects at runtime. Full implementation is post-MVP.
- **X-002: API routes/controllers** — Foundation provides shared utilities only. Individual feature modules (loads, carriers, etc.) own their routes.
- **X-003: UI components** — Backend only. No React components in this feature.
- **X-004: CI/CD pipeline** — No GitHub Actions or deploy config. Handled separately.
- **X-005: Observability/monitoring** — No structured logging, APM, or health checks beyond basic Express setup. Consider post-foundation.
- **X-006: Email/SES configuration** — SES setup belongs to the invoicing feature, not foundation.
