<!-- refreshed: 2026-05-13 -->
# Architecture

**Analysis Date:** 2026-05-13

## System Overview

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                       Browser (React 18 + Vite)                          │
│                  `hussle-app-dispatch-ui/`                               │
├────────────────────────────┬─────────────────────────────────────────────┤
│   Internal Dispatch SPA    │     Public Carrier / Driver Portals         │
│   (App.tsx layout)         │     (PortalShell layout)                    │
│   `src/features/<f>/`      │     `src/features/carrier-portal/`          │
│                            │     `src/features/driver-portal/`           │
└────────────┬───────────────┴─────────────┬───────────────────────────────┘
             │ axios (cookies, JWT)        │
             ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                Express API — Modular Monolith                            │
│              `hussle-app-dispatch-api/src/app.ts`                        │
│                                                                          │
│   Feature modules (per-module DI):                                       │
│   carriers/  carrier-portal/  loads/  invoices/  settlements/            │
│   drivers/   driver-portal/   vehicles/  customers/ contacts/            │
│   places/    documents/       notifications/  audit/  expenses/          │
│   ifta/      load-board/      load-intel/  dashboard/ settings/          │
│   auth/      api-keys/        maps/ short-links/ sms-prompts/            │
│                                                                          │
│   Each module: routes → controllers → services → repositories            │
│                                                                          │
│   Wiring: per-module `compositionRoot.ts` + module `index.ts`            │
└─────┬──────────────────────┬─────────────────────┬───────────────────────┘
      │ Prisma               │ ioredis             │ amqplib
      ▼                      ▼                     ▼
┌────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐
│  PostgreSQL    │  │  Redis           │  │  RabbitMQ                  │
│  (Prisma ORM)  │  │  (cache, geo,    │  │  (domain event bus —       │
│  schema.prisma │  │   short-link)    │  │   `EventMap` typed events) │
└────────────────┘  └──────────────────┘  └────────────────────────────┘
                                                       │
                                                       ▼
                                          ┌────────────────────────────┐
                                          │ Subscribers (side-effects) │
                                          │ - notificationSubscriber   │
                                          │ - carrierSubscriber        │
                                          │ - carrierComplianceSubs.   │
                                          │ - auditSubscriber          │
                                          │ - invoiceReadinessSubs.    │
                                          │ - documentArchiveSubs.     │
                                          │ - carrierOnboardingSubs.   │
                                          └────────────────────────────┘
