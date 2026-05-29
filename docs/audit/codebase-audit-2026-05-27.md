# FleetCommand — Deep Codebase Audit (2026-05-27)

**Scope:** Security + correctness audit of the entire codebase (API + UI + infra), run after the 2026-05-14 MVP status audit. Findings here are issues uncovered by hunting the codebase, NOT just verification of the prior P0/P1 list.

**Method:** Five parallel review agents covered:
1. API injection / SSRF / file ops / unsafe ops
2. UI client-side security
3. Backend business-logic correctness & concurrency
4. Infra / Docker / CI security
5. Cross-cutting authn/authz & access control

---

## Prior audit re-verification summary

- **MVP P0 blockers (8/8): RESOLVED** — CSRF, invite-accept, data scoping, auto-invoice, LoadRateDrawer, driver pay fields, DOCUMENT_UPLOADED event, carrier-portal docs gate
- **MVP P1 (9/10): RESOLVED** — fuel/IFTA Decimal.js, optimistic locking, carrier-type enum, vehicle finance fields, weekly-revenue chart, driver-location endpoint, eventBus health check, dat-load-scraper s3.ts deleted
- **Still open from prior audit:** HIGH-34 — facility-hours editor missing from `PlaceFormDrawer` (DB has `FacilityDayHoursEntry`, UI exposes only freeform `operatingHours` string)

---

## 🔴 SEV-CRITICAL (5)

### 1. Recurring Expense IDOR — cross-org write
- **`src/expenses/services/recurringExpenseService.ts:72,85`**
- **`src/expenses/repositories/recurringExpenseRepositoryPrisma.ts:34-35,57`**

`findById(id)` and `update(id, data)` have no `organizationId` scope. The service also doesn't validate org ownership before calling. A dispatcher in Org A can edit/deactivate Org B's recurring expenses by guessing/enumerating IDs.

**Fix:**
```ts
findById: (id: string, organizationId: string) =>
  prisma.recurringExpense.findFirst({ where: { id, organizationId } })
```
Apply org scope at BOTH the service (defense-in-depth) and repo level.

### 2. Invoice double-billing race
- **`src/invoices/services/invoiceReadinessSubscriber.ts:35-48`**

Idempotency check `findManyByLoadId()` → conditional `invoiceRepo.create()` is **not atomic**. RabbitMQ at-least-once delivery + concurrent message processing → two DISPATCH_FEE invoices for the same load. No `@@unique(loadId, type, status)` constraint in Prisma schema to backstop.

**Fix:**
- Add `@@unique([loadId, type])` (or `[loadId, type, status]` if needed) to `Invoice` model
- Wrap idempotency check + create in `prisma.$transaction()`
- Catch `Prisma.PrismaClientKnownRequestError` P2002 (unique violation) and treat as success (idempotent)

### 3. Settlement number collision (no DB uniqueness)
- **`prisma/schema.prisma:1362`**
- **`src/settlements/services/settlementService.ts:121-132`**

`settlementNumber` field has no `@unique` constraint. Generation algorithm can collide on nanosecond timestamps under load. Non-atomic `findOverlapping()` → `create()` lets two concurrent generators both pass the check and insert duplicates.

**Fix:**
- Add `@@unique([organizationId, settlementNumber])` to Schema
- Add `@@unique([organizationId, carrierId, driverId, periodStart, periodEnd])` (null-safe via COALESCE) to prevent duplicate settlements per period
- Catch P2002 in the service for idempotent retries

### 4. Carrier Portal Document `findById` IDOR
- **`src/carrier-portal/repositories/portalDocumentRepoPrisma.ts:52-58`**

`findById(id)` returns any document by ID regardless of org/carrier. Appears unused in favor of `findByIdAndCarrier`, but exists as a footgun.

**Fix:** Remove the method, or require scope:
```ts
findById: async (id, organizationId, carrierId) =>
  prisma.document.findFirst({
    where: { id, organizationId, entityId: carrierId }
  })
```

### 5. DB migration race on concurrent boots
- **`migrate-and-start.sh`**

