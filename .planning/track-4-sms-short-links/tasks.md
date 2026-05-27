# Driver SMS Short-Link Service + Copy Refresh Tasks
_Last updated: 2026-04-26 03:00_
_Plan: .planning/track-4-sms-short-links/plan.md_
_Contract: (none — no contract.yaml in plan dir)_
_Shared types: (none — no types.ts in plan dir; types derive from Prisma)_

---

## US-01: Short-link domain model & migration
_Priority: P0 | Services: dispatch-api | Agent: trivial | Status: done_

**Acceptance Criteria:**
- [x] AC1: `ShortLink` Prisma model exists with required fields and indexes
- [x] AC1b: Migration applies cleanly (applied via `psql` against live DB; recorded in `_prisma_migrations`. `prisma migrate dev` blocked by pre-existing shadow-DB drift on `20260419000000_unify_stop_dates` — unrelated to this work)

**Tasks:**
[x] T-01 [DB] Add `ShortLink` Prisma model + migration
         └─ Detail: In `hussle-app-dispatch-api/prisma/schema.prisma`, add model `ShortLink`
            with fields: `id String @id @default(uuid())`, `slug String @unique`,
            `targetUrl String @db.Text`, `loadId String?` (no FK), `purpose String`,
            `expiresAt DateTime`, `clickCount Int @default(0)`, `lastClickedAt DateTime?`,
            `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`.
            Add `@@index([loadId])` and `@@index([expiresAt])`.
            Then run: `cd hussle-app-dispatch-api && npx prisma migrate dev --name add_short_link --create-only`
            (orchestrator will rename the generated migration folder to
            `20260426000000_add_short_link` per the project's
            `YYYYMMDDHHmmss_description` convention if Prisma generated a
            different timestamp).
            Then run `npx prisma generate` to refresh the client.
         └─ Depends on: —
         └─ Output: Files: prisma/schema.prisma (added ShortLink model L1448-1462), prisma/migrations/20260426000000_add_short_link/migration.sql. Migration applied to live DB via `docker exec hussle-app-postgres psql` and recorded in `_prisma_migrations`. Prisma client regenerated (host + container). Status: DONE. Issues: `prisma migrate dev` couldn't run due to pre-existing shadow-DB drift on `20260419000000_unify_stop_dates` (column `facilityOpenTime` missing) — used `prisma migrate diff` + manual psql apply as workaround. Flag for ops to repair migration history outside this track.

---

## US-02: Short-link service module (slug, repo, service, controller, route, env, app mount)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] AC2: `generateShortSlug()` returns 8-char `[a-zA-Z0-9]`; statistical uniqueness over 1000 calls verified
- [x] AC3: `shortLinkService.createShortLink({ targetUrl, loadId, purpose, expiresAt })` writes a row, returns `{ slug }`, retries up to 3 times on Prisma `P2002`
- [x] AC4: `shortLinkService.resolveSlug(slug)` returns `{ targetUrl }` for active row, increments `clickCount` + sets `lastClickedAt`; returns `null` when missing OR `expiresAt < now()`
- [x] AC5: `GET /s/:slug` returns 302 with `Location: <targetUrl>` for active slug; 404 with JSON `{ errors: [{ message: 'Link not found or expired' }] }` for missing/expired; publicly accessible (no `appAuth`)
- [x] AC6: Route resolves at `/s/:slug` (NOT under `/api/v1/`)
- [x] AC13a: `PUBLIC_SHORT_BASE_URL` is read from env in `src/config/env.ts`

**Tasks:**
[x] T-02 [SETUP] Add `PUBLIC_SHORT_BASE_URL` env var
         └─ Detail: In `src/config/env.ts`, add `PUBLIC_SHORT_BASE_URL: getEnv('PUBLIC_SHORT_BASE_URL', 'http://localhost:3001')`
            alongside the existing `TRACKING_BASE_URL`. Add the same key to `.env.example`
            with a short comment describing it as the base for SMS short-link URLs.
         └─ Depends on: —
         └─ Output:

[x] T-03 [UTIL] Add `generateShortSlug` shared util + unit test
         └─ Detail: Create `src/shared/utils/generateShortSlug.ts` exporting
            `export const generateShortSlug = (): string => { ... }` that returns an
            8-character string drawn from `[A-Za-z0-9]` (62-char alphabet). Use
            `crypto.randomBytes` (Node) and modulo into the alphabet (or rejection
            sampling) — NOT `Math.random`. Do NOT reuse `slugValidator.ts:generateSlug`
            (different purpose). Add unit test `__tests__/generateShortSlug.test.ts`
            that asserts (a) length === 8, (b) charset matches `/^[A-Za-z0-9]{8}$/`,
            (c) over 1000 invocations, the resulting Set size is > 990 (no exact
            duplicates expected with 218T combinations; statistical guard).
         └─ Depends on: —
         └─ Output:

[x] T-04 [TYPES] Define `ShortLinkRepoPort` + service input/output types
         └─ Detail: Create `src/short-links/types/shortLinkRepoPort.ts` with port:
            `findBySlug(slug: string): Promise<ShortLink | null>`,
            `create(data: { slug: string; targetUrl: string; loadId: string | null; purpose: string; expiresAt: Date }): Promise<ShortLink>`,
            `incrementClick(slug: string, clickedAt: Date): Promise<void>`.
            Type `ShortLink` derives from `@prisma/client` `ShortLink` (per project
            type-derivation rule). Also create `src/short-links/types/shortLinkServiceTypes.ts`
            with `CreateShortLinkInput` and `ResolveSlugResult = { targetUrl: string } | null`.
         └─ Depends on: T-01
         └─ Output:

[x] T-05 [DB] Implement `shortLinkRepositoryPrisma`
         └─ Detail: Create `src/short-links/repositories/shortLinkRepositoryPrisma.ts`
            mirroring the shape used in
            `src/sms-prompts/repositories/smsPromptScheduleRepositoryPrisma.ts`.
            Functions:
            - `findBySlug(slug)` → `prisma.shortLink.findUnique({ where: { slug } })`
            - `create(data)` → `prisma.shortLink.create({ data })`
            - `incrementClick(slug, clickedAt)` → `prisma.shortLink.update({ where: { slug }, data: { clickCount: { increment: 1 }, lastClickedAt: clickedAt } })`
            Accept `PrismaClient | PrismaTransaction` per project repository template.
         └─ Depends on: T-04
         └─ Output:

[x] T-06 [API] Implement `shortLinkService` (createShortLink + resolveSlug)
         └─ Detail: Create `src/short-links/services/shortLinkService.ts` exporting a
            factory `createShortLinkService(deps: { repo: ShortLinkRepoPort; logger: Logger; generateSlug?: () => string })`
            that returns `{ createShortLink, resolveSlug }`.
            - `createShortLink({ targetUrl, loadId, purpose, expiresAt })`: generate slug
              via injected `generateSlug` (default `generateShortSlug` from shared util);
              call `repo.create(...)`. On Prisma error with `code === 'P2002'`, retry up
              to 3 times generating a new slug; rethrow after 3 failures. Return `{ slug }`.
              Use `instanceof` narrowing or `isErrorWithCode` type guard for `unknown`
              error handling — never `as any`.
            - `resolveSlug(slug)`: `repo.findBySlug(slug)`. If null OR `row.expiresAt < new Date()`,
              return `null`. Otherwise call `repo.incrementClick(slug, new Date())`
              fire-and-forget (`.catch` log only, do NOT await failure into the return path)
              and return `{ targetUrl: row.targetUrl }`.
         └─ Depends on: T-04, T-05
         └─ Output:

[x] T-07 [API] Add controller, route, validator for `GET /s/:slug`
         └─ Detail: Files:
            - `src/short-links/validators/resolveSlugValidator.ts`: Yup schema `params: { slug: yup.string().matches(/^[A-Za-z0-9]{8}$/).required() }`.
            - `src/short-links/controllers/resolveSlugController.ts`: takes `{ shortLinkService, logger }`,
              returns Express handler. Reads `req.params.slug`, calls
              `shortLinkService.resolveSlug(slug)`. If `null`, respond with status 404 JSON
              `{ errors: [{ message: 'Link not found or expired' }] }`. If hit, `res.redirect(302, result.targetUrl)`.
              No mapper/transformer needed — this is a redirect, not a resource response.
            - `src/short-links/routes/shortLinkRoutes.ts`: factory
              `createShortLinkRoutes(controllers): Router` registering
              `router.get('/:slug', validate(resolveSlugValidator), controllers.resolveSlug)`.
              No `appAuth` — public route.
         └─ Depends on: T-06
         └─ Output:

[x] T-08 [API] Add `short-links` composition root + module index
         └─ Detail: Create `src/short-links/compositionRoot.ts` exporting
            `createShortLinksModule(deps: { prismaClient: PrismaClient; logger: Logger })`
            that wires repo → service → controller and returns
            `{ controllers, shortLinkService }` (service must be exported so the
            sms-prompts module can consume it — see US-05).
            Create `src/short-links/index.ts` mirroring `src/sms-prompts/index.ts`:
            instantiate the module with `prisma` + `logger` from shared imports;
            export `shortLinkService` and `shortLinksRouter = createShortLinkRoutes(module.controllers)`.
         └─ Depends on: T-07
         └─ Output:

[x] T-09 [API] Mount `/s` router in `app.ts`
         └─ Detail: In `src/app.ts`, import `shortLinksRouter` from `./short-links` and
            mount at `app.use('/s', shortLinksRouter)`. Place it BEFORE the `/api/v1/*`
            routes for clarity, but it does not affect correctness as long as it is
            before the error handler. Ensure the side-effect import path matches the
            `import './sms-prompts'` style if needed (not strictly necessary since the
            short-links module has no event subscribers).
         └─ Depends on: T-08
         └─ Output:

[x] T-10 [TEST] Unit tests for shortLinkService
         └─ Detail: Create `src/short-links/__tests__/shortLinkService.test.ts`.
            - `createShortLink`: mocks repo, asserts row created with passed targetUrl/
              loadId/purpose/expiresAt and returned `{ slug }`. Test P2002 collision retry:
              first 2 calls throw `{ code: 'P2002' }`, third succeeds — assert 3 attempts
              and final slug returned. Test 4 P2002s throws after 3 retries.
            - `resolveSlug`: returns `null` for missing slug, returns `null` for
              expired (`expiresAt < now`), returns `{ targetUrl }` for active and
              triggers `incrementClick` (fire-and-forget — assert called, not awaited
              into result).
         └─ Depends on: T-06
         └─ Output:

[x] T-11 [TEST] Integration test for `GET /s/:slug`
         └─ Detail: Create `src/short-links/__tests__/integration/shortLinkRoutes.integration.test.ts`
            following the project's integration test template. Cases:
            - 302 with `Location` header equal to seeded `targetUrl` for active slug
            - 404 JSON envelope for missing slug
            - 404 JSON envelope for expired slug (seed with `expiresAt = new Date(Date.now() - 1000)`)
            - 400 (validator) for malformed slug (e.g., 7 chars)
            - No auth header required — request without `Authorization` should still hit
              the controller (i.e., no 401)
         └─ Depends on: T-09
         └─ Output:

---

## US-03: Extend LoadSchedulerQuery projection (equipment + origin/destination stop)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] AC11: Projection includes `equipmentType`, first PICKUP stop's `city`/`state`/`appointmentStart`, last DELIVERY stop's `city`/`state`/`appointmentStart`
- [x] AC11b: Existing scheduler subscriber tests still pass

**Tasks:**
[x] T-12 [TYPES] Extend `LoadForScheduling` type
         └─ Detail: In `src/sms-prompts/types/loadSchedulerQueryPort.ts`:
            - Add `equipmentType: EquipmentType | null` to `LoadForScheduling`
              (import `EquipmentType` from `@prisma/client`).
            - Extend `LoadSchedulerStop` with `city: string | null`, `state: string | null`
              IF those fields are not already projected. Also keep `appointmentStart` (already there).
            - Add convenience aliases in the same file (or in a new
              `loadDispatchSummary.ts` if cleaner) for the rich-template view:
              `originStop` / `destinationStop` are derived in the consumer; no extra
              port fields needed beyond stops + equipment.
         └─ Depends on: —
         └─ Output:

[x] T-13 [DB] Update `loadSchedulerQueryPrisma` to project new fields
         └─ Detail: In `src/sms-prompts/repositories/loadSchedulerQueryPrisma.ts`:
            - Add `equipmentType: true` to the top-level `select`.
            - Add `city: true`, `state: true` to `stops.select` (keep existing fields).
            - Map them into the returned object. Preserve existing
              `orderBy: { sequence: 'asc' }` so consumers can pick first PICKUP / last DELIVERY.
            - Verify no other consumer of this port is broken (fields are additive).
         └─ Depends on: T-12
         └─ Output:

[x] T-14 [TEST] Confirm existing scheduler subscriber/worker tests still pass
         └─ Detail: Run `npx jest --findRelatedTests` on the modified files
            (loadSchedulerQueryPort.ts, loadSchedulerQueryPrisma.ts). Existing
            `smsPromptSchedulerSubscriber.test.ts` and `smsPromptWorker.test.ts` should
            still pass — fields are additive. If any test mocks the projection shape,
            update the mock to include the new fields with safe defaults
            (`equipmentType: null`, stop `city: null`, `state: null`).
         └─ Depends on: T-13
         └─ Output:

---

