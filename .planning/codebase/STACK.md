# Technology Stack

**Analysis Date:** 2026-05-13

Monorepo with three independent npm packages (no root `package.json`, no workspaces tooling — managed by `Makefile` and `docker-compose.yml` at repo root):

- `hussle-app-dispatch-api/` — Express + Prisma backend
- `hussle-app-dispatch-ui/` — React + Vite frontend
- `dat-load-scraper/` — Chrome extension (Manifest V3) for DAT / Amazon Relay load board ingestion

The `mocho-ui/` package referenced in the repo-root `CLAUDE.md` is no longer present as a sibling directory. It now lives inlined at `hussle-app-dispatch-ui/src/mocho/` and is resolved via Vite path aliases (`@mocho/ui/*` -> `src/mocho/*`). A published `@mocho/common` is consumed by the API as a versioned npm dependency.

The `hussle-emails/` package referenced in the repo-root `CLAUDE.md` is no longer a separate directory either. Transactional email templates now live inside the API at `hussle-app-dispatch-api/src/shared/emails/` and use `@react-email/components`.

## Languages

**Primary:**
- TypeScript 5.5 (`hussle-app-dispatch-api/`, target Node)
- TypeScript ~5.9 (`hussle-app-dispatch-ui/`, target browser via Vite)
- TypeScript 4.8 (`dat-load-scraper/`, target Chrome MV3 / Webpack 5)

**Secondary:**
- TSX (React) — used in both the UI app and inside API email templates (`hussle-app-dispatch-api/src/shared/emails/**/*.tsx`)
- JSON — Prisma schema, Postman collection, tsconfig

## Runtime

**Environment:**
- Node.js (no `.nvmrc` detected in any package). `hussle-app-dispatch-api/package.json` pins `@types/node` to `^20.14.10` — Node 20 is the implied target. `hussle-app-dispatch-ui/package.json` includes `@types/node` `^24.10.1` for Vite tooling.
- Browser (Chrome) for the UI bundle and for the `dat-load-scraper` extension (Manifest V3 service worker).

**Package Manager:**
- npm (per-package `package-lock.json` files committed in each package; no `yarn.lock` / `pnpm-lock.yaml`)
- No monorepo orchestrator (Nx / Turborepo / npm workspaces) — packages installed and built independently.
- Lockfile: present in all three packages.

## Frameworks

### `hussle-app-dispatch-api/` — Express modular monolith

**Core:**
- `express` `^4.19.2` — HTTP server
- `express-async-errors` `^3.1.1` — forward async errors to centralized handler (`src/shared/middleware/errorHandler.ts`)
- `@prisma/client` `^5.16.0` + `prisma` `^5.16.0` (devDep) — PostgreSQL ORM (`prisma/schema.prisma`)
- `cors` `^2.8.5`, `helmet` `^7.1.0`, `cookie-parser` `^1.4.7`, `morgan` `^1.10.0`, `express-rate-limit` `^8.2.1` — standard middleware
- `ioredis` `^5.4.1` — Redis client (`src/shared/redisClient.ts`)
- `amqplib` `^0.10.9` — RabbitMQ event bus (`src/shared/messaging/rabbitMqEventBus.ts`)
- `jsonwebtoken` `^9.0.3` — JWT signing for access / refresh tokens
- `yup` `^1.4.0` — request validators (`src/<feature>/validators/`)
- `react` `^19.2.4` + `react-dom` `^19.2.4` — used **only** for rendering React Email templates server-side (not for the UI)
- `@react-email/components` `^0.0.36` — transactional email components
- `nodemailer` `^8.0.3` — SMTP transport + MIME builder used by the SES sender
- `puppeteer` `^24.40.0` — headless Chromium for invoice / settlement PDF generation (`src/shared/providers/puppeteerBrowserPool.ts`)
- `decimal.js` `^10.4.3` — money math; serialized as strings in JSON responses (`src/app.ts` `decimalReplacer`)
- `node-cron` `^4.2.1` — scheduled jobs
- `archiver` `^7.0.1` — zip archive generation for document export
- `slugify` `^1.6.6`, `uuid` `^9.0.1`, `lodash` `^4.17.23`
- Turf geo-libraries (`@turf/helpers`, `@turf/length`, `@turf/line-slice`, `@turf/line-split`, `@turf/line-intersect`, `@turf/boolean-point-in-polygon`, all `^7.3.4`) for route geometry calculations
- `@mocho/common` `^1.0.40` — shared error classes (`BadRequestError`, etc.) consumed by repositories and services

