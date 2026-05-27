# External Integrations

**Analysis Date:** 2026-05-13

## APIs & External Services

**Authentication / Identity:**
- **AWS Cognito** (User Pool) — primary identity provider in production
  - SDK: `@aws-sdk/client-cognito-identity-provider` `^3.1000.0`
  - Provider implementation: `hussle-app-dispatch-api/src/auth/providers/cognitoProvider/` (`confirmUserCognito.ts`, `passwordChallenge.ts`, `resendCodeCognito.ts`)
  - Admin helpers: `hussle-app-dispatch-api/src/shared/utils/cognito/` (`addUserToGroup.ts`, `adminCreateUserInCognito.ts`, `adminSetUserPassword.ts`, `adminUpdateUserAttributes.ts`, `authenticateCognitoUser.ts`, `confirmCognitoUser.ts`, `confirmForgotPasswordCognito.ts`)
  - Auth env: `COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID`, `AWS_REGION`
  - Token issuance is custom JWT (see below) — Cognito is used for credential verification and user lifecycle.

- **In-house JWT** — access + refresh tokens, served as `HttpOnly` cookies
  - SDK: `jsonwebtoken` `^9.0.3`
  - Provider: `hussle-app-dispatch-api/src/auth/providers/jwtTokenProvider/` and `jwtProvider.ts`
  - Auth contract: `hussle-app-dispatch-api/src/auth/AUTH_CONTRACT.md`
  - Env: `JWT_SECRET`, `REFRESH_SECRET`
  - Frontend axios reads cookies (`withCredentials: true`) and handles 401 refresh in `hussle-app-dispatch-ui/src/utils/axios.ts`.

**Email:**
- **AWS SES** — primary email transport in production
  - SDK: `@aws-sdk/client-ses` `^3.1014.0`
  - Implementation: `hussle-app-dispatch-api/src/shared/notifications/sesNotificationService.ts` (builds MIME with nodemailer then sends `SendRawEmailCommand`)
  - Env: `SES_FROM_EMAIL`, `AWS_REGION`
- **SMTP (Mailpit / generic)** — used in dev and as fallback
  - SDK: `nodemailer` `^8.0.3`
  - Implementation: `hussle-app-dispatch-api/src/shared/notifications/smtpNotificationService.ts`
  - Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`
  - Dev container: `axllent/mailpit:latest` in `docker-compose.yml`
- **Console fallback** — `hussle-app-dispatch-api/src/shared/notifications/consoleNotificationService.ts`
- Service selection: `hussle-app-dispatch-api/src/shared/notifications/notificationServiceFactory.ts`
- **Email templates** — server-rendered React Email (`@react-email/components` `^0.0.36`) at `hussle-app-dispatch-api/src/shared/emails/`:
  - `carrierInvite/`, `carrierApproved/`, `carrierRejected/`, `carrierOnboardingComplete/`, `checkCall/`, `documentUploaded/`, `invitation/`, `invitationAccepted/`, `invoice/`, `settlement/`, `statusChange/`, `welcome/`, plus `layout/` and `shared/`.

**SMS:**
- **Twilio** — production SMS provider for driver/carrier prompts
  - Implementation: `hussle-app-dispatch-api/src/shared/notifications/twilioSmsService.ts` (calls `https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json` directly via `fetch` with HTTP Basic auth — no Twilio SDK npm dependency)
  - Env: `SMS_BACKEND=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
  - Persisted message ID column: `SmsPromptSchedule.twilioMessageSid` (Prisma schema)
- **Console fallback** — `hussle-app-dispatch-api/src/shared/notifications/consoleSmsService.ts` (selected when `SMS_BACKEND=console`)
- Driver-side outbound prompts driven by `hussle-app-dispatch-api/src/sms-prompts/` (scheduler + worker subscribers).