`prisma migrate deploy` runs in the container entrypoint with no advisory lock. Two pods booting in parallel can run migrations concurrently → partial application → schema drift → data corruption.

**Fix:**
- Wrap migrations in Postgres advisory lock (`pg_try_advisory_lock`)
- OR use Kubernetes init-container pattern (single pod runs migrations before deployment)
- OR run migrations as a separate CI step before image rollout

---

## 🟠 SEV-HIGH (10)

### Authorization & access control

**6. Agreement IDOR** — `src/agreements/repositories/agreementRepositoryPrisma.ts:33`
`findById: (id) => prisma.agreement.findUnique({ where: { id } })` — no org filter.

**7. SMS Prompt Schedule IDOR** — `src/sms-prompts/repositories/smsPromptScheduleRepositoryPrisma.ts:21-22`
`findById` with no loadId or organizationId filter.

### Financial correctness

**8. Decimal precision loss in invoice creation** — `invoiceReadinessSubscriber.ts:54`, `invoiceBuilderService.ts:103-105`
`.toNumber()` casts Decimal → JS float before DB write. Sub-cent precision lost (e.g., `new Decimal("10.005").toNumber()` rounds at the float boundary). Pass Decimals as strings to Prisma, or `.toFixed(2)` before write.

**9. Rounding mode divergence across services** — `shared/financials.ts:9` defines `ROUNDING = ROUND_HALF_EVEN`, but `invoiceBuilderService.ts:103-105` skips intermediate rounding entirely while `settlementRepositoryPrisma.ts:198-201` rounds explicitly. Round-then-sum vs sum-then-round → $10.005 invoice + $20.005 expense ≠ settlement total. Enforce a single `round2()` helper at every money→storage boundary.

**10. Cancel/refund flow incomplete** — `src/invoices/services/canceledLoadSubscriber.ts:11,23`
Only voids DRAFT and APPROVED invoices on load cancel. SENT, PARTIALLY_PAID, and PAID invoices are orphaned with no reversal journal entry or credit memo. Carrier can claim they were never refunded; unpaid receivables stay on the books.

**11. Settlement recalculate precision drift** — `settlementRepositoryPrisma.ts:187-201`
Chains 5 Decimal arithmetic operations then `.toNumber()` for final write. Intermediate float conversion → cumulative drift. Keep all intermediates as Decimal, round once at final write.

### Infrastructure

**12. Rate limiter ineffective behind proxy** — `app.ts` is missing `app.set('trust proxy', true)`. Behind Traefik, every request appears to come from the proxy IP → `express-rate-limit` sees one client → no actual rate limiting. **DoS bypass.**

**13. Traefik missing HTTP→HTTPS redirect + HSTS** — `docker-compose-prod.yml:58-61`
No `redirect-to-https` middleware. No HSTS header. Plaintext HTTP requests succeed → credential/session interception.

**14. Health endpoint info leak** — `/api/health` is public and returns `{db, redis, eventBus}` status. Enumerates backend dependencies for an attacker. Either restrict to internal IPs or return only `{status: 'ok'|'error'}`.

**15. Reverse tabnabbing** — `target="_blank"` without `rel="noopener noreferrer"`:
- `src/mocho/components/layout/CommonLayout/Header.tsx:138,156`
- `src/mocho/components/layout/CommonLayout/FooterBlock.tsx` (multiple)
- `src/mocho/components/layout/ProfileSetupLayout/Footer/index.tsx:25,34,43`
- `src/mocho/components/cards/ComponentHeader.tsx`

---

## 🟡 SEV-MEDIUM (12)

### Backend correctness

**16. Mass assignment risk** — `customerRepositoryPrisma.ts:99-101` — `data: { organizationId, ...input }` spread without explicit allowlist. Safe today via typed `CreateCustomerInput`, but a typo or future field addition could open privilege escalation. Replace spread with explicit field mapping.

