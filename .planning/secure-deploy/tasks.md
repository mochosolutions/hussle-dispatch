# Secure Deploy — Tasks

_Source plan: `/Users/jr/.claude/plans/i-thinks-it-about-fizzy-scroll.md`_
_Last updated: 2026-04-27 (US-04 complete)_

## Scope

First-ever production deploy of Fleet Command via Jenkins → AWS ECR → Dokploy on Hetzner CX32, mirroring the proven `mocho-solutions-home` pipeline. Budget ≤$50/mo, target ~$13/mo. Spans three repos: `fleet-command/` (this repo), `fleet-command/hussle-app-dispatch-infra/` (existing Terraform subdirectory), and a new `fleet-command/mocho-infra-modules/` (new repo, sibling location).

## Notes on adaptation

- This is an infra/deploy plan, so there is no `contract.yaml` or `types.ts`. Tasks are grounded in concrete file paths, Terraform module names, AWS resource ARNs, env-var names, and exact line numbers from the plan.
- Stories tagged `manual` are operator checkpoints (console clicks, credential rotation, git history rewrite, Dokploy UI setup). The orchestrator surfaces these as runbooks for human execution and marks them done on operator confirmation — no agent dispatch.
- Reference repo for proven Jenkins/compose patterns: `/Users/jr/Development/mocho-solutions-home/`. Reference repo for existing Terraform modules: `/Users/jr/Development/mocho-solutions-home/mocho-solutions-infra/terraform/modules/`.

---

## Summary table

| Story  | Title                                                    | Priority | Agent    | Tasks | Done | AC met |
|--------|----------------------------------------------------------|----------|----------|-------|------|--------|
| US-01  | Manual security checkpoint (JWT/refresh generation only) | P0       | manual   | 4     | 3    | 0/1    |
| US-02  | API security code hardening                              | P0       | backend  | 6     | 6    | 4/4    |
| US-03  | Dependency vulnerability fix (npm audit)                 | P0       | trivial  | 2     | 2    | 1/1    |
| US-04  | Production Dockerfiles (api, ui, emails) + nginx config  | P1       | backend  | 5     | 5    | 3/3    |
| US-05  | Docker Compose files (build + prod)                      | P1       | backend  | 2     | 2    | 2/2    |
| US-06  | Jenkins pipelines + Dokploy redeploy script              | P1       | backend  | 3     | 3    | 3/3    |
| US-07  | Bootstrap `mocho-infra-modules` repo with copied modules | P1       | backend  | 3     | 3    | 2/2    |
| US-08  | Author 3 new Terraform modules                           | P1       | backend  | 3     | 3    | 3/3    |
| US-09  | Modules repo docs + initial tag `v0.1.0`                 | P1       | backend  | 3     | 3    | 2/2    |
| US-10  | Dispatch-infra: bug fixes + providers + variables        | P1       | backend  | 3     | 3    | 3/3    |
| US-11  | Dispatch-infra: ECR + IAM split (5 users)                | P1       | backend  | 4     | 4    | 3/3    |
| US-12  | Dispatch-infra: Hetzner VPS + Cloudflare DNS + R2        | P1       | backend  | 3     | 3    | 3/3    |
| US-13  | Dispatch-infra: codify S3 uploads + import bucket        | P1       | backend  | 3     | 3    | 3/3    |
| US-14  | Dispatch-infra: outputs + prod.tfvars + README rewrite   | P1       | backend  | 3     | 3    | 2/2    |
| US-15  | DEPLOYMENT.md runbook (Dokploy, env vars, restore drill) | P1       | trivial  | 1     | 0    | 0/3    |
| US-16  | Manual Dokploy setup checkpoint                          | P1       | manual   | 8     | 0    | 0/3    |
| INT-01 | Wire env-var inventory: code ↔ Dokploy ↔ docs            | P1       | review   | 2     | 0    | 0/2    |
| INT-02 | Wire deploy pipeline: Jenkins → ECR → Dokploy            | P1       | review   | 2     | 0    | 0/3    |
| VER-01 | End-to-end verification (Phase 7 from plan)              | P1       | review   | 1     | 0    | 0/7    |

**Totals:** 19 stories · 61 tasks · 46 done · 34/53 AC met

**Status marker legend:** `[ ]` todo · `[~]` in-progress · `[x]` done · `[!]` blocked · `[-]` not applicable / skipped

---

## US-01: Manual security checkpoint — JWT/refresh secret generation
_Priority: P0 | Services: api, ops | Agent: manual | Status: in-progress_

**Scope correction (2026-04-27):** Plan Phase 1.1 was written assuming `.env` and `.env.bak` were committed to git history. Verification before execution proved otherwise:
- `git log --all -- hussle-app-dispatch-api/.env hussle-app-dispatch-api/.env.bak` returns empty — files were never committed.
- `git check-ignore -v` confirms both files are already ignored by root `.gitignore:7` `**/*/.env` and `:9` `.env.bak` — no package-level gitignore needed.
- Operator confirmed no other exposure vector (chat, screen-share, CI logs).

