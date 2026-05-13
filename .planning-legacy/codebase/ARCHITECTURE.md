# Architecture

## Package Topology

| Package | Type | Stack | Depends On | Depended By |
|---------|------|-------|------------|-------------|
| `hussle-app-dispatch-api/` | REST API | Express, Prisma, Redis, RabbitMQ, AWS SDK | PostgreSQL, Redis, RabbitMQ, `hussle-emails` | `hussle-app-dispatch-ui`, `extension` |
| `hussle-app-dispatch-ui/` | SPA | React 18, MUI v5, Redux Toolkit, Redux Saga, Vite | `hussle-app-dispatch-api` | -- |
| `hussle-emails/` | Library | React Email, `@react-email/components` | -- | `hussle-app-dispatch-api` |
| `extension/` | Chrome Extension | TypeScript, esbuild | `hussle-app-dispatch-api` (planned) | -- |

## Technology Stack

- **Runtime:** Node.js (npm, no workspaces -- independent `package.json` per package)
- **Database:** PostgreSQL 15 (Prisma ORM), Redis 7 (ioredis)
- **Messaging:** RabbitMQ 3 (amqplib) for domain event bus
- **Auth:** AWS Cognito + JWT (httpOnly cookies), cookie-based session
- **Cloud:** AWS (S3, SES, Location Service for geocoding/routing)
- **Email:** React Email templates rendered server-side, delivered via SES or SMTP (Mailpit for dev)
- **SMS:** Twilio (optional, console fallback)

## Data Flow

```
Browser (dispatch-ui :5173)
   |  Axios (httpOnly cookie auth)
   v
Express API (:3001)  -->  PostgreSQL (:5432)   Prisma ORM
   |                 -->  Redis (:6379)         Caching (load intel, CPM scores)
   |                 -->  RabbitMQ (:5672)      Async domain events
   |                 -->  AWS SES / Mailpit     Transactional email (hussle-emails templates)
   |                 -->  AWS Location Service  Address search, route distance
   |
Chrome Extension (DAT scraping) --> API (planned integration)
```

Requests flow: UI dispatches Redux action -> Saga calls Axios -> API controller -> mapper -> service -> repository -> Prisma -> PostgreSQL. Responses flow back through transformer -> JSON response -> Saga updates entity slice.

## Entry Points

| Package | Dev Command | Main Entry | Port |
|---------|-------------|------------|------|
| `hussle-app-dispatch-api` | `npm run dev` | `src/index.ts` -> `src/app.ts` | 3001 |
| `hussle-app-dispatch-ui` | `npm run dev` (Vite) | `src/index.tsx` -> `src/App.tsx` | 5173 |
| `hussle-emails` | `npx email dev` | `src/index.ts` (barrel exports) | 3000 |
| `extension` | `npm run watch` (esbuild) | `background/service-worker.ts`, `content/dat-scraper.ts`, `popup/popup.ts` | -- |

## Infrastructure (docker-compose.yml)

PostgreSQL, Redis, RabbitMQ, Mailpit (SMTP :1025, UI :8025), pgAdmin (:5050). All services health-checked. The API container volume-mounts `hussle-emails/` for server-side template rendering.

## Key Patterns

- **API architecture:** Modular monolith with per-feature composition roots, port/adapter DI, domain events via RabbitMQ
- **API routes:** Versioned under `/api/v1/` (carriers, loads, drivers, vehicles, invoices, places, etc.)
- **Frontend state:** Dual-slice pattern (page slice for UI state + entity slice for normalized data), Redux Saga for all async
- **Frontend styling:** MUI `sx` prop exclusively, Plus Jakarta Sans font
- **Forms:** Formik + Yup, form fields receive `formik` prop
- **API client:** Axios with 401 refresh interceptor, `withCredentials: true`
- **Error handling:** Typed `CustomError` hierarchy (API), ErrorBoundary + saga catch (UI)