**17. Settlement overlap query treats `undefined` as `null`** — `settlementRepositoryPrisma.ts:139`
`driverId: driverId ?? null` silently converts undefined → null. If caller passes undefined accidentally, overlap check misses and duplicate settlements get created. Pre-validate that `driverId` is UUID string OR explicitly null.

**18. Decimal serialization outside Express response** — `decimalReplacer` is registered only at the app.ts top level (`src/app.ts:50-55`). Subscribers, cron jobs, or anything that calls `JSON.stringify()` on objects containing Decimals bypasses it → `[object Object]` or precision loss in logs/event payloads. Always `.toString()` Decimals before serializing in non-response paths.

**19. Recurring expense repo `update` lacks org scope** — `recurringExpenseRepositoryPrisma.ts:57`
Defense-in-depth gap. Even if the service guard is correct today, a future caller forgetting it has no backstop. Add `organizationId` to the where clause.

### Frontend

**20. Portal tokens in URL path** — `src/features/carrier-portal/components/steps/CompleteStep/index.tsx:120` (`/carrier-portal/${token}/sign-agreement`) and `src/features/driver-portal/pages/DriverPortalPage` (token extracted from URL params). Tokens visible in browser history, referer headers, and server logs. Consider fragment-based tokens or short-lived server-issued session cookies.

### Infra / API surface

**21. Unsafe redirect in document download** — `documents/controllers/documentController.ts:56` — `res.redirect(302, url)` where `url` is the storage provider's presigned URL. Internally generated today, but no scheme validation. Add `https://`-only guard before redirect.

**22. Email header injection vector** — `invoices/services/invoiceEmailService.ts:103-110`, `settlements/services/settlementEmailService.ts:89-95` — user-controlled fields (carrier name, driver name, settlement number) flow into email subject without stripping `\r\n`. SMTP header injection risk.

```ts
const sanitizeEmailHeader = (val: string) => val.replace(/[\r\n]/g, '');
```

**23. Path traversal in localStorageProvider** — `src/shared/storage/localStorageProvider.ts:43`
`join(resolvedBase, key)` on read/write without explicit `..` rejection. Cleanup path at line 163 has a `startsWith(resolvedBase)` check but reads/writes don't. Dev-only fallback today (S3 is prod), but worth fixing.

**24. Morgan "combined" format logs Authorization header** — `app.ts:124`
Default format may capture Bearer tokens / cookies. Use a custom format that excludes `Authorization` and sensitive cookies.

**25. Nginx CSP missing** — `nginx.conf:16-17` has no `Content-Security-Policy` header. Add at least `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'`.

**26. RabbitMQ uses default `guest` username** — `docker-compose-prod.yml:35` rotates only the password. The `guest` username is a known RabbitMQ default; rename to a custom account.

**27. No S3 bucket lifecycle/encryption assertion** — compose references `S3_BUCKET` but doesn't enforce encryption-at-rest, versioning, or lifecycle policies. Verify out-of-band; document required bucket policy in deploy docs.

---

## 🟢 SEV-LOW (5)

- **28.** `moment@2.30.1` deprecated in UI bundle; `date-fns` already available. Purge moment imports.
- **29.** No SBOM / container scanning (Trivy, docker scan) in `Jenkinsfile.build` — base image CVEs reach prod undetected.
- **30.** No approval gate for dev deployments in `Jenkinsfile.deploy` (only prod requires approval).
- **31.** `.gitignore` missing `*.pem`, `*.key`, `*.cert`, `*.p12`, `*.pfx` — accidental key commit not prevented.
- **32.** Nginx asset cache set to `1y` — too long if compromised JS gets deployed. Reduce to 30-90d.

---

## ✅ Strong Controls Verified (don't fix what isn't broken)