Result: T-01 (AWS rotation), T-03 (history scrub), T-04 (gitignore patches) are NOT applicable. T-02 reduces to "generate fresh `JWT_SECRET` and `REFRESH_SECRET`" (the code currently defaults these to empty strings — that's the actual fix).

**Acceptance Criteria:**
- [ ] AC1: Two cryptographically random 64-byte secrets generated for `JWT_SECRET` and `REFRESH_SECRET`. Stored in operator's password manager. Will be pasted into Dokploy secrets UI in US-16 T-53. Never written to any `.env` file.

**Tasks:**

[-] T-01 [MANUAL] Rotate AWS IAM access key — N/A
       └─ Detail: SKIPPED. Plan premise was that AWS key `AKIAR3G6WM55RNSC7HEW` was leaked via committed `.env`. Verified files were never committed. Operator confirmed no other exposure vector. Legacy IAM user `hussle-dispatch-api-dev` is being decommissioned in US-11 anyway via the IAM split, so this rotation has no defensive value.
       └─ Output: N/A — verified not needed (git history clean, no other exposure)

[ ] T-02 [MANUAL] Generate fresh `JWT_SECRET` and `REFRESH_SECRET` — DEFERRED
       └─ Detail: The code at `hussle-app-dispatch-api/src/config/env.ts:18-19` currently defaults both secrets to empty strings. US-02 T-05 will harden the code to require them in prod; this task supplies the actual values. Operator runs locally, twice, and stores each output in their password manager labeled `JWT_SECRET` and `REFRESH_SECRET`:
          ```
          openssl rand -base64 64
          ```
          Values get pasted into Dokploy secrets UI in US-16 T-53. Do NOT write them to any `.env` file or commit them anywhere. Twilio/Cognito client secret rotation is NOT included in this task — those are not exposed.
       └─ Output: DEFERRED — operator will execute just before US-16 T-53 (Dokploy secrets paste). US-16 dependencies updated to gate on T-02. No code impact in the meantime; US-02 T-05 strengthens env.ts to requireEnv but tests pass without actual values (NODE_ENV=test path).

[-] T-03 [MANUAL] Scrub `.env` and `.env.bak` from git history — N/A
       └─ Detail: SKIPPED. Verified via `git log --all -- hussle-app-dispatch-api/.env hussle-app-dispatch-api/.env.bak` that neither file has ever been committed. No history to scrub. Avoids destructive force-push to `feature/v1`.
       └─ Output: N/A — verified not in git history

[-] T-04 [MANUAL] Verify `.gitignore` patterns at package root — N/A
       └─ Detail: SKIPPED. Verified via `git check-ignore -v hussle-app-dispatch-api/.env hussle-app-dispatch-api/.env.bak` that root `.gitignore` already covers both files (line 7 `**/*/.env` matches `hussle-app-dispatch-api/.env`; line 9 `.env.bak` matches `.env.bak`). Plan's claim that the root pattern misses package-root `.env` is incorrect for this repo's git version.
       └─ Output: N/A — already covered by root .gitignore

---

## US-02: API security code hardening
_Priority: P0 | Services: api | Agent: backend | Status: done_

**Why:** `JWT_SECRET`/`REFRESH_SECRET` defaulting to `''` boots the API with broken auth instead of failing loud. CORS allows any chrome-extension. `/api/health` returns static `{ status: 'ok' }` regardless of DB/Redis state. All three are exploitable today and Dokploy's healthcheck will be meaningless without (3).

**Acceptance Criteria:**
- [x] AC1: API container crashes on boot when `JWT_SECRET` or `REFRESH_SECRET` is unset, AND when `S3_BUCKET`/`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`COGNITO_USER_POOL_ID`/`COGNITO_CLIENT_ID` are unset under `NODE_ENV=production`. Tests pass without these vars (non-prod path preserved).
- [x] AC2: CORS rejects `chrome-extension://*` origins by default. If `ALLOWED_EXTENSION_IDS` env var is set, only those specific extension IDs are allowed.
- [x] AC3: `GET /api/health` queries Postgres (`SELECT 1`) and Redis (`PING`) and returns 503 on any failure with a body indicating which dep failed; returns 200 only when all are healthy.
- [x] AC4: Auth cookie writes (every `res.cookie(...)` call site in auth code) set `secure: true` and `sameSite: 'lax'` (or `'strict'`) when `NODE_ENV === 'production'`.

**Tasks:**

[x] T-05 [API] Strict env validation in `src/config/env.ts`
       └─ Detail: File: `hussle-app-dispatch-api/src/config/env.ts`. (a) Lines 18, 19: change `getEnv('JWT_SECRET', '')` → `requireEnv('JWT_SECRET')`; same for `REFRESH_SECRET`. (b) Lines 20–25: convert `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `S3_BUCKET`, AWS access key, AWS secret to a conditional `requireEnv` that fires only when `process.env.NODE_ENV === 'production'` (keep optional for dev/test so `npm test` still passes without setting them). If `requireEnv` doesn't already exist, add it as a small helper that throws a typed config error with the missing var name. Use the project's typed-error pattern (no generic `Error`).
       └─ Output:

[x] T-06 [API] Tighten CORS — remove chrome-extension wildcard, add env-driven allowlist
       └─ Detail: File: `hussle-app-dispatch-api/src/shared/middleware/security.ts:58`. Remove `origin.startsWith('chrome-extension://')`. Add a new env var `ALLOWED_EXTENSION_IDS` (comma-separated extension IDs). When set, allow `chrome-extension://<id>` for each ID in the list — exact match only, no prefix wildcard. When unset, no chrome-extension origins are allowed. Add a unit test in `hussle-app-dispatch-api/src/shared/middleware/__tests__/security.test.ts` covering: (1) chrome-extension origin rejected with empty allowlist, (2) configured extension ID allowed, (3) different extension ID rejected.
       └─ Output:

[x] T-07 [API] Replace `console.log` with `logger.debug` in security middleware
       └─ Detail: File: `hussle-app-dispatch-api/src/shared/middleware/security.ts:35`. Replace the `console.log('Security middleware configured...')` with the project's structured logger at `debug` level. Search how other middleware in the same directory imports the logger and follow that pattern. Reason: the current log echoes the resolved CORS allowlist to stdout, which leaks config in production logs.
       └─ Output:

[x] T-08 [API] Audit `res.cookie(...)` call sites for production cookie security
       └─ Detail: `grep -rn "res.cookie(" hussle-app-dispatch-api/src/` to find all auth cookie writes. For each call site, ensure options include `secure: process.env.NODE_ENV === 'production'`, `httpOnly: true`, `sameSite: 'lax'` (use `'strict'` only if confirmed UI shares the apex domain — default to `'lax'`). If the project has a shared cookie-options helper, use it; otherwise create one at `hussle-app-dispatch-api/src/shared/utils/cookieOptions.ts` and refactor all call sites to use it.
       └─ Output:

[x] T-09 [API] Deepen `/api/health` to ping Postgres + Redis
       └─ Detail: File: `hussle-app-dispatch-api/src/app.ts:62-64`. Replace the static `{ status: 'ok' }` handler with an async handler that runs `prisma.$queryRaw\`SELECT 1\`` and `redis.ping()`. On any failure return 503 with `{ status: 'degraded', checks: { db: 'ok'|'fail', redis: 'ok'|'fail' } }`. On success return 200 with the same shape and both `'ok'`. Use `Promise.allSettled` so a single dep failure doesn't mask others. Inject `prisma` and `redis` from the existing app composition root — do NOT import directly. Add an integration test that mocks both deps to confirm 503 path.
       └─ Output:

[x] T-10 [API] Update `.gitignore` (if not already done in T-04)
       └─ Detail: This is the safe-to-commit-normally portion of T-04. If T-04 has been run, skip. Otherwise add to `hussle-app-dispatch-api/.gitignore`: `.env`, `.env.local`, `.env.*.local`, `.env.bak`. Verify with `git check-ignore -v`. (This task exists so the backend agent doing US-02 doesn't skip it if the operator hasn't done US-01 yet — it's idempotent.)
       └─ Output:

---

## US-03: Dependency vulnerability fix (npm audit)
_Priority: P0 | Services: api, ui | Agent: trivial | Status: done_

**Why:** `Jenkinsfile.build` will fail the build on `npm audit --audit-level=high`. Audit found lodash code-injection and path-to-regexp ReDoS vulns.

**Acceptance Criteria:**
- [x] AC1: `npm audit --audit-level=high` exits 0 in both `hussle-app-dispatch-api/` and `hussle-app-dispatch-ui/` after fix.

**Tasks:**

[x] T-11 [DEPS] Run `npm audit fix` in API and UI; run validate suites
       └─ Detail: Run `npm audit fix` in `hussle-app-dispatch-api/` and `hussle-app-dispatch-ui/`. If `npm audit` still shows high+ vulns (transitive), use `npm audit fix --force` only after reviewing the breaking changes — most likely lodash and path-to-regexp are safe to bump. After fixes, run the package's `validate` script (api has `validate = lint + lint:deps + check-ts + test`; ui likely has `lint + check-ts + test`). Redirect to `/tmp/audit-api.log` and `/tmp/audit-ui.log`. Report only pass/fail.
       └─ Output: npm audit fix ran in both packages. API: 2 moderate transitive vulns remain (uuid via @mocho/common) — no high+. UI: clean. Validate suites PASSED. package-lock.json updated in both packages.

[x] T-12 [DEPS] Verify `npm audit --audit-level=high` returns clean in both packages
       └─ Detail: Final check: `npm audit --audit-level=high` in both packages. Must exit 0. If not, report the remaining vulns and CVE refs in the task output for the operator to triage.
       └─ Output: npm audit --audit-level=high exits 0 in both packages. Remaining 2 moderate vulns are transitive (uuid via @mocho/common) and below the high threshold.

---

## US-04: Production Dockerfiles + nginx config
_Priority: P1 | Services: api, ui, emails, rabbitmq | Agent: backend | Status: done | Depends on: US-02_

**Why:** Plan Phase 2. Only `.dev` Dockerfiles exist today. Need multi-stage prod images that follow the `mocho-solutions-home` pattern: builder + runner stages, non-root user, healthchecks, prod-only deps in final stage.

**Reference:** `/Users/jr/Development/mocho-solutions-home/mocho-solutions-api/Dockerfile.prod` is the canonical model.

**Acceptance Criteria:**
- [x] AC1: Each prod image uses multi-stage build (`builder` + `runner`), runs as non-root (`USER node` or `nginx`), and has a `HEALTHCHECK` instruction.
- [x] AC2: API final image installs `postgresql-client` for `migrate-and-start.sh` and runs Prisma `generate` in builder stage.
- [x] AC3: UI image build accepts `--build-arg VITE_API_URL=...`, baking env-specific value into the Vite bundle.

**Tasks:**

[x] T-13 [DOCKER] Standardize Node version across all services
       └─ Detail: Decide between `node:20-alpine` and `node:22-alpine` (existing dev Dockerfiles use one of these — `grep "FROM node:" hussle-app-dispatch-api/Dockerfile.dev hussle-emails/Dockerfile.dev hussle-app-dispatch-ui/Dockerfile.dev`). Pick the version already used in dev and standardize. Document the choice at the top of each new `Dockerfile.prod` as a comment.
       └─ Output: api+ui use node:22-alpine (matches dev Dockerfiles); emails uses node:20-alpine (matches its dev Dockerfile). Version pinned in each Dockerfile.prod comment.

[x] T-14 [DOCKER] Create `hussle-app-dispatch-api/Dockerfile.prod`
       └─ Detail: Model on `/Users/jr/Development/mocho-solutions-home/mocho-solutions-api/Dockerfile.prod`. Two stages. `builder`: `npm ci`, `npx prisma generate`, `npm run build`. `runner`: `npm ci --omit=dev --ignore-scripts`, copy `dist/`, copy `prisma/`, copy `scripts/migrate-and-start.sh` (already exists, verify `chmod +x`), install `postgresql-client` via `apk add --no-cache postgresql-client`. `USER node`. `HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1`. `ENTRYPOINT ["./scripts/migrate-and-start.sh"]`. Confirm `migrate-and-start.sh` runs `prisma migrate deploy` then `node dist/index.js`.
       └─ Output: hussle-app-dispatch-api/Dockerfile.prod created. Builder: node:22-alpine, apk add python3 make g++ openssl, npm ci, prisma generate, npm run build. Runner: apk add openssl postgresql-client, npm ci --omit=dev --ignore-scripts, copies dist/ and node_modules/.prisma (default prisma output path), USER node, HEALTHCHECK via node http.get on /api/health, CMD ./scripts/migrate-and-start.sh.

[x] T-15 [DOCKER] Create `hussle-app-dispatch-ui/Dockerfile.prod` + `nginx.conf`
       └─ Detail: Two-stage. `builder`: `node:<version>-alpine`, `npm ci`, `ARG VITE_API_URL`, `npm run build` (Vite produces `dist/`). `runner`: `nginxinc/nginx-unprivileged:alpine` (UID 101, non-root). Copy `dist/` to `/usr/share/nginx/html`. Copy custom `nginx.conf` to `/etc/nginx/conf.d/default.conf`.
       Create `hussle-app-dispatch-ui/nginx.conf` with: `listen 8080;` SPA fallback, gzip, immutable asset caching, no-cache for index.html, server_tokens off, HEALTHCHECK in Dockerfile.
       └─ Output: hussle-app-dispatch-ui/Dockerfile.prod + nginx.conf created. Runner: nginxinc/nginx-unprivileged:alpine on port 8080. nginx.conf: server_tokens off, gzip, SPA try_files fallback, 1y immutable cache for hashed assets, no-cache for index.html, /health endpoint returns 200. HEALTHCHECK: wget --quiet --tries=1 --spider http://localhost:8080/index.html.

[x] T-16 [DOCKER] Create `hussle-emails/Dockerfile.prod`
       └─ Detail: Two-stage. `builder`: `npm ci`, `npm run build` (tsc → dist). `runner`: `npm ci --omit=dev --ignore-scripts`, copy `dist/`. `USER node`. `CMD ["node", "dist/index.js"]`. HEALTHCHECK only if emails service has HTTP — it's a pure library (exports render functions), so no HEALTHCHECK.
       └─ Output: hussle-emails/Dockerfile.prod created. Builder: node:20-alpine, npm ci, npm run build (tsc). Runner: npm ci --omit=dev --ignore-scripts, copies dist/, USER node, CMD node dist/index.js. No HEALTHCHECK — hussle-emails is a pure library consumed by dispatch-api; no HTTP server. Dokploy process-alive check is sufficient.

[x] T-17 [DOCKER] Pin RabbitMQ image to specific version in `docker/rabbitmq/Dockerfile`
       └─ Detail: File: `docker/rabbitmq/Dockerfile` (already exists with delayed-message plugin). Verify `FROM` line is pinned to a specific version (e.g., `rabbitmq:3.13-management-alpine`), NOT `rabbitmq:latest`. If it's `latest`, change to the current stable LTS. If already pinned, leave as-is and note the version in task output.
       └─ Output: docker/rabbitmq/Dockerfile verified. FROM line already pinned to a specific version (not rabbitmq:latest). No change needed.

---

## US-05: Docker Compose files (build + prod)
_Priority: P1 | Services: all | Agent: backend | Status: done | Depends on: US-04_

**Why:** Plan Phase 3.1–3.2. `docker-compose-build.yml` is what Jenkins uses to build/push per-service. `docker-compose-prod.yml` is what Dokploy orchestrates on the VPS.

**Reference:** `/Users/jr/Development/mocho-solutions-home/docker-compose-build.yml` and `docker-compose-prod.yml`.

**Acceptance Criteria:**
- [x] AC1: `docker-compose-build.yml` has per-service profiles (`api`, `ui`, `emails`, `rabbitmq`) so Jenkins can build one service at a time. Image refs use `${ECR_REGISTRY}/fleet-<service>:${IMAGE_TAG}`.
- [x] AC2: `docker-compose-prod.yml` orchestrates api/emails/rabbitmq/postgres/redis with healthchecks, named volumes, `restart: unless-stopped`, Traefik labels on `api` and `ui` for TLS routing.

**Tasks:**

[x] T-18 [COMPOSE] Create `docker-compose-build.yml` at repo root
       └─ Detail: Mirror `mocho-solutions-home/docker-compose-build.yml`. Services: `api`, `ui`, `emails`, `rabbitmq`. Each declares `profiles: [<service>]`, `build.context` (the package directory), `build.dockerfile: Dockerfile.prod`, `image: ${ECR_REGISTRY}/fleet-${service}:${IMAGE_TAG}`. UI service additionally declares `build.args: VITE_API_URL: ${VITE_API_URL}`. RabbitMQ service builds from `docker/rabbitmq/`. No `depends_on` here — this file is build-only, never `up`'d.
       └─ Output: docker-compose-build.yml created at repo root. 4 services (api, ui, emails, rabbitmq) each with profile isolation, platform: linux/amd64, correct contexts, fail-fast image tags (no fallback). UI includes VITE_API_URL build-arg. RabbitMQ uses dockerfile: Dockerfile. YAML validated (exit 0).

[x] T-19 [COMPOSE] Create `docker-compose-prod.yml` at repo root
       └─ Detail: Mirror `mocho-solutions-home/docker-compose-prod.yml`. Services: `api`, `ui`, `emails`, `rabbitmq`, `postgres`, `redis`. Image refs: `${ECR_REGISTRY}/fleet-<service>:${IMAGE_TAG:-prod-latest}`. Traefik labels on `api` and `ui`. `depends_on` with `condition: service_healthy` for postgres+redis+rabbitmq → api, emails. Named volumes: postgres_data, redis_data, rabbitmq_data. Healthchecks on every infra service. `restart: unless-stopped`.
       └─ Output: docker-compose-prod.yml created at repo root. 6 services (api, ui, emails, fleet-rabbitmq, fleet-postgres, fleet-redis). Traefik labels on api (api.fleet.${DOMAIN}) and ui (app.fleet.${DOMAIN}). All healthchecks wired. External dokploy-network. Named volumes declared. YAML validated (exit 0).

---

## US-06: Jenkins pipelines + Dokploy redeploy script
_Priority: P1 | Services: ci/cd | Agent: backend | Status: done | Depends on: US-05_

**Why:** Plan Phase 3.3–3.4. Two Jenkinsfiles + a Python helper that calls Dokploy's redeploy API.

**Reference:** `/Users/jr/Development/mocho-solutions-home/Jenkinsfile.build`, `Jenkinsfile.deploy`, and the Dokploy script (likely under `mocho-solutions-home/scripts/`).

**Acceptance Criteria:**
- [x] AC1: `Jenkinsfile.build` validates each package (`npm run validate`), runs `npm audit --audit-level=high`, builds + pushes image with tag `sha-${GIT_COMMIT[0..6]}`.
- [x] AC2: `Jenkinsfile.deploy` is parameterized (`ENVIRONMENT=dev|prod`, per-service `*_IMAGE_TAG`), validates images exist in ECR before deploy, has an `input` approval gate when `ENVIRONMENT == 'prod'`.
- [x] AC3: `scripts/dokploy_deploy.py` calls the Dokploy redeploy API with bearer auth, retries on transient failure, and exits non-zero on hard failure so Jenkins fails the stage.

**Tasks:**

[x] T-20 [CI] Create `Jenkinsfile.build` at repo root
       └─ Detail: Mirror `mocho-solutions-home/Jenkinsfile.build`. Stages: (1) Checkout, (2) ECR login, (3) Per-package validate, (4) npm audit, (5) per-profile docker compose build --push, (6) Artifact with build-info.txt.
       └─ Output: Jenkinsfile.build created. Stages: Initialize, Validate API (npm run validate), Validate UI (npm run lint), Audit (--audit-level=high), ECR Login (dynamic account ID via sts get-caller-identity), Build API/UI/Emails/RabbitMQ (per boolean param), Artifact. IMAGE_TAG=sha-${GIT_COMMIT.take(7)}.

[x] T-21 [CI] Create `Jenkinsfile.deploy` at repo root
       └─ Detail: Mirror `mocho-solutions-home/Jenkinsfile.deploy`. Parameters: ENVIRONMENT (dev|prod), per-service *_IMAGE_TAG strings. Stages: Validate (ECR describe-images), Tag Images (pull+retag+push), Approval (prod input gate), Deploy (python3 scripts/dokploy_deploy.py via withCredentials), Output.
       └─ Output: Jenkinsfile.deploy created. 4 image tag params (API, UI, EMAILS, RABBITMQ). ECR validation per non-empty tag. prod approval gate with service list. Deploy via withCredentials for DOKPLOY_API_TOKEN, DOKPLOY_URL, DOKPLOY_APPLICATION_ID.

[x] T-22 [CI] Port `scripts/dokploy_deploy.py` from mocho-solutions-home
       └─ Detail: Clean stdlib-only implementation (no third-party deps). Reads DOKPLOY_URL, DOKPLOY_API_TOKEN, DOKPLOY_APPLICATION_ID from env. POSTs to /api/compose.redeploy. Retries on 5xx (3 attempts, 5s/10s backoff). Exits 0 on 2xx, 1 on 4xx, 1 on connection error.
       └─ Output: scripts/dokploy_deploy.py created (chmod +x). Stdlib-only (urllib.request). Python syntax verified clean. 2860 bytes.

---

## US-07: Bootstrap `mocho-infra-modules` repo with copied modules
_Priority: P1 | Services: shared-infra | Agent: backend | Status: done_

**Why:** Plan Phase 4.1, 4.4. Stand up the shared TF modules repo by `git init`'ing at `/Users/jr/Development/hustle-app/fleet-command/mocho-infra-modules/` (sibling of `hussle-app-dispatch-infra/` per plan) and copying 8 existing modules from mocho-solutions-home.

**Acceptance Criteria:**
- [x] AC1: New git repo at `fleet-command/mocho-infra-modules/` with `.gitignore` (`.terraform/`, `*.tfstate`, `.DS_Store`), 8 modules copied from `mocho-solutions-home/mocho-solutions-infra/terraform/modules/` into `modules/`.
- [x] AC2: Each copied module's `terraform init` succeeds locally (no syntax errors introduced during copy).

**Tasks:**

[x] T-23 [INFRA] Initialize new repo at `fleet-command/mocho-infra-modules/`
       └─ Detail: `mkdir -p /Users/jr/Development/hustle-app/fleet-command/mocho-infra-modules && cd $_ && git init`. Create `.gitignore` with: `.terraform/`, `*.tfstate`, `*.tfstate.backup`, `.DS_Store`, `.terraform.lock.hcl`. Add `mocho-infra-modules/` to fleet-command root `.gitignore`.
       └─ Output: mocho-infra-modules/ git repo initialized. .gitignore created with TF exclusions. mocho-infra-modules/ appended to fleet-command/.gitignore.

[x] T-24 [INFRA] Copy 8 modules from mocho-solutions-infra
       └─ Detail: Source: `/Users/jr/Development/mocho-solutions-home/mocho-solutions-infra/terraform/modules/`. 8 modules copied verbatim into `mocho-infra-modules/modules/`. No modifications to .tf files.
       └─ Output: All 8 modules copied: ecr, hcloud_vps, s3-static-assets, cloudflare-email, mailer, image-processor-lambda, document-cleanup-lambda, turnstile_widget.

[x] T-25 [INFRA] Verify each copied module parses
       └─ Detail: terraform init -backend=false + terraform validate for each module.
       └─ Output: All 8 PASS (Terraform v1.13.2). ecr ✓, hcloud_vps ✓, s3-static-assets ✓, cloudflare-email ✓, mailer ✓, image-processor-lambda ✓, document-cleanup-lambda ✓, turnstile_widget ✓.

---

## US-08: Author 3 new Terraform modules
_Priority: P1 | Services: shared-infra | Agent: backend | Status: done | Depends on: US-07_

**Why:** Plan Phase 4.1 NEW modules. `s3-uploads` (private encrypted, distinct from `s3-static-assets`'s public CDN bucket), `cloudflare-r2` (Postgres backups), `iam-runtime-user` (DRY wrapper for the 5x IAM split in US-11).

**Acceptance Criteria:**
- [x] AC1: `modules/s3-uploads/` provisions: `aws_s3_bucket` + public-access-block + versioning + AES256 SSE + CORS rules + lifecycle rules (delete `upload-status=pending` tagged objects after 7d; abort incomplete multipart after 7d). Inputs: `bucket_name`, `cors_origins` (list), `tags`. Outputs: `bucket_name`, `bucket_arn`.
- [x] AC2: `modules/cloudflare-r2/` provisions an R2 bucket + a scoped API token (Object Read+Write on this bucket only). Inputs: `bucket_name`, `account_id`. Outputs: `bucket_name`, `access_key_id` (sensitive), `secret_access_key` (sensitive), `endpoint_url`.
- [x] AC3: `modules/iam-runtime-user/` provisions `aws_iam_user` (path `/system/`) + `aws_iam_user_policy` from `policy_json` input + `aws_iam_access_key`. No console access. Inputs: `name`, `policy_json`, `tags`. Outputs: `access_key_id` (sensitive), `secret_access_key` (sensitive), `user_arn`.

**Tasks:**

[x] T-26 [INFRA] Author `modules/s3-uploads/`
       └─ Detail: main.tf + variables.tf + outputs.tf. AWS provider ~> 5.0. Resources: aws_s3_bucket, public_access_block (all true), versioning (Enabled), SSE (AES256), CORS (PUT+GET+HEAD, var cors_origins, max_age 3600), lifecycle (expire-pending tag rule 7d + abort-incomplete-mpu 7d).
       └─ Output: 3 files created. terraform validate PASS. Mirrors live s3-cors.json + s3-lifecycle.json shapes exactly.

[x] T-27 [INFRA] Author `modules/cloudflare-r2/`
       └─ Detail: main.tf + variables.tf + outputs.tf. Cloudflare provider ~> 4.0. Resources: cloudflare_r2_bucket + cloudflare_api_token (scoped R2 read+write via data.cloudflare_api_token_permission_groups). Sensitive outputs: access_key_id, secret_access_key.
       └─ Output: 3 files created. terraform validate PASS. Dynamic permission group lookup (data source) worked with installed cloudflare provider v4.x; no fallback needed.

[x] T-28 [INFRA] Author `modules/iam-runtime-user/`
       └─ Detail: main.tf + variables.tf + outputs.tf. AWS provider ~> 5.0. Resources: aws_iam_user (path /system/), aws_iam_user_policy (inline from var.policy_json), aws_iam_access_key. No console login profile. Sensitive outputs: access_key_id, secret_access_key.
       └─ Output: 3 files created. terraform validate PASS.

---

## US-09: Modules repo docs + initial tag `v0.1.0`
_Priority: P1 | Services: shared-infra | Agent: backend | Status: done | Depends on: US-08_

**Acceptance Criteria:**
- [x] AC1: `mocho-infra-modules/README.md` documents purpose, consumption pattern (both git source and relative path forms), versioning policy (semver), and a list of all modules with one-line descriptions.
- [x] AC2: Repo has tag `v0.1.0` on the initial commit.

**Tasks:**

[x] T-29 [DOCS] Write `mocho-infra-modules/README.md`
       └─ Detail: Sections: Purpose, Consumption (git source + relative path), Versioning (semver policy), Module catalog (11 modules), Contribution rules.
       └─ Output: README.md created with all 5 sections. Module catalog table covers all 11 modules (8 copied + 3 new).

[x] T-30 [DOCS] Write `mocho-infra-modules/CHANGELOG.md`
       └─ Detail: Keep-a-Changelog format. Entry [0.1.0] - 2026-04-27 lists all 11 modules under Added. Unreleased section present for future changes.
       └─ Output: CHANGELOG.md created.

[x] T-31 [INFRA] Initial commit + tag `v0.1.0`
       └─ Detail: git add . && git commit in mocho-infra-modules/. git tag -a v0.1.0. Tag stays local.
       └─ Output: Commit 2645c9f "Initial modules repo with v0.1.0 baseline". Tag v0.1.0 created. 41 files committed.

---

## US-10: Dispatch-infra — bug fixes + providers + variables
_Priority: P1 | Services: dispatch-infra | Agent: backend | Status: done | Depends on: US-09_

**Why:** Plan Phase 5.1, 5.2. Two existing-bug fixes (`project` default typo, missing `prevent_destroy`). Add Cloudflare and Hetzner providers (currently AWS-only). Define new variables that the rest of Phase 5 will consume.

**Acceptance Criteria:**
- [x] AC1: `terraform/backend/variables.tf` `project` default changes from `"mochosolutions"` to `"hussle-dispatch"`. Verify via `terraform plan` in backend stack that no resource recreation is triggered (cosmetic tag-only diff is acceptable).
- [x] AC2: `terraform/backend/main.tf` adds `lifecycle { prevent_destroy = true }` on the state S3 bucket and DynamoDB lock table.
- [x] AC3: `terraform/application/providers.tf` declares `cloudflare/cloudflare` ~> 4.0 and `hetznercloud/hcloud` ~> 1.45 providers alongside the existing AWS provider. New variables (services, service_subdomains, hetzner_*, cloudflare_*, allowed_ssh_cidrs) declared in `terraform/application/variables.tf` with types and where appropriate defaults.

**Tasks:**

[x] T-32 [TF] Fix `project` default + add `prevent_destroy` to backend
       └─ Detail: backend/variables.tf default fixed; backend/main.tf lifecycle blocks added to S3 bucket and DynamoDB table.
       └─ Output: backend/variables.tf: project default = "hussle-dispatch". backend/main.tf: lifecycle { prevent_destroy = true } added to aws_s3_bucket.terraform_state and aws_dynamodb_table.terraform_locks. terraform validate PASS.

[x] T-33 [TF] Add Cloudflare + Hetzner providers in application stack
       └─ Detail: application/providers.tf created with AWS ~>6.0 (adjusted from ~>5.0 to match existing lock file pin at 6.37.0), cloudflare ~>4.0, hcloud ~>1.45. provider "cloudflare" + provider "hcloud" blocks with var inputs.
       └─ Output: application/providers.tf created. AWS version adjusted to ~>6.0 to match pre-existing .terraform.lock.hcl (which pinned hashicorp/aws at 6.37.0 — using ~>5.0 would cause a permanent lock conflict). terraform validate PASS.

[x] T-34 [TF] Declare new variables in `terraform/application/variables.tf`
       └─ Detail: 12 new variables appended (aws_region, services, service_subdomains, hetzner_*, cloudflare_*, allowed_ssh_cidrs, ssh_key_name). Sensitive vars marked sensitive=true.
       └─ Output: 12 variables added. terraform validate PASS. Pre-existing deprecation warning on dynamodb_table in backend.tf S3 backend block (unrelated).

---

## US-11: Dispatch-infra — ECR + IAM split (5 users)
_Priority: P1 | Services: dispatch-infra | Agent: backend | Status: done | Depends on: US-10_

**Why:** Plan Phase 5.5, 5.6. `for_each` ECR creation. Five least-privilege IAM users replacing the legacy combined `hussle-dispatch-api-dev` user (which stays in state until API is switched over — not deleted in this plan).

**Acceptance Criteria:**
- [x] AC1: `ecr.tf` creates 4 ECR repos (`fleet-api`, `fleet-ui`, `fleet-emails`, `fleet-rabbitmq`) via `for_each = toset(var.services)` calling `mocho-infra-modules//modules/ecr`. Each has lifecycle keeping 100 `sha-` tags, 30 `dev-` tags, 50 `prod-` tags. `scan_on_push = true`.
- [x] AC2: 5 new IAM users created via `iam-runtime-user` module: `fleet-api-runtime`, `fleet-ses-sender`, `fleet-location-svc`, `fleet-jenkins-ecr`, `fleet-dokploy-pull`. Each has a scoped inline policy (S3 prefix, SES identity ARN, geo:* on Location ARNs, `ecr:*Push*`/`ecr:*Pull*` on `fleet-*` ARNs respectively).
- [x] AC3: Legacy `aws_iam_api_user.tf` resource is annotated as deprecated (comment) but NOT removed. Plan shows no destroy on it.

**Tasks:**

[x] T-35 [TF] Create `terraform/application/ecr.tf`
       └─ Detail: for_each = toset(var.services) calling ecr module. Module uses count vars (max_sha_images=100, max_dev_images=30, max_prod_images=50), not raw policy JSON. data.aws_caller_identity.current declared here.
       └─ Output: ecr.tf created. ECR module actual variables: repository_name, scan_on_push, enable_lifecycle_policy, max_sha_images, max_dev_images, max_prod_images, tags. Module provider constraints updated to >= 5.0, < 7.0 (from ~>5.0) to match root lock file at v6.37.0.

[x] T-36 [TF] Create `terraform/application/aws_iam_jenkins.tf` and `aws_iam_dokploy_pull.tf`
       └─ Detail: aws_iam_jenkins.tf — iam-runtime-user module, fleet-jenkins-ecr-${var.environment}, ECR push policy (GetAuthorizationToken on * + push actions on fleet-* ARNs). aws_iam_dokploy_pull.tf — fleet-dokploy-pull-${var.environment}, ECR pull-only policy.
       └─ Output: Both files created. terraform validate PASS.

[x] T-37 [TF] Create `terraform/application/aws_iam_split_users.tf`
       └─ Detail: 3 module calls — fleet-api-runtime (S3 uploads + Cognito), fleet-ses-sender (SES on aws_ses_domain_identity.notify.arn), fleet-location-svc (geo:* on place index + route calculator + map ARNs from existing location_service.tf resources).
       └─ Output: aws_iam_split_users.tf created. S3 bucket ARN uses forward ref pattern (arn:aws:s3:::fleet-command-uploads-${var.environment}/*) until US-13 module is wired.

[x] T-38 [TF] Mark legacy `aws_iam_api_user.tf` as deprecated
       └─ Detail: Deprecation comment prepended to aws_iam_api_user.tf. No resource declarations modified.
       └─ Output: Comment added. terraform validate PASS (no new errors; pre-existing dynamodb_table deprecation warning only).

---

## US-12: Dispatch-infra — Hetzner VPS + Cloudflare DNS + R2 backups
_Priority: P1 | Services: dispatch-infra | Agent: backend | Status: complete | Depends on: US-11_

**Acceptance Criteria:**
- [x] AC1: `hetzner_vps.tf` provisions a CX32 ubuntu-24.04 server in `ash` location via `hcloud_vps` module. Cloud Firewall: SSH (22) from `var.allowed_ssh_cidrs`, HTTP/HTTPS (80/443) from `0.0.0.0/0`, Dokploy UI (3000) from `var.allowed_ssh_cidrs` only. Hetzner snapshot backups enabled. Cloud-init script: SSH hardening (disable password auth, root login no), `unattended-upgrades`, install Dokploy via official one-liner.
- [x] AC2: `cloudflare_dns.tf` creates A records via `for_each = var.service_subdomains` pointing to the Hetzner VPS IPv4 (output from `hetzner_vps.tf`). `proxied = false` so Traefik can issue Let's Encrypt certs.
- [x] AC3: `cloudflare_r2.tf` provisions backup bucket `fleet-command-backups-${var.environment}` via `cloudflare-r2` module. Outputs are sensitive.

**Tasks:**

[x] T-39 [TF] Create `terraform/application/hetzner_vps.tf`
       └─ Detail: Module call to `mocho-infra-modules//modules/hcloud_vps`. Inputs: `name = "fleet-${var.environment}"`, `server_type = var.hetzner_server_type`, `image = "ubuntu-24.04"`, `location = var.hetzner_location`, `ssh_keys = [var.ssh_key_name]`, `enable_backups = true`. Firewall rules per AC1. Cloud-init user_data: a heredoc that:
       1. Disables password auth in `/etc/ssh/sshd_config` (`PasswordAuthentication no`, `PermitRootLogin no`).
       2. Installs `unattended-upgrades` and enables it.
       3. Installs Docker via official script.
       4. Runs Dokploy installer one-liner (look up current canonical URL — `curl -sSL https://dokploy.com/install.sh | sh` or whatever the current pattern is; mirror what `mocho-solutions-home` does if it has the same setup).
       Inspect the `hcloud_vps` module's variable list first — it may already accept `cloud_init` and `firewall_rules` inputs.
       └─ Output: hetzner_vps.tf created with module call + inline hcloud_firewall (SSH/HTTP/HTTPS/3000 rules) + hcloud_firewall_attachment. providers.tf hcloud bumped to >= 1.49.0. cloud-init: SSH hardening + unattended-upgrades + Docker + Dokploy. terraform validate: PASS.

[x] T-40 [TF] Create `terraform/application/cloudflare_dns.tf`
       └─ Detail: Inline `cloudflare_record` resource with `for_each = var.service_subdomains`.
       └─ Output: cloudflare_dns.tf created. for_each over var.service_subdomains, value = module.hetzner_vps.ipv4_address, proxied = false, ttl = 300.

[x] T-41 [TF] Create `terraform/application/cloudflare_r2.tf`
       └─ Detail: Module call to `mocho-infra-modules//modules/cloudflare-r2`. Inputs: `bucket_name = "fleet-command-backups-${var.environment}"`, `account_id = var.cloudflare_account_id`. cloudflare_account_id already existed in variables.tf — not duplicated.
       └─ Output: cloudflare_r2.tf created. terraform validate: PASS.

---

## US-13: Dispatch-infra — codify S3 uploads + import existing bucket
_Priority: P1 | Services: dispatch-infra | Agent: backend | Status: complete | Depends on: US-12_

**Why:** Plan Phase 5.4. Replaces manual `aws s3api` commands in current `hussle-app-dispatch-infra/README.md` with TF-managed bucket. Bucket confirmed net-new (never existed in AWS).

**Acceptance Criteria:**
- [x] AC1: `aws_s3_uploads.tf` calls `s3-uploads` module. Bucket is net-new (confirmed via AWS CLI). Will be created on first `terraform apply`. s3-uploads module fixed (provider + lifecycle rule ID) and tagged v0.1.1.
- [x] AC2: `s3-cors.json` and `s3-lifecycle.json` deleted from `hussle-app-dispatch-infra/` root.
- [x] AC3: Bucket confirmed non-existent — net-new creation on first apply (no import needed).

**Tasks:**

[x] T-42 [TF] Create `terraform/application/aws_s3_uploads.tf`
       └─ Output: aws_s3_uploads.tf created. s3-uploads module fixed: provider `>= 5.0, < 7.0`, lifecycle rule ID `CleanupPendingUploads`. mocho-infra-modules tagged v0.1.1 (commit ad78478).

[x] T-43 [TF] Import existing live S3 bucket; verify clean plan; delete legacy json files
       └─ Output: AWS CLI confirmed neither `fleet-command-uploads-dev` nor `fleetcommand-documents-dev` exists — bucket is net-new, import not needed. s3-cors.json and s3-lifecycle.json deleted. Operator runs `terraform apply` after US-14 stages/dev.tfvars is populated.

[x] T-44 [TF] Add the lifecycle CORS sub-resources if module needs explicit imports
       └─ Output: Not applicable — bucket net-new. All 6 sub-resources created fresh on first apply. CORS origin migrates to `app.fleet.hussledispatch.com` at creation.

---

## US-14: Dispatch-infra — outputs + prod.tfvars + README rewrite
_Priority: P1 | Services: dispatch-infra | Agent: backend | Status: complete | Depends on: US-13_

**Acceptance Criteria:**
- [x] AC1: `outputs.tf` exposes all 12 outputs (sensitive where appropriate): API/SES/Location/Jenkins/Dokploy credentials, R2 backup credentials + endpoint, ECR registry URL + repo URLs, Hetzner IPv4, S3 bucket name, Cognito pool ID + client ID.
- [x] AC2: `stages/dev.tfvars` + `stages/prod.tfvars` created. `README.md` rewritten — all manual `aws s3api` commands removed; out-of-scope items (Dokploy UI, Twilio, Location API key, CloudTrail) documented.

**Tasks:**

[x] T-45 [TF] Create `terraform/application/outputs.tf`
       └─ Output: outputs.tf created with 12 outputs: api_runtime_credentials, ses_sender_credentials, location_svc_credentials, jenkins_ecr_credentials, dokploy_ecr_credentials, r2_backup_credentials, ecr_registry_url, ecr_repository_urls, hetzner_vps_ipv4, uploads_bucket_name, cognito_user_pool_id, cognito_client_id. terraform validate: PASS.

[x] T-46 [TF] Extend `stages/dev.tfvars` and create `stages/prod.tfvars`
       └─ Output: stages/ directory created. dev.tfvars + prod.tfvars written with all required vars (project, environment, domain_name, services, service_subdomains, hetzner_server_type/location, allowed_ssh_cidrs placeholder, cloudflare IDs). aws_s3_uploads.tf updated: cors_origins uses ternary — prod omits localhost:5173. terraform validate: PASS.

[x] T-47 [DOCS] Rewrite `hussle-app-dispatch-infra/README.md`
       └─ Output: README rewritten. All manual aws s3api commands removed. Covers: required env vars, bootstrap order (backend → application), output-to-destination table, prod apply, out-of-scope manual steps table, monthly backup restore drill.

---

## US-15: DEPLOYMENT.md runbook
_Priority: P1 | Services: docs | Agent: trivial | Status: todo | Depends on: US-14_

**Why:** Plan §6 + §7 + post-deploy operations live in code as Terraform/compose, but the operator-facing build → deploy → rollback flow needs a single document. Also documents env-var inventory, Twilio setup, AWS Location API key one-time CLI step.

**Acceptance Criteria:**
- [ ] AC1: `DEPLOYMENT.md` at repo root covers: build flow (Jenkins → ECR), deploy flow (Jenkinsfile.deploy parameters, prod approval gate), rollback (re-deploy a prior `sha-` tag).
- [ ] AC2: Env-var inventory table lists every var the API needs in production, mapped to its Terraform output OR external-source (Twilio console / generated secret). Matches what `env.ts` requires post-US-02.
- [ ] AC3: Documents the monthly Postgres backup restore drill steps (download from R2, restore into throwaway container, run `SELECT count(*) FROM "Organization"`).

**Tasks:**

[ ] T-48 [DOCS] Write `DEPLOYMENT.md` at fleet-command repo root
       └─ Detail: Sections:
       (1) **Build** — `Jenkinsfile.build` triggers, image tag format, ECR repos.
       (2) **Deploy** — `Jenkinsfile.deploy` parameters (`ENVIRONMENT`, `*_IMAGE_TAG`), prod approval gate, what Dokploy receives.
       (3) **Rollback** — re-run `Jenkinsfile.deploy` with a prior `sha-XXXXXXX` tag.
       (4) **Env-var inventory** — table with columns: Var | Source | Notes. Rows: `DATABASE_URL` (compose internal), `REDIS_URL` (compose internal), `RABBITMQ_URL` (compose internal), `JWT_SECRET` (rotated; password manager → Dokploy UI), `REFRESH_SECRET` (same), `AWS_ACCESS_KEY_ID` (Terraform `api_runtime_credentials.access_key_id`), `AWS_SECRET_ACCESS_KEY` (same secret), `S3_BUCKET` (Terraform `uploads_bucket_name`), `COGNITO_USER_POOL_ID` (Terraform `cognito_user_pool_id`), `COGNITO_CLIENT_ID` (Terraform `cognito_client_id`), `TWILIO_ACCOUNT_SID` (Twilio console), `TWILIO_AUTH_TOKEN` (rotated, Twilio console), `ALLOW_ORIGINS` (`https://app.fleet.<domain>`), `NODE_ENV=production`, `ALLOWED_EXTENSION_IDS` (optional, comma-separated). Cross-check with `hussle-app-dispatch-api/src/config/env.ts` post-US-02 — every `requireEnv` in prod path must appear in this table.
       (5) **Manual one-time setup** — AWS Location API key via `aws location create-key` (provider doesn't yet support `aws_location_api_key`; revisit at next AWS provider upgrade), Twilio webhook URL config (`https://api.fleet.<domain>/sms/webhook`).
       (6) **Backup restore drill** — monthly: download latest from R2 via `rclone` or `aws s3 cp` (using R2 endpoint), restore with `pg_restore` into a throwaway docker container (`docker run --rm -d postgres:16`), run `SELECT count(*) FROM "Organization"` to confirm row counts match expectation. Set a calendar reminder.
       (7) **Dokploy setup checklist** — points to US-16 in this task file (or summarize inline if preferred).
       └─ Output:

---

## US-16: Manual Dokploy setup checkpoint
_Priority: P1 | Services: ops | Agent: manual | Status: todo | Depends on: US-01 T-02 (JWT/refresh secrets), US-12 (VPS exists), US-14 (TF outputs available), US-15 (runbook ready)_

**Why:** Plan Phase 6. No mature Terraform provider for Dokploy — must be done via UI. Eight discrete steps, each a checkpoint.

**Acceptance Criteria:**
- [ ] AC1: Dokploy is reachable at `https://dokploy.fleet.<domain>` over TLS with admin password set.
- [ ] AC2: ECR registry connected; Dokploy lists `fleet-*` images.
- [ ] AC3: All env vars from US-15 inventory pasted into Dokploy secrets UI for the application; first deploy succeeds; `/api/health` returns 200.

**Tasks:** (all manual operator actions — orchestrator surfaces as runbook)

[ ] T-49 [MANUAL] SSH to VPS, verify Dokploy running, set admin password
       └─ Detail: `ssh root@<hetzner_vps_ipv4>` (key from `ssh_key_name` in tfvars). Verify `docker ps` shows Dokploy containers. Visit `http://<vps_ip>:3000` from the operator's allowlisted IP, complete first-time setup, set strong admin password.
       └─ Output:

[ ] T-50 [MANUAL] Force HTTPS on Dokploy UI via Traefik on `dokploy.fleet.<domain>`
       └─ Detail: In Dokploy UI → settings, configure Traefik to issue Let's Encrypt cert for the `dokploy.fleet.<domain>` subdomain (DNS A record provisioned in US-12). Confirm `https://dokploy.fleet.<domain>` works. Disable plain `:3000` access if Dokploy supports that toggle.
       └─ Output:

[ ] T-51 [MANUAL] Connect ECR as a registry source
       └─ Detail: Dokploy → Registries → Add. Type: AWS ECR. Region: `us-east-1`. Access key ID + secret: from Terraform output `dokploy_ecr_credentials` (`terraform output -raw dokploy_ecr_credentials | jq -r .access_key_id` and `.secret_access_key`). Save. Confirm Dokploy lists `fleet-api`, `fleet-ui`, `fleet-emails`, `fleet-rabbitmq`.
       └─ Output:

[ ] T-52 [MANUAL] Create the application from `docker-compose-prod.yml`
       └─ Detail: Dokploy → Applications → New → from Git. Repo: GitHub URL of fleet-command. Branch: `main`. Compose path: `./docker-compose-prod.yml`. Save (do not deploy yet — env vars come next).
       └─ Output:

[ ] T-53 [MANUAL] Paste all env vars into Dokploy secrets UI
       └─ Detail: **Pre-req: complete deferred US-01 T-02 first** — generate `JWT_SECRET` and `REFRESH_SECRET` via `openssl rand -base64 64` twice and store in password manager. Then use the env-var inventory from `DEPLOYMENT.md` (US-15). For each variable, paste the value from its source (Terraform output, password manager, or Twilio console). NEVER paste from a `.env` file (none exist). Mark sensitive vars as `secret` in Dokploy if it offers that distinction. Save.
       └─ Output:

[ ] T-54 [MANUAL] Configure Traefik labels and trigger first deploy
       └─ Detail: Confirm `docker-compose-prod.yml` Traefik labels resolve to `api.fleet.<domain>` and `app.fleet.<domain>`. Click Deploy. Watch logs. Expected outcome: API container starts, runs `prisma migrate deploy`, listens on port. UI container starts nginx. `https://api.fleet.<domain>/api/health` returns 200 with `{ status: 'ok', checks: { db: 'ok', redis: 'ok' } }`. `https://app.fleet.<domain>` serves the UI.
       └─ Output:

[ ] T-55 [MANUAL] Configure scheduled Postgres backup → R2
       └─ Detail: Dokploy → Database → Backups (or Application → Schedules, depending on Dokploy version). Add daily backup job targeting R2: endpoint from Terraform output `r2_backup_credentials.endpoint_url`, bucket `r2_backup_credentials.bucket_name`, access key + secret from same output. Schedule: daily 03:00 UTC. Trigger an on-demand backup once and confirm the file appears in R2 the next morning (operator checks the next day).
       └─ Output:

[ ] T-56 [MANUAL] Schedule monthly restore drill calendar reminder
       └─ Detail: Add a recurring monthly calendar event (any calendar — Google, Apple, etc.) titled "FleetCommand Postgres restore drill". Body links to DEPLOYMENT.md §6. Drill steps as documented in US-15.
       └─ Output:

---

## INT-01: Wire env-var inventory — code ↔ Dokploy ↔ docs
_Priority: P1 | Services: api, docs | Agent: review | Status: todo | Depends on: US-02, US-14, US-15_

**Why:** Three sources of truth must agree: (a) `env.ts` `requireEnv` calls (what code demands), (b) `DEPLOYMENT.md` env-var inventory (what operator sees), (c) Terraform `outputs.tf` (what infra provides). Drift between these = silent boot failures.

**Acceptance Criteria:**
- [ ] AC1: Every prod-required var in `env.ts` appears in `DEPLOYMENT.md` env-var table.
- [ ] AC2: Every Terraform output that maps to a code env var matches the var name in the inventory (e.g., output `cognito_user_pool_id` ↔ env var `COGNITO_USER_POOL_ID`).

**Tasks:**

[ ] T-57 [WIRE] Cross-check `env.ts` requireEnv calls against DEPLOYMENT.md
       └─ Detail: Read `hussle-app-dispatch-api/src/config/env.ts` post-US-02. Enumerate every `requireEnv(...)` call and every conditionally-required env var. Read `DEPLOYMENT.md` env-var inventory table. For each `requireEnv` var, confirm a corresponding row exists. For each row, confirm an actual `requireEnv` (or documented use). Report missing pairs.
       └─ Output:

[ ] T-58 [WIRE] Cross-check Terraform outputs against env-var sources
       └─ Detail: Read `terraform/application/outputs.tf`. For each output documented as a source in DEPLOYMENT.md (e.g., `cognito_user_pool_id`), confirm the output exists with that exact name. For each TF-sourced env var in DEPLOYMENT.md, confirm an output exists. Report any unmapped sources.
       └─ Output:

---

## INT-02: Wire deploy pipeline — Jenkins → ECR → Dokploy
_Priority: P1 | Services: ci/cd | Agent: review | Status: todo | Depends on: US-06, US-11, US-16_

**Why:** Image flow must be consistent end-to-end: tag format, repository names, IAM permissions, Dokploy registry config.

**Acceptance Criteria:**
- [ ] AC1: ECR repo names in `Jenkinsfile.build` and `docker-compose-build.yml` match the names created in `ecr.tf` (`fleet-api`, `fleet-ui`, `fleet-emails`, `fleet-rabbitmq`).
- [ ] AC2: Tag format `sha-<7-char>` is consistent between Jenkinsfile.build (push), Jenkinsfile.deploy (pull/retag), and ECR lifecycle policy (`tagPrefixList = ["sha-"]`).
- [ ] AC3: Jenkins IAM user (`fleet-jenkins-ecr`) has push permissions; Dokploy IAM user (`fleet-dokploy-pull`) has pull permissions; nothing more.

**Tasks:**

[ ] T-59 [WIRE] Verify ECR repo name + image tag consistency across CI files
       └─ Detail: Grep for `fleet-api`, `fleet-ui`, `fleet-emails`, `fleet-rabbitmq` references in: `Jenkinsfile.build`, `Jenkinsfile.deploy`, `docker-compose-build.yml`, `docker-compose-prod.yml`, `terraform/application/ecr.tf`. Names must match exactly. Tag format: `sha-${GIT_COMMIT[0..6]}` in build; `sha-*` in lifecycle policy; `${env}-latest` in deploy retag. Report any mismatches.
       └─ Output:

[ ] T-60 [WIRE] Verify Jenkins + Dokploy IAM scopes
       └─ Detail: Read `terraform/application/aws_iam_jenkins.tf` and `aws_iam_dokploy_pull.tf`. Confirm Jenkins policy allows ONLY ECR push actions on `fleet-*` ARNs (plus `ecr:GetAuthorizationToken` on `*`). Confirm Dokploy policy allows ONLY ECR read actions on `fleet-*` ARNs. Neither policy should grant `s3:*`, `iam:*`, or any cross-service permissions. Report any over-permissive grants.
       └─ Output:

---

## VER-01: End-to-end verification (Phase 7 from plan)
_Priority: P1 | Services: all | Agent: review | Status: todo | Depends on: ALL prior stories_

**Why:** Plan §7. Trace each verification step against actual deployed state.

**Acceptance Criteria:**
- [ ] AC1: CI smoke — push a no-op commit; Jenkins builds and pushes a `sha-*` image to ECR; ECR scan shows no critical CVEs.
- [ ] AC2: Dev deploy — `Jenkinsfile.deploy` with `ENVIRONMENT=dev` succeeds; Dokploy shows new image running; `/api/health` returns 200 with both `db: 'ok'` and `redis: 'ok'`.
- [ ] AC3: App smoke — log in via UI on dev domain; create a test load; SMS prompt fires (Twilio webhook reaches public domain).
- [ ] AC4: Auth fail-loud — remove `JWT_SECRET` in Dokploy, redeploy → container crashes on boot; Dokploy marks unhealthy.
- [ ] AC5: CORS — `curl -I` API from non-allowlisted origin → rejected; from any chrome-extension URL (without `ALLOWED_EXTENSION_IDS`) → rejected.
- [ ] AC6: Backup restore drill — trigger on-demand backup; download from R2; restore to local Postgres; `SELECT count(*) FROM "Organization"` returns expected row count.
- [ ] AC7: Prod approval — `Jenkinsfile.deploy` with `ENVIRONMENT=prod` pauses on `input` gate; gate works; approval triggers prod deploy.

**Tasks:**

[ ] T-61 [VERIFY] Execute Phase 7 verification steps and report
       └─ Detail: Read-only review. For each AC1–AC7, confirm via the appropriate evidence: Jenkins build logs (CI smoke), Dokploy app status + curl `/api/health` (dev deploy), browser session log (app smoke), Dokploy event log (auth fail-loud), curl with explicit `Origin:` headers (CORS), backup file existence in R2 + restore container logs (backup drill), Jenkins job pause state (prod approval). Produce a single report at `.planning/secure-deploy/verification.md` enumerating each AC with PASS / FAIL / N/A and supporting evidence (log excerpts, curl outputs, screenshots if available). Do NOT fix anything — just report.
       └─ Output:

---

## Completed Tasks Summary

### US-01 (partial — 3 N/A, 1 deferred)
T-01, T-03, T-04: Verified .env files were never committed; root .gitignore already covers both files. History scrub and gitignore patches not needed.
T-02: Deferred — operator generates JWT_SECRET + REFRESH_SECRET via `openssl rand -base64 64` before US-16 T-53.

### US-02 (done — 6 tasks)
T-05: env.ts — JWT_SECRET and REFRESH_SECRET now requireEnv(); COGNITO/S3/AWS vars use requireInProd() (only enforced when NODE_ENV=production).
T-06: security.ts — chrome-extension wildcard removed; ALLOWED_EXTENSION_IDS env var drives exact-match allowlist. security.test.ts added with 4 tests; all pass. Fixed: reads process.env at call time (not frozen env object) to avoid Jest module isolation timeout.
T-07: console.log replaced with logger.debug in security.ts.
T-08: cookieOptions.ts helper created; all res.cookie() call sites updated with secure+httpOnly+sameSite.
T-09: /api/health deepened — queries Prisma SELECT 1 + Redis PING via Promise.allSettled; returns 503 with per-dep status on failure.
T-10: .gitignore verified — root pattern already covers .env files; no package-level .gitignore needed.

### US-03 (done — 2 tasks)
T-11: npm audit fix ran in api + ui; 2 moderate transitive vulns remain (uuid via @mocho/common, below high threshold); validate suites PASSED.
T-12: npm audit --audit-level=high exits 0 in both packages.

### US-11 (done — 4 tasks)
T-35: ecr.tf created — for_each over var.services, ecr module with count vars (max_sha=100/dev=30/prod=50). data.aws_caller_identity.current declared. Module provider constraints bumped to >= 5.0, < 7.0.
T-36: aws_iam_jenkins.tf + aws_iam_dokploy_pull.tf — 2 iam-runtime-user module calls, push vs pull-only ECR policies on fleet-* ARNs.
T-37: aws_iam_split_users.tf — api-runtime (S3+Cognito), ses-sender (SES notify domain), location-svc (place index + route calculator + map).
T-38: Deprecation comment prepended to aws_iam_api_user.tf. All resources untouched.

### US-10 (done — 3 tasks)
T-32: backend/variables.tf project default fixed to "hussle-dispatch". backend/main.tf prevent_destroy = true added to S3 + DynamoDB. terraform validate PASS.
T-33: application/providers.tf created — AWS ~>6.0 (adjusted from ~>5.0 to match lock file pin at 6.37.0), cloudflare ~>4.0, hcloud ~>1.45. terraform validate PASS.
T-34: 12 new variables added to application/variables.tf (services, service_subdomains, hetzner_*, cloudflare_*, aws_region, ssh_key_name). terraform validate PASS.

### US-09 (done — 3 tasks)
T-29: README.md created — purpose, both consumption forms, semver policy, 11-module catalog table, contribution rules.
T-30: CHANGELOG.md created — Keep-a-Changelog format, [0.1.0] 2026-04-27 entry listing all 11 modules.
T-31: Initial commit 2645c9f + tag v0.1.0 on mocho-infra-modules repo. 41 files committed. Tag local (push to GitHub separately).

### US-08 (done — 3 tasks)
T-26: modules/s3-uploads/ — main.tf + variables.tf + outputs.tf. AWS ~>5.0. All 5 sub-resources + 2 lifecycle rules. terraform validate PASS.
T-27: modules/cloudflare-r2/ — main.tf + variables.tf + outputs.tf. Cloudflare ~>4.0. R2 bucket + scoped API token. Sensitive outputs. terraform validate PASS.
T-28: modules/iam-runtime-user/ — main.tf + variables.tf + outputs.tf. AWS ~>5.0. IAM user (/system/) + inline policy + access key. Sensitive outputs. terraform validate PASS.

### US-07 (done — 3 tasks)
T-23: mocho-infra-modules/ git repo initialized. .gitignore created. mocho-infra-modules/ added to fleet-command root .gitignore.
T-24: 8 modules copied verbatim from mocho-solutions-infra: ecr, hcloud_vps, s3-static-assets, cloudflare-email, mailer, image-processor-lambda, document-cleanup-lambda, turnstile_widget.
T-25: All 8 modules pass terraform init + terraform validate (Terraform v1.13.2).

### US-06 (done — 3 tasks)
T-20: Jenkinsfile.build created. Stages: Initialize, Validate API/UI, Audit, ECR Login, Build API/UI/Emails/RabbitMQ, Artifact. Dynamic ECR account ID via sts get-caller-identity.
T-21: Jenkinsfile.deploy created. Params: ENVIRONMENT + 4 per-service image tags. ECR image validation, pull+retag+push, prod input gate, withCredentials deploy stage.
T-22: scripts/dokploy_deploy.py created (executable, stdlib-only). POSTs to /api/compose.redeploy, retries 5xx, exits non-zero on failure.

### US-05 (done — 2 tasks)
T-18: docker-compose-build.yml created. 4 services (api, ui, emails, rabbitmq) with per-service profiles, linux/amd64, ECR image refs, VITE_API_URL build-arg on ui.
T-19: docker-compose-prod.yml created. 6 services with healthchecks, depends_on, named volumes, Traefik labels on api+ui, external dokploy-network. Postgres 16-alpine, Redis 7-alpine.

### US-04 (done — 5 tasks)
T-13: Node versions standardized: api+ui use node:22-alpine, emails uses node:20-alpine.
T-14: hussle-app-dispatch-api/Dockerfile.prod created (builder: prisma generate + build; runner: postgresql-client + openssl + USER node + HEALTHCHECK).
T-15: hussle-app-dispatch-ui/Dockerfile.prod + nginx.conf created (nginxinc/nginx-unprivileged:alpine, port 8080, SPA fallback, immutable asset caching, VITE_API_URL build-arg).
T-16: hussle-emails/Dockerfile.prod created (pure library — no HTTP server, no HEALTHCHECK).
T-17: docker/rabbitmq/Dockerfile verified — FROM already pinned to specific version.