**Testing:**
- `jest` `^29.7.0` + `ts-jest` `^29.2.2` — unit and integration tests (`src/**/__tests__/**`)

**Build/Dev:**
- `ts-node-dev` `^2.0.0` — hot-reload dev server (`npm run dev`)
- `tsc` + `tsc-alias` `^1.8.16` — production build (`npm run build`)
- `tsconfig-paths` `^4.2.0` — runtime path alias resolution

### `hussle-app-dispatch-ui/` — React 18 SPA

**Core:**
- `react` `^18.3.1` + `react-dom` `^18.3.1`
- `vite` `^7.3.1` + `@vitejs/plugin-react` `^5.1.1` — dev server and bundler (`vite.config.ts`)
- `@mui/material` `^5.15.21`, `@mui/system`, `@mui/lab`, `@mui/icons-material`, `@mui/x-date-pickers`, `@mui/base` — MUI v5 component system
- `@emotion/react` `^11.11.4` + `@emotion/styled` `^11.11.5` — MUI styling engine
- `@ant-design/icons` `^5.3.7` — secondary icon set
- `@reduxjs/toolkit` `^2.2.6` + `react-redux` `^9.1.2` — client state (`src/store/`)
- `redux-saga` `^1.3.0` — async side-effect orchestration; thunks are explicitly disabled
- `redux-saga-test-plan` `^4.0.6` (devDep) — saga testing
- `normalizr` `^3.6.2` — entity normalization for Redux slices
- `formik` `^2.4.6` + `yup` `^1.4.0` — forms and validation
- `axios` `^1.7.2` — HTTP client (`src/utils/axios.ts`) with cookie-based auth + 401 refresh interceptor
- `@tanstack/react-query` `^5.51.3`, `@tanstack/react-table` `^8.19.3`, `@tanstack/react-virtual` `^3.8.3` — query/data tooling
- `ag-grid-community` + `ag-grid-react` `^32.2.0` — data grids (wrapped by `NewDataGrid` in `src/mocho/components`)
- `react-router` + `react-router-dom` `^6.24.1` — routing
- `maplibre-gl` `^5.20.2` + `react-map-gl` `^8.1.0` — maps (consumes AWS-Location-backed style JSON proxied by the API at `/api/v1/maps/style.json`)
- `@react-pdf/renderer` `^4.3.2` — client-side PDF rendering
- `@tiptap/react` `^3.9.1` + extensions (link, image, placeholder, starter-kit) — rich text editor (`RichTextEditorField`)
- `react-apexcharts` `^1.4.1` — charts
- `react-dnd` `^16.0.1`, `react-dropzone` `^14.2.3`, `react-csv` `^2.2.2`, `react-slick` + `slick-carousel`, `react18-input-otp`, `react-number-format`, `react-device-detect`, `react-intl`, `framer-motion` `^11.3.4`
- `date-fns` `^3.6.0` (preferred) + `moment` `^2.30.1` (legacy; CLAUDE.md prohibits new usage)
- `notistack` `^3.0.1` — snackbar/toast notifications
- `dompurify` `^3.2.5` — HTML sanitization
- `simplebar-react` `^3.2.6` — custom scrollbars
- `lucide-react` `^0.577.0` — additional icons
- `lodash` `^4.17.21`, `chance` `^1.1.12`, `history` `^5.3.0`
- `@fontsource/plus-jakarta-sans` `^5.2.8` — font

> Note: `styled-components` `^6.1.11` is still listed as a dependency but is banned for new code per `hussle-app-dispatch-ui/CLAUDE.md`. Existing files are legacy. `npm`, `install`, `crypto`, and `web-vitals` appear in `dependencies` but look accidental — see CONCERNS.