- No `$queryRaw` / `$executeRaw` usage — SQL injection paths absent
- No SSRF (external URLs are all hardcoded: S3, AWS Location, DocuSeal)
- No `child_process.exec` / `spawn` with variables — no command injection
- No `eval`, `new Function`, `vm.runInContext`, unsafe YAML — no deserialization risk
- DocuSeal webhook uses `crypto.timingSafeEqual` with HMAC-SHA256
- API keys stored as SHA256 hashes with timing-safe comparison
- Tiptap output renders ProseMirror JSON (safe — no `dangerouslySetInnerHTML`)
- Axios CSRF interceptor attaches token from cookie globally
- No JWTs in localStorage or sessionStorage
- No production source maps in `dist/`
- `getValidRedirectUrl()` whitelists `returnTo` against marketing-site URL
- File upload MIME allowlist (`image/jpeg, image/png, application/pdf`) + size limits
- Token-refresh queue prevents thundering herd
- Switch-org validates active membership server-side
- All sampled mutating routes have `requireRole` (carriers, drivers, invoices, settlements, expenses, api-keys, documents)
- Helmet CSP + HSTS + X-Frame-Options properly configured at API
- Docker/CI: no secrets in build args, lockfiles committed, `DOCUSEAL_API_KEY` / `JWT_SECRET` / AWS creds all properly externalized via env

---

## 🎯 Top 10 Fix Priority

| # | Item | Sev | Why first |
|---|------|-----|-----------|
| 1 | Add `app.set('trust proxy', true)` to API app.ts | HIGH | One-line fix, restores all rate limiting |
| 2 | Scope `recurringExpense.findById/update` by orgId at service + repo | CRIT | Active cross-org financial write |
| 3 | Add `@@unique([loadId, type])` on Invoice + wrap subscriber in `$transaction` | CRIT | Stops duplicate billing on RabbitMQ redelivery |
| 4 | Add `@@unique([orgId, settlementNumber])` + period uniqueness | CRIT | Reconciliation integrity |
| 5 | Postgres advisory lock around `prisma migrate deploy` | CRIT | Concurrent-boot safety |
| 6 | Scope `agreement.findById` and `smsPromptSchedule.findById` by orgId | HIGH | IDOR closure |
| 7 | Replace `.toNumber()` with `.toString()`/`.toFixed(2)` in invoice/settlement writes | HIGH | Sub-cent integrity |
| 8 | Extend `canceledLoadSubscriber` to handle SENT/PAID invoices | HIGH | Avoids orphan receivables |
| 9 | Traefik HTTPS redirect + HSTS labels in `docker-compose-prod.yml` | HIGH | TLS enforcement |
| 10 | Email subject `\r\n` strip in invoice/settlement email services | MED | SMTP header injection |

---

## Bottom line

Baseline security is **solid**: no injection, no SSRF, proper CSRF, MIME allowlists, HttpOnly tokens, parameterized Prisma queries everywhere.

Real risk lives in two places:

1. **Financial correctness under concurrency.** Invoice/settlement/expense paths have race conditions because DB-level uniqueness constraints are missing — code idempotency is necessary but not sufficient when RabbitMQ delivers at-least-once.
2. **A small set of IDOR holes on `findById` repo methods.** The codebase consistently scopes lists by `organizationId`, but a handful of `findUnique({ where: { id } })` patterns slipped through. These are footguns even where currently safe.

**Infra blockers before exposing to real traffic:** `trust proxy`, migration lock, Traefik HTTPS redirect.

---

## Reference / Definitions

**IDOR (Insecure Direct Object Reference):** An API exposes a resource by ID and the user is authenticated, but the server doesn't check whether the caller is allowed to access *that specific resource*. Classic example: `GET /api/v1/invoices/:id` returning any invoice regardless of org. Fix is always to scope every lookup by tenant — both at the service layer (primary guard) and the repo layer (defense-in-depth). #1 on OWASP API Top 10.

**Mass assignment:** Passing `req.body` (or `...input`) directly into a DB write so the client can set fields they shouldn't (`role`, `organizationId`, `isAdmin`). Fix is explicit field mapping.

**At-least-once delivery:** RabbitMQ (and most message queues) guarantee a message will be delivered ≥1 time but not exactly once. Every handler must be idempotent — and idempotency must be enforced at the DB level (unique constraint) not just by a code check, because the code check itself races.

---

*End of audit.*