**Maps / Geocoding / Routing — AWS Location Service v2:**
- SDKs: `@aws-sdk/client-geo-maps` `^3.1041.0`, `@aws-sdk/client-geo-places` `^3.1041.0`, `@aws-sdk/client-geo-routes` `^3.1041.0`
- Aggregated provider: `hussle-app-dispatch-api/src/shared/providers/awsLocationProvider.ts` (geocoding, autocomplete, reverse geocoding, place details)
- Route calculation: `hussle-app-dispatch-api/src/shared/routing/awsRouteCalculator.ts` (`CalculateRoutesCommand`)
- Map style endpoint: `hussle-app-dispatch-api/src/maps/` exposes `/api/v1/maps/style.json` (used by `maplibre-gl` on the UI side — see `hussle-app-dispatch-ui/src/components/MapView/index.tsx` and `src/features/load/components/DispatchBoardPage/CommandCenterMap.tsx`)
- Places HTTP routes: `hussle-app-dispatch-api/src/places/`
- IFTA route lookup wires `GeoRoutesClient` directly: `hussle-app-dispatch-api/src/ifta/compositionRoot.ts`
- Env: `AWS_REGION`, `AWS_LOCATION_MAP_NAME`, `ROUTE_CALCULATOR_ENABLED`

**Load Boards — inbound ingestion from Chrome extension:**
- **DAT (`one.dat.com`, `power.dat.com`)** and **Amazon Relay (`relay.amazon.com`)** are scraped by the `dat-load-scraper/` Chrome extension and POSTed to the API.
- Extension manifest: `dat-load-scraper/src/static/manifest.json` (MV3, content scripts for DAT + Amazon Relay)
- API ingest module: `hussle-app-dispatch-api/src/load-board/` (`adapters/`, `mappers/equipmentTypeMap.ts` with `DAT_EQUIPMENT_MAP`, validators in `validators/loadBoardValidators.ts`)
- Extension-to-API auth: `ALLOWED_EXTENSION_IDS` env var allow-lists Chrome extension IDs.
- Search/intelligence layer over scraped loads: `hussle-app-dispatch-api/src/load-intel/` and `hussle-app-dispatch-ui/src/utils/api/intel/`.

**PDF generation:**
- **Puppeteer** headless Chromium (`puppeteer` `^24.40.0`)
- Browser pool: `hussle-app-dispatch-api/src/shared/providers/puppeteerBrowserPool.ts`
- Used by `hussle-app-dispatch-api/src/invoices/services/pdfGenerationService.ts` and the settlements module (`src/settlements/`).
- Client-side `@react-pdf/renderer` also present in the UI for on-screen PDF preview.

## Data Storage

**Databases:**
- **PostgreSQL 15** (Prisma ORM)
  - Schema: `hussle-app-dispatch-api/prisma/schema.prisma` (~40 models: `Organization`, `User`, `Membership`, `Invitation`, `AuditLog`, `Carrier`, `Contact`, `Driver`, `Vehicle`, `TruckExpense`, `Load`, `Stop`, `Place`, `LoadStatusHistory`, `CheckCall`, `AccessorialCharge`, `Invoice`, `Document`, `OrgSettings`, `CarrierNote`, `Customer`, `CustomerNotificationSettings`, `LoadNotificationOverride`, `LoadTrackingToken`, `NotificationLog`, `OnboardingSession`, `CarrierInviteToken`, `DriverAvailability`, `DriverScheduleOverride`, `DispatcherProfile`, `Expense`, `RecurringExpense`, `Settlement`, `SettlementLineItem`, `LoadStateMiles`, `Loan`, `LoanPayment`, `SmsPromptSchedule`, `ShortLink`)
  - Client: `@prisma/client` `^5.16.0`
  - Connection: `hussle-app-dispatch-api/src/config/database.ts`
  - Connection string: `DATABASE_URL` (e.g. `postgresql://postgres:postgres@hussle-app-postgres:5432/hussle_dispatch` in dev compose)
  - Migrations: `hussle-app-dispatch-api/prisma/migrations/`
  - Seed: `hussle-app-dispatch-api/prisma/seed.ts`
  - Dev container: `postgres:15-alpine` on `:5432`; admin UI `dpage/pgadmin4:latest`

- **Redis Stack 7.4** (ioredis client)
  - Client: `hussle-app-dispatch-api/src/shared/redisClient.ts`
  - SDK: `ioredis` `^5.4.1`
  - Env: `REDIS_URL`
  - Dev container: `redis/redis-stack:7.4.0-v2` on `:6379` (RedisInsight on `:8001`)
  - Used for ephemeral state (rate-limit counters, geo lookup cache, session bits — see `hussle-app-dispatch-api/src/shared/geoLookup.ts`, `geo/`)