**Testing:**
- `jest` `^30.2.0` + `ts-jest` `^29.4.6` + `jest-environment-jsdom` `^30.2.0`
- `@testing-library/react` `^16.3.2`, `@testing-library/user-event` `^14.6.1`, `@testing-library/jest-dom` `^6.9.1`
- `msw` `^2.12.10` — Mock Service Worker for HTTP mocking
- `@playwright/test` `^1.59.1` — end-to-end tests (`e2e/`, config `playwright.config.ts`)
- `identity-obj-proxy` `^3.0.0` — CSS module mocks

**Build/Dev:**
- `vite` (dev server on `:5173`; build via `tsc -b && vite build`)
- `tsc` — type-checking against `tsconfig.app.json`

### `dat-load-scraper/` — Chrome Extension (Manifest V3)

**Core:**
- `react` `^18.2.0` + `react-dom` `^18.2.0` — popup UI only
- `@reduxjs/toolkit` `^1.9.0` + `redux` `^4.2.0` — extension state
- `redux-saga` `^1.2.1`, `redux-thunk` `^2.4.2`, `redux-logger` `^3.0.6`
- `formik` `^2.2.9`
- `lodash` `^4.17.21`
- `typescript` `^4.8.4`
- Manifest V3 service worker + content scripts (`src/static/manifest.json`)
- AWS SDK v3 clients (`@aws-sdk/client-s3`, `@aws-sdk/client-sqs`) — historical / referenced in `src/utils/s3.ts`. Note: hardcoded credentials called out in `dat-load-scraper/CLAUDE.md` as a known issue.

**Build/Dev:**
- `webpack` `^5.74.0` + `webpack-cli` `^4.10.0` + `webpack-merge` `^5.8.0`
- `ts-loader` `^9.4.1`, `style-loader`, `css-loader`, `postcss-loader`
- `clean-webpack-plugin`, `copy-webpack-plugin`, `html-webpack-plugin`
- `cross-env` `^7.0.3` — env injection for staging/prod build targets
- Configs: `webpack.common.js`, `webpack.dev.js`, `webpack.prod.js`

**Testing:**
- `jest` `^29.7.0` + `ts-jest` `^29.1.5` + `jest-environment-jsdom` `^29.7.0`
- No lint/format scripts configured.

## Lint & Format

| Package | Linter | Formatter | Architecture rules |
|---------|--------|-----------|--------------------|
| `hussle-app-dispatch-api/` | ESLint `^10.0.2` flat config (`eslint.config.mjs`) + `typescript-eslint` `^8.56.1` | Prettier `^3.8.1` (no `.prettierrc` at API root — uses defaults) | `dependency-cruiser` `^16.10.4` via `.dependency-cruiser.cjs` (rules: `no-prisma-in-services`, `no-repo-implementations-in-services`, `no-services-to-controllers`, `no-circular`) |
| `hussle-app-dispatch-ui/` | ESLint `^9.39.3` flat config (`eslint.config.js`) + `typescript-eslint` `^8.56.1` + `eslint-plugin-react-hooks` + `eslint-plugin-react-refresh` | Prettier `^3.8.1` (`.prettierrc`: 2 spaces, 100 print width, single quotes, trailing commas all) | `dependency-cruiser` `^17.3.8` |
| `dat-load-scraper/` | none configured | none configured | none |

`eslint-config-prettier` is used in both API and UI to disable conflicting style rules.

## Build Outputs

- API: `hussle-app-dispatch-api/dist/` (compiled JS, entry `dist/index.js`).
- UI: `hussle-app-dispatch-ui/dist/` (Vite static bundle served by nginx in prod — `nginx.conf` present).
- Extension: `dat-load-scraper/dist/` (Webpack bundle loaded as unpacked extension).

## Configuration

**API environment variables** (defined in `hussle-app-dispatch-api/src/config/env.ts`, validated at import-time via `requireEnv` / `requireInProd`):