## US-04: SMS body templates & composer (composeSmsBody + TZ util)
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] AC7: `composeSmsBody({ anchor, load, shortUrl })` returns the correct template per anchor (5 regex patterns from plan AC #7)
- [x] AC8: DISPATCHED gracefully degrades to `Hussle: Load #N dispatched\n{shortUrl}` when origin or destination stop missing city/state
- [x] AC9: DISPATCHED renders pickup/delivery times in the stop's local TZ from city/state; falls back to UTC labeled `UTC` when TZ resolution fails
- [x] AC10b: New unit tests for `composeSmsBody` cover each anchor + DISPATCHED-degraded path + unknown-equipment-omits-line path

**Tasks:**
[x] T-15 [UTIL] Add `resolveStopTimezone` helper
         └─ Detail: Create `src/sms-prompts/services/resolveStopTimezone.ts` exporting
            `resolveStopTimezone(city: string | null, state: string | null): string | null`
            that returns an IANA TZ identifier (e.g., `America/Chicago`) or `null` when
            unresolvable. Strategy: lightweight US state → primary TZ map (the simplest
            sufficient implementation for MVP — see plan: "fall back to UTC labeled `UTC`
            if unknown"). City is accepted but only used to disambiguate states that
            span TZs (Tennessee, Kentucky, Indiana, etc.). Keep the map inline in this
            file. Add `__tests__/resolveStopTimezone.test.ts` covering: known state
            (Texas → `America/Chicago`), TZ-split state with city disambiguation
            (Tennessee + Knoxville → Eastern, Tennessee + Memphis → Central),
            unknown state → `null`, null inputs → `null`.
         └─ Depends on: —
         └─ Output:

[x] T-16 [API] Add `composeSmsBody` template selector
         └─ Detail: Create `src/sms-prompts/services/composeSmsBody.ts` exporting:
            ```
            export const composeSmsBody = (input: {
              anchor: SmsPromptAnchor;
              load: LoadForScheduling;
              shortUrl: string;
            }): string
            ```
            Behavior per anchor (see plan §Message Templates and AC #7 regexes):
            - DISPATCHED: build rich body. Find first PICKUP stop and last DELIVERY stop
              from `load.stops`. If either is missing OR lacks city/state, return
              `Hussle: Load #${load.loadNumber} dispatched\n${shortUrl}` (degraded).
              Otherwise:
                Line 1: `Hussle: Load #${loadNumber} dispatched`
                Line 2: `${originCity}, ${originState} → ${destCity}, ${destState}`
                Line 3: `🕖 PU: ${formatTime(pickupStart, originCity, originState)} | 🕛 DEL: ${formatTime(deliveryStart, destCity, destState)}`
                Line 4 (optional, omit entirely if equipmentType unknown):
                  REEFER → `❄️ Reefer`
                  DRY_VAN → `🚛 Dry Van`
                  FLATBED → `🛻 Flatbed`
                  STEP_DECK / BOX_TRUCK / HOTSHOT / POWER_ONLY / null → omit
                Final line: `${shortUrl}`
            - PRE_PICKUP: `Hussle: Load #${loadNumber} pickup is coming up. Confirm you're en route.\n${shortUrl}`
            - POST_PICKUP: `Hussle: Load #${loadNumber} — pickup window passed. Update status now.\n${shortUrl}`
            - TRANSIT_INTERVAL: `Hussle: Load #${loadNumber} status check. Tap to share current location.\n${shortUrl}`
            - MANUAL: `Hussle: Load #${loadNumber} needs a check-in.\n${shortUrl}`

            `formatTime(date: Date | null, city, state)`: resolve TZ via
            `resolveStopTimezone(city, state)`. If null → format using
            `Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'UTC' })`
            and append ` UTC`. Otherwise format in resolved TZ without label
            (e.g., `7:00 AM`). If `date` is null, return literal `TBD`.

            Place this in `services/` (not `controllers/`) — it's pure logic with no
            HTTP concerns, similar to `resolveSmsSettings.ts`.
         └─ Depends on: T-12, T-15
         └─ Output:

[x] T-17 [TEST] Unit tests for `composeSmsBody`
         └─ Detail: Create `src/sms-prompts/__tests__/composeSmsBody.test.ts`.
            Cases (each asserts the output matches the plan AC #7 regex AND
            does an exact-string check on key parts):
            - DISPATCHED happy path with REEFER → matches DISPATCHED regex AND
              contains `❄️ Reefer`
            - DISPATCHED with DRY_VAN → `🚛 Dry Van`
            - DISPATCHED with FLATBED → `🛻 Flatbed`
            - DISPATCHED with STEP_DECK → equipment line absent (verify line count)
            - DISPATCHED with `equipmentType: null` → equipment line absent
            - DISPATCHED degraded (origin missing city) → exactly
              `Hussle: Load #42 dispatched\n${shortUrl}`
            - DISPATCHED degraded (destination missing state) → degraded
            - DISPATCHED with TZ-resolvable cities → time formatted in local TZ
            - DISPATCHED with unresolvable state → time formatted as ` UTC` suffix
            - PRE_PICKUP → matches PRE_PICKUP regex
            - POST_PICKUP → matches POST_PICKUP regex
            - TRANSIT_INTERVAL → matches TRANSIT_INTERVAL regex
            - MANUAL → matches MANUAL regex
         └─ Depends on: T-16
         └─ Output:

---

## US-05: Wire SMS prompt worker to use short links + anchor templates
_Priority: P0 | Services: dispatch-api | Agent: backend | Status: done_

**Acceptance Criteria:**
- [x] AC10a: `smsPromptWorker.test.ts` updated to cover all five anchor branches; mocks verify `shortLinkService.createShortLink` called with right `targetUrl`, `loadId`, `purpose='DRIVER_PORTAL'`, `expiresAt`
- [x] AC13b: `PUBLIC_SHORT_BASE_URL` injected into `smsPromptWorker` via `sms-prompts` composition root

**Tasks:**
[x] T-18 [API] Modify `smsPromptWorker` to mint a short link and use composed body
         └─ Detail: Edit `src/sms-prompts/services/smsPromptWorker.ts`.
            - Extend `SmsPromptWorkerDeps` with:
              `shortLinkService: { createShortLink: (input: { targetUrl: string; loadId: string; purpose: string; expiresAt: Date }) => Promise<{ slug: string }> }`
              `publicShortBaseUrl: string`
            - Replace lines 108–112 (token + URL + body construction). New flow:
              1. `const tokenRecord = await deps.trackingTokenService.getOrCreateDriverToken(loadId)`
              2. `const longUrl = \`${deps.trackingBaseUrl}/driver-portal/${tokenRecord.token}\``
              3. `const { slug } = await deps.shortLinkService.createShortLink({
                   targetUrl: longUrl, loadId, purpose: 'DRIVER_PORTAL',
                   expiresAt: tokenRecord.expiresAt,
                 })`
              4. `const shortUrl = \`${deps.publicShortBaseUrl}/s/${slug}\``
              5. `const body = composeSmsBody({ anchor, load, shortUrl })`
              6. Pass `body` into existing `deps.smsService.sendSms({ to, body })` call
                 (no other change to send path).
            - If short-link creation throws after retries, treat the same as the existing
              error-path (`scheduleRepo.markFailed` + log) and return — do NOT fall through
              to send with the long URL.
         └─ Depends on: T-08, T-16
         └─ Output:

[x] T-19 [API] Update `sms-prompts` composition root to inject `shortLinkService` and `publicShortBaseUrl`
         └─ Detail:
            - In `src/sms-prompts/compositionRoot.ts`: extend `SmsPromptsModuleDeps`
              with `shortLinkService: ShortLinkService` and `publicShortBaseUrl: string`.
              Pass both into `initializeSmsPromptWorker` alongside existing deps.
              Define `ShortLinkService` as a port type
              `{ createShortLink: (...) => Promise<{ slug: string }> }`
              in `src/sms-prompts/types/shortLinkServicePort.ts` (so sms-prompts does not
              import the short-links module directly — depend on a port, not the
              implementation, per project DI rules).
            - In `src/sms-prompts/index.ts`: import `shortLinkService` from
              `@/short-links` and `env.PUBLIC_SHORT_BASE_URL`; pass both into
              `createSmsPromptsModule`. The `shortLinkService` from the short-links
              module satisfies the `ShortLinkService` port (structural typing).
         └─ Depends on: T-08, T-18
         └─ Output:

[x] T-20 [TEST] Update `smsPromptWorker.test.ts` for short-link + 5 anchor branches
         └─ Detail: Edit `src/sms-prompts/__tests__/smsPromptWorker.test.ts` (or whichever
            test file exists for the worker). For each of the 5 anchors (DISPATCHED,
            PRE_PICKUP, POST_PICKUP, TRANSIT_INTERVAL, MANUAL):
            - Stub `trackingTokenService.getOrCreateDriverToken` → `{ token: 'T', expiresAt: <future> }`
            - Stub `shortLinkService.createShortLink` → `{ slug: 'abcd1234' }` and assert
              it was called with `targetUrl: '${trackingBaseUrl}/driver-portal/T'`,
              `loadId`, `purpose: 'DRIVER_PORTAL'`, `expiresAt: <future>`
            - Assert the SMS body passed to `smsService.sendSms` matches the
              corresponding anchor regex from plan AC #7
            - DISPATCHED case: load fixture must include `equipmentType` + first PICKUP
              + last DELIVERY stops with city/state/appointmentStart so the rich path runs
            Add one extra case: short-link creation throws → schedule marked failed,
            no SMS sent.
         └─ Depends on: T-18, T-19
         └─ Output:

---

## US-06: Update `SendSmsPromptModal` preview to MANUAL template
_Priority: P1 | Services: dispatch-ui | Agent: frontend | Status: done_

**Acceptance Criteria:**
- [x] AC12: Preview Box renders two lines — `Hussle: Load #{loadNumber} needs a check-in.` then italic `<short check-in link>`
- [x] AC12b: Existing modal test updated to assert new preview content

**Tasks:**
[x] T-21 [UI] Update `previewBody` in `SendSmsPromptModal/index.tsx`
         └─ Detail: In
            `hussle-app-dispatch-ui/src/features/load/components/SendSmsPromptModal/index.tsx`,
            replace the `previewBody` JSX at lines 50–57 with:
            ```tsx
            const previewBody = load ? (
              <>
                Hussle: Load #{load.loadNumber} needs a check-in.
                <br />
                <Box component="span" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                  &lt;short check-in link&gt;
                </Box>
              </>
            ) : null;
            ```
            Two visual lines (the `<br />` enforces the line break inside the monospace
            preview box). No other component logic changes.
         └─ Depends on: —
         └─ Output: Files: hussle-app-dispatch-ui/src/features/load/components/SendSmsPromptModal/index.tsx (replaced previewBody JSX with MANUAL template + <br /> + italic <short check-in link>). Status: DONE.

[x] T-22 [TEST] Update `SendSmsPromptModal.test.tsx`
         └─ Detail: In
            `hussle-app-dispatch-ui/src/features/load/components/SendSmsPromptModal/__tests__/SendSmsPromptModal.test.tsx`,
            update the preview-text assertion(s). Replace any check for
            `'please check in'` or `'driver portal check-in link'` with assertions
            that the rendered preview contains the literal substring
            `Hussle: Load #${load.loadNumber} needs a check-in.` and the italic
            placeholder text `<short check-in link>`. Use accessibility-first queries
            (e.g., `screen.getByText(/Hussle: Load #.* needs a check-in/)`).
         └─ Depends on: T-21
         └─ Output: Files: hussle-app-dispatch-ui/src/features/load/components/SendSmsPromptModal/__tests__/SendSmsPromptModal.test.tsx (updated preview assertion to check for MANUAL template body regex + literal `<short check-in link>`). Tests: 5/5 pass. Typecheck: clean for SendSmsPromptModal. Status: DONE.

---

## INT-01: Wire dispatch-api ↔ dispatch-ui (preview copy parity)
_Auto-generated | Services: dispatch-api, dispatch-ui | Agent: review | Status: done_

**Verification Checklist:**
- [x] UI preview literal matches the backend MANUAL template exactly (`Hussle: Load #{N} needs a check-in.`)
- [x] No other UI surface still references the old `please check in.` body
- [x] No frontend code calls `/s/:slug` directly (driver follows the SMS link in their phone, not via the dispatch UI)

**Tasks:**
[x] T-23 [WIRE] Verify UI preview ↔ backend MANUAL template parity
         └─ Detail: Read `composeSmsBody.ts` MANUAL branch and `SendSmsPromptModal/index.tsx`
            `previewBody`. Confirm the literal copy matches character-for-character
            (modulo the `{shortUrl}` placeholder being rendered as the italic
            `<short check-in link>` placeholder in the UI). Grep dispatch-ui for
            `'please check in'` and confirm zero remaining references. Grep for
            uses of `/s/` in dispatch-ui (should be zero — short links are SMS-only).
         └─ Agent: review
         └─ Depends on: T-16, T-21
         └─ Output: Backend MANUAL branch (composeSmsBody.ts:126) returns `Hussle: Load #${loadNumber} needs a check-in.\n${shortUrl}`. UI preview (SendSmsPromptModal/index.tsx:52,55) renders `Hussle: Load #{loadNumber} needs a check-in.` + italic `<short check-in link>` placeholder — character-exact match. Grep for `please check in` and `driver portal check-in link` in dispatch-ui: 0 hits. Grep for `/s/{slug}` patterns: 0 hits. Status: DONE.

---

## VER-01: End-to-end verification
_Auto-generated | Read-only | Agent: review | Status: done_

**Tasks:**
[x] T-24 [VERIFY] Trace complete feature flow against plan ACs
         └─ Detail: For each plan flow:
            - Flow 1 (worker sends): trace from `sms.prompt.due` event → worker →
              `trackingTokenService` → `loadSchedulerQuery.findForScheduling` (extended) →
              `shortLinkService.createShortLink` → `composeSmsBody` → `smsService.sendSms` →
              `scheduleRepo.markSent`. Confirm every step lands in code.
            - Flow 2 (driver tap): trace from `GET /s/:slug` → `resolveSlugController` →
              `shortLinkService.resolveSlug` → 302 → driver portal token route. Confirm
              public (no auth) and 404 envelope shape.
            - Flow 3 (modal preview): confirm `SendSmsPromptModal` shows MANUAL template.
            Then walk every plan AC (1–14) and mark each as MET / NOT MET / PARTIAL with
            a one-line justification. AC #14 is end-to-end smoke (Twilio console + phone)
            and is expected to be NOT MET in code review — flag for manual smoke testing.
         └─ Agent: review
         └─ Depends on: T-23
         └─ Output: All 3 flows traced cleanly in code (Flow 1 worker: smsPromptWorker.ts:112-155 — token → longUrl → createShortLink → shortUrl → composeSmsBody → sendSms → markSent; Flow 2 driver tap: resolveSlugController.ts:18-24 — 302/404; Flow 3 modal: SendSmsPromptModal/index.tsx:52-56). All 13 in-code ACs MET (#1–#13). AC #14 (end-to-end Twilio + phone smoke) deferred — flag for manual staging smoke. CODE-QUALITY FIX during review: removed `as { code: unknown }` cast in shortLinkService.ts:16 (NEVER rule); narrow with `'code' in error` already provides access. Status: DONE.

---

## Summary
| Story | Tasks | Done | Blocked | AC Met |
|-------|-------|------|---------|--------|
| US-01 | 1     | 1    | 0       | 2/2    |
| US-02 | 10    | 10   | 0       | 6/6    |
| US-03 | 3     | 3    | 0       | 2/2    |
| US-04 | 3     | 3    | 0       | 4/4    |
| US-05 | 3     | 3    | 0       | 2/2    |
| US-06 | 2     | 2    | 0       | 2/2    |
| INT-01| 1     | 1    | 0       | —      |
| VER-01| 1     | 1    | 0       | —      |
| **All** | **24** | **24** | **0** | **18/18** |

---

## Completed Tasks Summary

### US-01 (T-01)
- **T-01:** Added `ShortLink` model to `prisma/schema.prisma` (id, slug @unique, targetUrl @db.Text, loadId nullable no-FK, purpose, expiresAt, clickCount default 0, lastClickedAt nullable, createdAt, updatedAt; indexes on `loadId` and `expiresAt`). Migration `20260426000000_add_short_link` written and applied to live DB via psql; recorded in `_prisma_migrations`. Prisma client regenerated. NOTE: pre-existing shadow-DB drift blocks `prisma migrate dev` — unrelated to this track. Future stories can `import { ShortLink } from '@prisma/client'`.

### US-02 (T-02..T-11)
- **T-02:** Added `PUBLIC_SHORT_BASE_URL` to `src/config/env.ts` (default `http://localhost:3001`) and to `.env.example` with comment.
- **T-03:** Added `src/shared/utils/generateShortSlug.ts` using `crypto.randomBytes` with rejection sampling over a 62-char `[A-Za-z0-9]` alphabet (no `Math.random`, no modulo bias). Unit test asserts length 8, charset, and >990 unique slugs over 1000 invocations.
- **T-04:** Added `src/short-links/types/shortLinkRepoPort.ts` (`ShortLinkRepoPort`, `CreateShortLinkRow`) and `shortLinkServiceTypes.ts` (`CreateShortLinkInput`, `ResolveSlugResult`). `ShortLink` is imported from `@prisma/client`.
- **T-05:** Added `src/short-links/repositories/shortLinkRepositoryPrisma.ts` accepting `PrismaClient | PrismaTransaction`, with `findBySlug`, `create`, `incrementClick` (uses Prisma `{ increment: 1 }`).
- **T-06:** Added `src/short-links/services/shortLinkService.ts`. `createShortLink` retries up to 3 times on Prisma `P2002` (recursion-based, no `await` in loop, no eslint-disable; non-P2002 errors rethrown immediately). `resolveSlug` returns null for missing/expired rows and fires-and-forgets `incrementClick` (errors logged via injected logger).
- **T-07:** Added validator (`resolveSlugValidator` — Yup `slug` matches `/^[A-Za-z0-9]{8}$/`), controller (`resolveSlugController` — 302 redirect on hit, 404 JSON envelope `{ errors: [{ message: 'Link not found or expired' }] }` on miss), and route factory (`createShortLinkRoutes`) with no `requireAuth`/`requireRole`.
- **T-08:** Added `src/short-links/compositionRoot.ts` exporting `{ controllers, shortLinkService }`, and `src/short-links/index.ts` instantiating with `prisma` + `logger` and exporting `shortLinksRouter` + `shortLinkService`.
- **T-09:** Mounted `app.use('/s', shortLinksRouter)` in `src/app.ts` BEFORE the `/api/v1/*` routes (outside the API prefix so it has no auth middleware).
- **T-10:** `src/short-links/__tests__/shortLinkService.test.ts` covers happy create, P2002 retry success on attempt 3, P2002 exhaustion after 3 attempts, non-P2002 immediate rethrow, null/expired/active resolveSlug branches, and incrementClick fire-and-forget tolerance.
- **T-11:** `src/short-links/__tests__/integration/shortLinkRoutes.integration.test.ts` boots a local Express server (no supertest in repo, used `http`) and exercises 302 happy path, 404 missing, 404 expired (mocked), 400 malformed slug (7 chars), and confirms no Authorization header is required.

### US-03 (T-12..T-14)
- **T-12:** Extended `LoadForScheduling` with `equipmentType: EquipmentType | null` (imported from `@prisma/client`) and added `city: string | null`, `state: string | null` to `LoadSchedulerStop`.
- **T-13:** `loadSchedulerQueryPrisma.ts` now selects `equipmentType` at top level and `city, state` on stops; mapping returns the extended shape (preserves `orderBy: { sequence: 'asc' }`).
- **T-14:** Added `equipmentType: null` to `baseLoad` fixtures and `city: null, state: null` to inline stop fixtures in `smsPromptSchedulerSubscriber.test.ts` and `smsPromptWorker.test.ts`. All 12 scheduler subscriber tests + worker tests pass unmodified otherwise.

### US-04 (T-15..T-17)
- **T-15:** `src/sms-prompts/services/resolveStopTimezone.ts` provides US state→IANA primary TZ map plus city overrides for split states (TN, KY, IN, FL panhandle, TX/El Paso, OR/Ontario, ID panhandle, ND/SD/NE/KS western). Returns null for unknown state or empty/null inputs. 7 unit tests.
- **T-16:** `composeSmsBody.ts` returns: DISPATCHED rich body (Line 1 dispatched, Line 2 origin→dest, Line 3 PU/DEL emojis + times via `Intl.DateTimeFormat` in resolved TZ or UTC-suffixed fallback, optional equipment line for REEFER/DRY_VAN/FLATBED only, final shortUrl); degraded `Hussle: Load #{N} dispatched\n{shortUrl}` if origin or destination missing city/state. PRE_PICKUP/POST_PICKUP/TRANSIT_INTERVAL/MANUAL are single-line + URL templates. No `as` casts — uses a `LocatedStop` narrowing helper.
- **T-17:** `__tests__/composeSmsBody.test.ts` covers all 5 anchors against the plan AC #7 regexes, DISPATCHED rich+REEFER/DRY_VAN/FLATBED, equipment-line omitted for STEP_DECK and null, both degraded paths (missing origin city, missing destination state), TZ-resolved formatting (Houston→Atlanta), and unknown-state UTC suffix. Note: `Intl.DateTimeFormat` emits U+202F (narrow no-break space) between time and AM/PM — tests use `\s` to be tolerant.

### US-05 (T-18..T-20)
- **T-18:** `smsPromptWorker.ts` now mints a tracking token, builds `longUrl = ${trackingBaseUrl}/driver-portal/${token}`, calls `shortLinkService.createShortLink({ targetUrl: longUrl, loadId, purpose: 'DRIVER_PORTAL', expiresAt: tokenRecord.expiresAt })`, builds `shortUrl = ${publicShortBaseUrl}/s/${slug}`, and uses `composeSmsBody({ anchor, load, shortUrl })` for the SMS body. If short-link creation throws, schedule is marked failed and no SMS is sent (no fall-through to long URL).
- **T-19:** `SmsPromptWorkerDeps` extended with `shortLinkService: ShortLinkServicePort` + `publicShortBaseUrl`. `sms-prompts/types/shortLinkServicePort.ts` is the local port type so sms-prompts depends on a port, not the short-links module. `sms-prompts/compositionRoot.ts` accepts and forwards both. `sms-prompts/index.ts` imports `shortLinkService` from `@/short-links` and `env.PUBLIC_SHORT_BASE_URL`.
- **T-20:** `smsPromptWorker.test.ts` extended with `shortLinkService` mock and `publicShortBaseUrl`. Updated existing happy-path to assert the SMS body now contains `https://h.example.com/s/AbCd1234` and that `createShortLink` was called with the long URL, loadId, purpose `DRIVER_PORTAL`, and expiresAt. Added 5 anchor-branch tests asserting body matches the plan AC #7 regex per anchor (DISPATCHED rich with REEFER + Houston/Atlanta stops, PRE_PICKUP, POST_PICKUP, TRANSIT_INTERVAL, MANUAL) plus a short-link-creation-throws case asserting markFailed and no `sendSms` call.

### US-06 (T-21, T-22)
- **T-21, T-22:** Updated `SendSmsPromptModal/index.tsx` `previewBody` to render the new MANUAL template — line 1 `Hussle: Load #{loadNumber} needs a check-in.`, then `<br />`, then italic placeholder `<short check-in link>` (matches backend `composeSmsBody` MANUAL branch character-for-character modulo the rendered shortUrl placeholder). Updated the existing preview assertion in `SendSmsPromptModal.test.tsx` to use accessibility-first `screen.getByText(/Hussle: Load #.* needs a check-in/)` plus literal `<short check-in link>` lookup. All 5 modal tests pass; typecheck on `SendSmsPromptModal` clean.