**File Storage:**
- Pluggable provider in `hussle-app-dispatch-api/src/shared/storage/index.ts` selected by `STORAGE_BACKEND`:
  - `s3` -> `s3StorageProvider.ts` using `@aws-sdk/client-s3` `^3.600.0` + `@aws-sdk/s3-request-presigner` `^3.600.0`. Bucket: `S3_BUCKET`.
  - `local` -> `localStorageProvider.ts` writing under `STORAGE_LOCAL_PATH` (default `./storage`); served at `/api/v1/storage` via `localStorageRoutes.ts` (mounted in `src/app.ts` only when `STORAGE_BACKEND=local`).
- Presigned upload URLs: `hussle-app-dispatch-api/src/shared/s3Presign.ts`
- Documents module wires storage into `hussle-app-dispatch-api/src/documents/`.

**Caching:**
- Redis (see above) — application-level cache + rate limiting (`express-rate-limit` `^8.2.1`).

## Message Broker

- **RabbitMQ 3.13** with `rabbitmq_delayed_message_exchange` plugin (custom image `fleet-command/rabbitmq:3.13-delayed`, built from `docker/rabbitmq/`)
- Implementation: `hussle-app-dispatch-api/src/shared/messaging/rabbitMqEventBus.ts` (topic exchange `fleet-command.events`, delayed exchange `fleet-command.delayed`, max 3 retries via `x-death` header)
- Port abstraction: `hussle-app-dispatch-api/src/shared/messaging/eventBus.ts`
- In-memory variant for tests: `hussle-app-dispatch-api/src/shared/messaging/inMemoryEventBus.ts`
- Event registry: `hussle-app-dispatch-api/src/shared/messaging/eventMap.ts`
- Shared bus accessor: `hussle-app-dispatch-api/src/shared/messaging/sharedEventBus.ts`
- Bootstrap: `createRabbitMqEventBus(env.RABBITMQ_URL, logger)` in `hussle-app-dispatch-api/src/index.ts`
- Subscribers (consumers) registered as side-effect imports in `src/app.ts`:
  - `./audit` — audit log writer (`src/audit/`)
  - `./notifications` — notification dispatcher (`src/notifications/services/notificationSubscriber.ts`)
  - Document archive subscriber (`src/documents/services/documentArchiveSubscriber.ts`)
  - Carrier onboarding subscriber (`src/notifications/services/carrierOnboardingSubscriber.ts`)
  - Invoice readiness subscriber (`src/invoices/`)
  - SMS prompt scheduler + worker (`src/sms-prompts/`)
- Connection: `RABBITMQ_URL` (default `amqp://guest:guest@localhost:5672`); management UI exposed on `:15672` in dev.

## Authentication & Identity Flow

- Frontend: cookie-based session (HttpOnly access + refresh cookies). Axios interceptor in `hussle-app-dispatch-ui/src/utils/axios.ts` calls `/auth/token/refresh` on 401 and re-runs the queued request.
- API: auth routes mounted in `hussle-app-dispatch-api/src/app.ts` via `rootAuthRouter` (composition in `src/auth/index.ts`, providers in `src/auth/providers/`, services in `src/auth/services/{auth,invite,membership,orgs,previewToken,subscription,user}/`).
- Tokens: signed locally with `jsonwebtoken`; credential verification delegated to Cognito in prod.
- API keys (programmatic access): `hussle-app-dispatch-api/src/api-keys/` mounted at `/api/v1/api-keys`; persisted as `OrgApiKey` (Prisma model).
- Driver / Carrier portals (no-account access via tokenized links):
  - Driver portal: `hussle-app-dispatch-api/src/driver-portal/` (mounted at `/api/v1/driver-portal`)
  - Carrier portal: `hussle-app-dispatch-api/src/carrier-portal/` (mounted at `/api/v1/carrier-portal`)
  - Tokens stored as `LoadTrackingToken` and `CarrierInviteToken` (Prisma)
  - Short links generated via `hussle-app-dispatch-api/src/short-links/` and resolved at the public `/s/:slug` route in `src/app.ts` (no auth middleware).

## Payment Processors