| Var | Purpose | Required in prod |
|-----|---------|------------------|
| `PORT` | HTTP port (default `3001`) | no |
| `NODE_ENV` | `development` / `production` / `test` | no |
| `ENVIRONMENT_NAME` | `local` / `dev` / `staging` / `prod` | no |
| `DATABASE_URL` | PostgreSQL connection (Prisma) | **yes (all envs)** |
| `REDIS_URL` | Redis connection (default `redis://localhost:6379`) | no |
| `RABBITMQ_URL` | AMQP connection (default `amqp://guest:guest@localhost:5672`) | no |
| `JWT_SECRET` | Access-token signing key | **yes (all envs)** |
| `REFRESH_SECRET` | Refresh-token signing key | **yes (all envs)** |
| `COGNITO_CLIENT_ID`, `COGNITO_USER_POOL_ID` | AWS Cognito user pool | prod only |
| `S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | S3 + SDK auth | prod only |
| `SES_FROM_EMAIL` | SES sender address | prod only |
| `STORAGE_BACKEND` | `local` or `s3` (selects provider in `src/shared/storage/index.ts`) | prod only |
| `STORAGE_LOCAL_PATH` | Local storage root (default `./storage`) | no |
| `ROUTE_CALCULATOR_ENABLED` | Toggle AWS Location route calculator | no |
| `AWS_LOCATION_MAP_NAME` | Map name for `/api/v1/maps/style.json` | no |
| `FRONTEND_URL` | Used for email/SMS links (default `http://localhost:5173`) | no |
| `TRACKING_BASE_URL` | Public base for driver tracking links | no |
| `PUBLIC_SHORT_BASE_URL` | Base for `/s/:slug` short-link redirects | no |
| `ALLOWED_EXTENSION_IDS` | Comma-separated Chrome extension IDs allowed to call load-board ingest | no |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE` | SMTP transport (Mailpit on `:1025` in dev) | no |
| `SMS_BACKEND` | `console` or `twilio` | prod only |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Twilio REST credentials | prod only |

The repo-root `docker-compose.yml` mounts `./hussle-app-dispatch-api/.env` into the API container via `env_file`. A `.env` file is present at the API root (existence noted only — contents not read).

**UI environment variables** (Vite, prefixed with `VITE_`, consumed in `hussle-app-dispatch-ui/src/config.ts`):

- `VITE_API_URL` (default `http://localhost:3001`)

**Extension build-time variables** (`dat-load-scraper/package.json` scripts via `cross-env`):

- `API_URL` — switched between `https://api-staging.fleetcommand.app` (staging) and `https://api.fleetcommand.app` (prod).

## Platform Requirements

**Development:**
- Docker + Docker Compose for local stack (`docker-compose.yml`, `docker-compose.local.yml`)
- Local services brought up by compose:
  - `hussle-app-postgres` — `postgres:15-alpine` on `:5432` (db `hussle_dispatch`)
  - `hussle-app-redis` — `redis/redis-stack:7.4.0-v2` on `:6379` (RedisInsight on `:8001`)
  - `hussle-app-rabbitmq` — custom image `fleet-command/rabbitmq:3.13-delayed` (built from `docker/rabbitmq/`, includes `rabbitmq_delayed_message_exchange` plugin) on `:5672` / management UI `:15672`
  - `dispatch-ui` — Vite on `:5173`
  - `dispatch-api` — Express on `:3001`
  - `pgadmin` — `dpage/pgadmin4:latest`
  - `mailpit` — `axllent/mailpit:latest` — local SMTP catcher
- Node 20+ assumed for the API; Node 18+ for the UI Vite tooling.

**Production:**
- API container built from `hussle-app-dispatch-api/Dockerfile.prod`
- UI container built from `hussle-app-dispatch-ui/Dockerfile.prod` (served via `nginx.conf`)
- Deployed via Dokploy / Hetzner Cloud — infrastructure code in `hussle-app-dispatch-infra/` and `mocho-infra-modules/` (Terraform + Ansible) wired through repo-root `Makefile`
- CI: `Jenkinsfile.build`, `Jenkinsfile.deploy` at repo root

---

*Stack analysis: 2026-05-13*