```

## Monorepo Layout

Two active TypeScript packages plus infra workspace:

- `hussle-app-dispatch-api/` — Express + Prisma + Redis + RabbitMQ backend (modular monolith).
- `hussle-app-dispatch-ui/` — React 18 + Vite SPA (internal dispatch app + public portals).
- `hussle-app-dispatch-infra/` — Terraform/Ansible/Dokploy infrastructure (out of scope for app architecture).

Notes:
- Transactional email templates live **inside the API package** at `hussle-app-dispatch-api/src/shared/emails/`; there is no separate `hussle-emails/` workspace at the repo root.
- There is no separate `extension/` Chrome-extension workspace at the repo root; the DAT load-scraper tooling lives under `dat-load-scraper/`.

## Component Responsibilities

| Component | Responsibility | File / Path |
|-----------|----------------|-------------|
| API startup | Boot Redis, RabbitMQ bus, Prisma, mount Express app, graceful shutdown | `hussle-app-dispatch-api/src/index.ts` |
| Express app | Security middleware, JSON body parsing, route mounting, error handler | `hussle-app-dispatch-api/src/app.ts` |
| Feature module router | Mounted on `/api/v1/<feature>` | e.g. `src/carriers/routes/carrierRoutes.ts` |
| Per-module composition root | Wires repos → services → controllers + subscribers | e.g. `src/carriers/compositionRoot.ts` |
| Domain event bus (prod) | RabbitMQ-backed pub/sub typed by `EventMap` | `src/shared/messaging/rabbitMqEventBus.ts` |
| Domain event bus (test) | In-memory implementation of same contract | `src/shared/messaging/inMemoryEventBus.ts` |
| Shared event bus singleton | Process-wide singleton used by module index files | `src/shared/messaging/sharedEventBus.ts` |
| Centralized error handler | Maps typed errors → JSON; logs unknown | `src/shared/middleware/errorHandler.ts` |
| Auth middleware | `requireAuth`, `requireRole(roles[])` | `src/middleware/auth.ts` |
| API auth (alt) | API-key + session middleware | `src/shared/middleware/apiKeyAuth.ts`, `sessionOrApiKeyAuth.ts` |
| Validation middleware | Yup schema runner | `src/shared/middleware/validateRequest.ts` |
| Frontend store | Redux Toolkit store + saga middleware | `hussle-app-dispatch-ui/src/store/index.ts` |
| Frontend root reducer | `{ pages, entities, auth }` shape | `hussle-app-dispatch-ui/src/store/reducers/index.ts` |
| Frontend root saga | `all([...feature watchers])` | `hussle-app-dispatch-ui/src/store/sagas/rootsaga.ts` |
| Axios client | Cookie-auth, 401 → refresh queue, logout fallback | `hussle-app-dispatch-ui/src/utils/axios.ts` |
| Router composition | `createBrowserRouter` + per-feature route modules | `hussle-app-dispatch-ui/src/routes/index.tsx` |
| App shell | `ThemeCustomization → Locales → Notistack → Outlet + ModalManager + DrawerManager` | `hussle-app-dispatch-ui/src/App.tsx` |

## Pattern Overview

**Overall:** Feature-organized modular monolith (API) + feature-organized React SPA.

**Key Characteristics:**
- API: hexagonal-style per-feature modules — controllers → services → ports → repositories — wired by per-module `compositionRoot.ts` factories that accept shared deps (`prisma`, `eventBus`, `logger`).
- API: cross-module communication is via the typed RabbitMQ event bus (`EventMap`), never direct service-to-service imports.
- API: shared infrastructure (errors, middleware, messaging, scoring, prisma client) lives under `src/shared/`.
- UI: feature folders under `src/features/<feature>/` each own their `pages/`, `components/`, `routes/`, `store/{reducers,sagas,selectors}/`, and `validators/`.
- UI: dual-slice Redux entity pattern — every CRUD entity has a **page slice** (UI state, loading flags, query) AND an **entity slice** (`createEntityAdapter` normalized data).
- UI: all async side effects flow through Redux Saga; thunks are disabled in the store config.
- Both: TypeScript strict, Airbnb-derived style, no `any`/`as`/`!`, no `console.log`, no thrown generic `Error`.

## Layers (API)

**routes/** — Express `Router` factories. Receive a fully-wired controllers object, map endpoint to `requireAuth`/`requireRole`/`validateRequest` middleware + controller. Example: `src/carriers/routes/carrierRoutes.ts`.

**controllers/** — Thin orchestrators. Use `mappers/` to translate `Request` → service input, call service, use `transformers/` to shape response, dispatch any returned `events` fire-and-forget. Never touch `req.body` directly. Example: `src/carriers/controllers/carrierController.ts`.

**services/** — Business logic and business rules. Pure functions or factory closures that depend on injected port interfaces (e.g. `CarrierRepoPort`, `CarrierApprovalPort`, `EventBus`, `Logger`). Return `{ data, events[] }` shape where events get published by the controller. Examples: `src/carriers/services/carrierService.ts`, `carrierApprovalService.ts`, `carrierInviteService.ts`.

**repositories/** — Implement port interfaces against Prisma. Accept `PrismaClient | PrismaTransaction` so they can run inside `$transaction` callbacks. Examples: `src/carriers/repositories/carrierRepositoryPrisma.ts`, `carrierStatsQueryPrisma.ts`, `carrierAuditPortPrisma.ts`.

**validators/** — Yup schemas validating `req.params/body/query` format only. Run as middleware via `validateRequest()` before the controller. Examples: `src/carriers/validators/carrierValidators.ts`, `approvalValidators.ts`.

**types/** — Port interfaces, domain types, typed inputs. Examples: `src/carriers/types/carrierTypes.ts`, `approvalTypes.ts`, `onboardingDetailTypes.ts`.

**services/<feature>Subscriber.ts** — RabbitMQ subscribers for cross-module side effects (notifications, audit, compliance flag updates, invoice readiness). Initialized from the module's `index.ts` and bound to a queue group. Examples: `src/carriers/services/carrierSubscriber.ts`, `carrierComplianceSubscriber.ts`, `src/notifications/services/notificationSubscriber.ts`, `carrierOnboardingSubscriber.ts`.

**compositionRoot.ts (per module)** — `createXxxModule({ prismaClient, eventBus, logger, ... })` builds repos, services, controllers and returns `{ controllers, initializeSubscriber? }`. Example: `src/carriers/compositionRoot.ts`.

**index.ts (per module)** — Singleton wiring: imports shared singletons (`prisma`, `sharedEventBus`, `logger`), calls the module factory, fires subscribers, and exports the `<feature>Router` consumed by `src/app.ts`. Example: `src/carriers/index.ts`.

## Layers (UI)

**features/`<feature>`/pages/** — Page-level components (e.g. `CarrierListPage/index.tsx`, `CarrierDetailPage/index.tsx`, `CreateCarrierPage/index.tsx`). Wrapped in `PageWrapper`. Dispatch fetch actions on mount, select data, compose feature components.

**features/`<feature>`/components/** — Reusable components for the feature. Page-local components live under `components/<PageName>/`; cross-page shared components (drawers, KPI bars) live directly under `components/`.

**features/`<feature>`/store/reducers/** — Two slices per entity: `<feature>EntitySlice.ts` (via `createEntityAdapter`) + `<feature>PageSlice.ts` (UI state). Optional sub-slices like `carrierNotesSlice.ts`.

**features/`<feature>`/store/sagas/** — One file per operation (`createCarrierSaga.ts`, `fetchCarriersSaga.ts`, `updateCarrierSaga.ts`, ...) + a watcher (`carrierSagasWatcher.ts`) registering `takeLatest` for each request action.

**features/`<feature>`/store/selectors/** — Memoized selectors via `reselect`'s `createSelector`. Examples: `features/carrier/store/selectors/carrierSelectors.ts`.

**features/`<feature>`/routes/`<Feature>`Routes.tsx** — A `RouteObject` (or array of them) merged into the top-level router. Example: `features/carrier/routes/carrierRoutes.tsx`.

**features/`<feature>`/validators/** — Yup schemas, with form value types derived via `InferType<typeof schema>`.

**features/ui/** — Global modal/drawer registries (`modalRegistry.ts`, `drawerRegistry.ts`), `uiSlice`, `NotificationBridge`. `ModalManager`/`DrawerManager` render active popups from Redux state.

## Data Flow

### Primary API Request Path (typical write)

1. Client sends `POST /api/v1/carriers` with HttpOnly auth cookie. (`hussle-app-dispatch-ui/src/utils/api/...` via `utils/axios.ts`.)
2. Express receives in `createApp` and routes to `carriersRouter` (`src/app.ts:127`).
3. Router applies middleware: `requireAuth` → `requireRole([ADMIN, DISPATCHER])` → `validateRequest(createCarrierValidator)` (`src/carriers/routes/carrierRoutes.ts:41-47`).
4. Controller `controllers.createCarrier` runs: mapper translates `req` → service input (`src/carriers/controllers/mappers/`).
5. Service `createCarrierService(input, deps)` executes business rules, calls `carrierRepository.create(...)` (`src/carriers/services/carrierService.ts`).
6. Service returns `{ data, events: [{ type: 'carrier.invited', payload }] }`.
7. Controller publishes events via `eventBus.publish(...)` fire-and-forget.
8. Transformer shapes service result → JSON response; centralized `decimalReplacer` ensures `Decimal.js` → string serialization (`src/app.ts:47-52`).
9. `express-async-errors` forwards any thrown `CustomError` subclass → `errorHandler` → JSON error envelope.

### Domain Event / Side-Effect Flow

1. `createApp` is invoked from `src/index.ts` after `createRabbitMqEventBus(env.RABBITMQ_URL, logger)` (`src/index.ts:13`).
2. Each module's `index.ts` imports `sharedEventBus` from `src/shared/messaging/sharedEventBus.ts` and initializes its subscribers (e.g. `carriersModule.initializeSubscriber()` in `src/carriers/index.ts`).
3. Subscriber calls `eventBus.subscribe('carrier.onboarding.approved', 'carriers-onboarding', handler)` — the second arg is the durable queue group ensuring at-least-once delivery, idempotent per group.
4. When a service returns a `'carrier.onboarding.approved'` event, the controller publishes it; the rabbit broker fans out to all queues subscribed to that routing key.
5. Subscribers run independently — a failure in one (e.g. notifications) does not roll back the originating transaction.

Event topology lives in `src/shared/messaging/eventMap.ts` — a single `EventMap` interface mapping event name → typed payload (`organization.created`, `load.status.changed`, `load.delivered`, `document.confirmed`, `document.archived`, `document.replaced`, `invoice.draft.created`, `carrier.invited`, `carrier.onboarding.{completed,approved,rejected}`, `settlement.{draft.created,approved,paid,disputed,generate}`, `sms.prompt.{due,canceled}`, `vehicle.expense.{changed,created}`, `expense.{created,updated,deleted}`, `recurring-expense.generated`, `load.checkcall.logged`, `load.detention.detected`, `load.stops.changed`, `load.canceled`, `load.tonu`, `accessorial.{created,updated,deleted}`, `invitation.created`).

The `EventBus` interface supports delayed delivery via `publishDelayed(event, data, delayMs)` for scheduled side effects (e.g. SMS prompts). See `src/shared/messaging/eventBus.ts`.

### UI Side-Effect Flow (Redux Saga)

1. Component dispatches an action: `dispatch(fetchCarriersRequest())`.
2. Saga watcher (`features/carrier/store/sagas/carrierSagasWatcher.ts`) intercepts via `takeLatest`.
3. Operation saga (`fetchCarriersSaga.ts`) calls API client (`utils/api/...`) via `yield call(...)`.
4. On success: dispatches `entityActions.setAll(...)` (entity slice) + `fetchSuccess(...)` (page slice) + `enqueueSnackbar('Success', { variant: 'success' })`.
5. On error: dispatches `fetchFailure({ error })` + error toast; never rethrows.
6. Optional navigation: `yield call(navigate, '/carriers/:id')` using `getNavigate()` from `utils/getNavigate.ts`.

### Auth Flow

1. Login `POST /auth/login` (no `/api/v1` prefix; mounted via `rootAuthRouter` at `src/app.ts:120`) issues HttpOnly access + refresh cookies.
2. Frontend axios sends `withCredentials: true`; tokens never enter Redux or localStorage.
3. On any `401`, the axios response interceptor pauses requests, calls `/auth/token/refresh`, retries the queue (`hussle-app-dispatch-ui/src/utils/axios.ts:14-60`).
4. If refresh fails: dispatch `logoutSuccess`, `resetPopups`, `closeSnackbar`, navigate to `/login`.
5. Auth middleware on the API (`src/middleware/auth.ts`) reads cookies and sets `req.user`; `requireRole([...])` checks `req.user.role` against `src/config/roles.ts`.
6. Carrier-portal and driver-portal use invite-token auth instead — see `src/shared/middleware/requireAuthOrInviteToken.ts`.

**State Management (UI):**
- Server data: Redux entity slices (`entities.<feature>`) populated by sagas.
- UI state: Redux page slices (`pages.<feature>`) for query, selection, per-operation loading.
- Modals/drawers: Redux `uiSlice` with `openModal`/`openDrawer` action — never component `useState`.
- Auth state: `auth` slice; tokens themselves stay in cookies only.

## Key Abstractions

**EventBus (`src/shared/messaging/eventBus.ts`):**
- Purpose: Typed pub/sub for domain events with optional delayed delivery.
- Implementations: `rabbitMqEventBus.ts` (production), `inMemoryEventBus.ts` (tests).
- All events typed by `EventMap` (`src/shared/messaging/eventMap.ts`).

**Per-Module Composition Root (`<feature>/compositionRoot.ts`):**
- Purpose: Single factory that wires a feature's repositories, services, controllers, and subscribers.
- Pattern: `createXxxModule({ prismaClient, eventBus, logger, ...crossModuleQueries })` → `{ controllers, initializeSubscriber? }`.
- Examples: `src/carriers/compositionRoot.ts`, `src/notifications/compositionRoot.ts`, `src/carrier-portal/compositionRoot.ts`.
- Cross-module reads happen via injected query ports (see `inviteTokenRepo` from `carrier-portal/repositories/` passed into `carriers/compositionRoot.ts`).

**Port Interfaces (`<feature>/types/*Port.ts`):**
- Purpose: Define repository/service contracts so services depend on abstractions.
- Examples: `CarrierApprovalPort`, `CarrierSuspendPort`, `OnboardingDetailPort`, `CarrierAuditPort`.

**Service Result `{ data, events[] }`:**
- Purpose: Services return data plus domain events for the controller to publish.
- Used throughout new-style services (carriers, settlements, invoices).

**Typed Errors (`src/shared/errors/`):**
- `CustomError` (abstract base — `src/shared/errors/authError.ts` and `commonErrors.ts` extend), `RequestValidationError`, `MissingEnvError`, `MissingEstimatedHoursError`, `GoneError`.
- All caught by `src/shared/middleware/errorHandler.ts` and serialized to a uniform `{ errors: [...] }` response.

**Frontend Dual-Slice Entity Pattern:**
- Entity slice via `createEntityAdapter`: normalized `{ ids, entities }`.
- Page slice with composite-key loading map: `loading: { 'getAll': 'Pending', 'update:<id>': 'Pending' }`.
- Factories at `hussle-app-dispatch-ui/src/utils/redux/` (`createEntityModule.ts`, `createCrudReducers.ts`).

**Frontend Drawer/Modal Registry:**
- `features/ui/drawerRegistry.ts` + `modalRegistry.ts` map a `DrawerType`/`ModalType` union to a component.
- Open via `useDrawerActions().openDrawer('CarrierCompanyInfo', { entityId })` — IDs only, never raw entity objects.

**Conversational Form (carrier portal):**
- Generic engine at `hussle-app-dispatch-ui/src/components/ConversationalForm/`.
- Per-phase question schemas at `features/carrier-portal/questions/{companyQuestions,equipmentQuestions,driversQuestions,documentsQuestions}.ts`.

## Entry Points

**API process:**
- Location: `hussle-app-dispatch-api/src/index.ts`
- Triggers: `npm start` / Docker `Dockerfile.prod` `CMD`.
- Responsibilities: connect Redis, construct RabbitMQ bus, call `createApp({ prisma, redis })`, register `SIGTERM`/`SIGINT` shutdown, listen on `env.PORT`.

**API HTTP app factory:**
- Location: `hussle-app-dispatch-api/src/app.ts`
- Triggers: invoked by `src/index.ts` and by integration tests.
- Responsibilities: install security middleware, JSON body parsing (2MB limit), cookie parsing, mount auth + feature routers, mount local-storage route (dev), install `errorHandler` last. Side-effect imports (`./audit`, `./notifications`) initialize subscribers on first import.

**UI process:**
- Location: `hussle-app-dispatch-ui/src/index.tsx`
- Triggers: Vite dev server (`npm run dev`) or static build.
- Responsibilities: wrap `RouterProvider` (`createBrowserRouter(routes, ...)`) in `ReduxProvider`; `routes` composed in `src/routes/index.tsx`.

**UI app shell:**
- Location: `hussle-app-dispatch-ui/src/App.tsx`
- Triggers: rendered for every route under the main `App` parent in the route tree.
- Responsibilities: `ThemeCustomization` → `Locales` → `Notistack` → `<Outlet />` + `ModalManager` + `DrawerManager`.

**UI portal shell:**
- Location: `PortalShell` inline in `hussle-app-dispatch-ui/src/routes/index.tsx`
- Triggers: parent route element for `DriverPortalRoutes` and `CarrierPortalRoutes`.
- Responsibilities: provide theme but skip the internal-app chrome (`AppLayout`, sidebar, etc).

## Architectural Constraints

- **Threading:** Single Node.js event loop on the API; long work delegated to RabbitMQ subscribers or future workers. Subscribers run in-process today via the same Node runtime as the HTTP server.
- **Global state (API):** Three intentional singletons — `prisma` (`src/config/database.ts`), `redisClient` (`src/shared/redisClient.ts`), `sharedEventBus` (`src/shared/messaging/sharedEventBus.ts`). All other state is injected through module composition roots.
- **Global state (UI):** Single Redux store at `src/store/index.ts`. Auth tokens NEVER stored in Redux state or `localStorage` — HttpOnly cookies only.
- **Decimal precision:** Financial fields use `decimal.js`; the API's JSON serializer registers `decimalReplacer` to emit Decimals as strings, preventing silent precision loss (`src/app.ts:47-52`). Frontend must treat money fields as strings.
- **DI direction (API):** Services depend on port interfaces; never import `@prisma/client` directly, never import repositories directly. Enforced by `dependency-cruiser` (`npm run lint:deps`).
- **No thunks (UI):** `configureStore` sets `thunk: false`. All async goes through Redux Saga.
- **One UI library:** MUI v5 only (`@mui/material`, `@mui/lab`, `@ant-design/icons`). No `styled-components`, no Tailwind, no second component lib.
- **Routes don't reach Prisma:** Routes receive pre-wired controllers from `compositionRoot.ts` and apply middleware only.

## Anti-Patterns

### Importing repositories directly into services

**What happens:** A service file imports `carrierRepositoryPrisma` and calls it directly.
**Why it's wrong:** Breaks dependency-cruiser rule `no-repo-implementations-in-services`, prevents test doubles, couples the service to Prisma's connection lifecycle.
**Do this instead:** Define a port in `<feature>/types/` and have the composition root inject the implementation. See `src/carriers/compositionRoot.ts` building `approvalPort`/`suspendPort` and passing them to `createCarrierApprovalService`/`createCarrierSuspendService`.

### Cross-module service-to-service imports

**What happens:** `carrierService` imports `documentService` to read a related entity.
**Why it's wrong:** Couples modules tightly; bypasses the event bus; complicates testing.
**Do this instead:** Either inject a **query port** (read-only cross-module dep wired in the top-level orchestrator) or publish a domain event and have the other module subscribe. See `carrier-portal/repositories/carrierInviteTokenRepoPrisma.ts` imported into `carriers/compositionRoot.ts` as a query port.

### `req.body` / `req.params` access in controllers

**What happens:** Controller reads `req.body.email` and forms its own service input.
**Why it's wrong:** Conflates HTTP shape with service contract, leaks express types into business logic, defeats validator-typed assurances.
**Do this instead:** Always use `<feature>/controllers/mappers/*` to translate `Request → ServiceInput` and `<feature>/controllers/transformers/*` to shape responses.

### UI `useState` for popup visibility

**What happens:** A page tracks `const [drawerOpen, setDrawerOpen] = useState(false)`.
**Why it's wrong:** Defeats the central drawer/modal registry, breaks chaining (opening a second drawer doesn't replace the first cleanly), prevents redux-driven re-opens after a route change.
**Do this instead:** `useDrawerActions().openDrawer('Type', { entityId })` and let `DrawerManager` render from Redux state.

### Page-level `isLoading` on `PageWrapper` for list pages

**What happens:** `<PageWrapper isLoading={isLoading}>` on a list page.
**Why it's wrong:** `PageWrapper` unmounts children while loading, destroying the `DebouncedInput` and triggering an infinite fetch loop.
**Do this instead:** Pass `loading={!hasLoadedOnce}` to `NewDataGrid` instead — only show the page-level loader on first load, not on refetches.

### `type` over `interface` for object shapes

**What happens:** New code declares `type Foo = { ... }` for an object.
**Why it's wrong:** Project ESLint rule `@typescript-eslint/consistent-type-definitions` is `warn` during migration but should be treated as error for new code.
**Do this instead:** Use `interface Foo { ... }` for all object shapes; reserve `type` for unions, intersections, and mapped types.

## Error Handling

**Strategy:** Typed error classes thrown from services → propagated via `express-async-errors` → caught by centralized `errorHandler` → serialized to `{ errors: [{ message, field? }] }`.

**Patterns:**
- API: `CustomError` (abstract) extended by `BadRequestError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `RequestValidationError`, `GoneError`, `MissingEnvError`. See `src/shared/errors/`.
- API: controllers never `try/catch`; errors propagate automatically (`import 'express-async-errors'` at top of `src/app.ts`).
- API: services log business events via injected `LoggerPort` (`src/shared/utils/logger.ts`).
- UI: three error layers — axios interceptor handles `401`, saga `try/catch` handles API errors and dispatches `enqueueSnackbar` toasts, `ErrorBoundary` inside `PageWrapper` catches render crashes.

## Cross-Cutting Concerns

**Logging:**
- API: `src/shared/utils/logger.ts` — a `LoggerPort` injected through composition roots. Never `console.log`.
- UI: notifications via Redux `notificationSlice` → `notistack`; `closeSnackbar` is the only direct `notistack` import outside the slice (`utils/axios.ts:6`).

**Validation:**
- API: format validation via Yup schemas in `<feature>/validators/`, run by `validateRequest` middleware. Business rules live in services.
- UI: Yup schemas in `features/<feature>/validators/`, types derived via `InferType<typeof schema>`. Used with Formik forms and `@mocho/ui` form-field components.

**Authentication:**
- Internal app: cookie-based JWT issued by `rootAuthRouter`. Middleware: `requireAuth` (`src/middleware/auth.ts`), `requireRole`.
- API keys: `apiKeyAuth` and `sessionOrApiKeyAuth` (`src/shared/middleware/`).
- Portals: invite-token flow via `requireAuthOrInviteToken` (`src/shared/middleware/requireAuthOrInviteToken.ts`).

**Authorization:**
- Route-level: `requireRole([ROLES.ADMIN, ROLES.DISPATCHER])` middleware. Roles defined in `src/config/roles.ts`.
- Service-level: ownership / organization scoping enforced inside service functions (e.g. all carrier queries scoped by `managedByOrgId`).

**Data scoping:**
- Every list/read query passes `organizationId` (and sometimes `managedByOrgId` for carriers) through mapper → service → repository where Prisma's `where` clause enforces tenant isolation. Soft-delete enforced via `deletedAt: null`.

**Idempotency / at-least-once:**
- RabbitMQ queue groups (`eventBus.subscribe(event, queueGroup, handler)`) ensure each subscriber group processes a message at least once. Subscribers must be idempotent — typical pattern is `findOrCreate` or guard-by-existing-state-check.

---

*Architecture analysis: 2026-05-13*