- **None integrated.** No Stripe / Braintree / Adyen SDKs in any package. `paymentTerms` / `paymentTermsDays` fields on `Customer` are net-terms metadata, not gateway integration. Invoicing currently produces PDF artifacts via Puppeteer; settlement reconciliation is internal.

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry / Rollbar / Datadog SDK in any `package.json`).

**Logs:**
- API: structured logger in `hussle-app-dispatch-api/src/shared/utils/logger.ts`; HTTP access logs via `morgan` `combined` (skipped in development).
- UI: notifications via `notistack`; no remote log shipping.
- Health check endpoint: `GET /api/health` in `hussle-app-dispatch-api/src/app.ts` (pings Postgres + Redis, returns `200` healthy / `503` degraded).

**Audit:**
- Application-level audit trail: `hussle-app-dispatch-api/src/audit/` writes to the `AuditLog` Prisma model.

## CI/CD & Deployment

**Hosting:**
- Hetzner Cloud via Dokploy. Terraform / Ansible code lives in `hussle-app-dispatch-infra/` and `mocho-infra-modules/`. Repo-root `Makefile` orchestrates `bootstrap`, `tf-plan`, `tf-apply`, `deploy`, `health-check`, secret rotation (Hetzner Cloud, Cloudflare).
- Production domains: `api.fleetcommand.app` (prod) and `api-staging.fleetcommand.app` (staging) — see `dat-load-scraper/package.json` build scripts.

**CI Pipeline:**
- Jenkins: `Jenkinsfile.build`, `Jenkinsfile.deploy` at repo root.
- Compose files for prod/build orchestration: `docker-compose-build.yml`, `docker-compose-prod.yml`, `docker-compose.local.yml`.

## Environment Configuration

**Required env vars (production):** see `STACK.md` § Configuration. Critical: `DATABASE_URL`, `JWT_SECRET`, `REFRESH_SECRET`, `COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID`, `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SES_FROM_EMAIL`, `STORAGE_BACKEND`, `SMS_BACKEND`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.

**Secrets location:**
- API: `hussle-app-dispatch-api/.env` (mounted into container via `env_file` in `docker-compose.yml`; existence noted only — contents not read).
- Infrastructure secrets: managed via `Makefile` targets `secrets-init`, `secrets-rotate-hcloud`, `secrets-rotate-cloudflare` (storage backend defined under `hussle-app-dispatch-infra/`).
- The `dat-load-scraper/CLAUDE.md` notes a known issue: hardcoded AWS credentials in `dat-load-scraper/src/utils/s3.ts` — must be rotated and externalized.

## Webhooks & Callbacks

**Incoming (public — no app auth):**
- `GET /api/health` — health probe (`hussle-app-dispatch-api/src/app.ts`)
- `GET /s/:slug` — public short-link redirect handled by `hussle-app-dispatch-api/src/short-links/` (mounted at `app.use('/s', shortLinksRouter)`)
- Driver-portal and carrier-portal endpoints accept tokenized URLs (no session cookie required) — `hussle-app-dispatch-api/src/driver-portal/`, `hussle-app-dispatch-api/src/carrier-portal/`
- Chrome-extension load ingest under `/api/v1/load-board` — origin gated by `ALLOWED_EXTENSION_IDS`

**Outgoing:**
- Twilio SMS (REST): `https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json` (`hussle-app-dispatch-api/src/shared/notifications/twilioSmsService.ts`)
- AWS SES (SDK): `SendRawEmailCommand` (`hussle-app-dispatch-api/src/shared/notifications/sesNotificationService.ts`)
- AWS Cognito (SDK): user create/auth/group/password commands (`hussle-app-dispatch-api/src/shared/utils/cognito/`)
- AWS S3 (SDK): object put/get/delete + presigned URLs (`hussle-app-dispatch-api/src/shared/storage/s3StorageProvider.ts`, `src/shared/s3Presign.ts`)
- AWS Location (SDK): Geo Places, Geo Routes, Geo Maps (`hussle-app-dispatch-api/src/shared/providers/awsLocationProvider.ts`, `src/shared/routing/awsRouteCalculator.ts`)
- No outbound HTTP webhook dispatch system (no third-party webhook fan-out is implemented).

---

*Integration audit: 2026-05-13*
