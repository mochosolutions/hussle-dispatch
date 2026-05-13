# Codebase Structure

**Analysis Date:** 2026-05-13

## Directory Layout

```
fleet-command/                                 # Monorepo root (npm workspaces)
├── hussle-app-dispatch-api/                   # Express + Prisma + Redis + RabbitMQ backend
├── hussle-app-dispatch-ui/                    # React 18 + Vite SPA (dispatch + portals)
├── hussle-app-dispatch-infra/                 # Terraform / Ansible / Dokploy infra
├── mocho-infra-modules/                       # Reusable infra modules
├── dat-load-scraper/                          # DAT load-board scraping tooling
├── docker/                                    # Docker entrypoint helpers
├── scripts/                                   # Repo-level scripts
├── docs/                                      # Cross-package documentation
├── .planning/codebase/                        # Codebase maps consumed by /gsd-*
├── docker-compose.yml                         # Local dev stack
├── docker-compose.local.yml
├── docker-compose-build.yml
├── docker-compose-prod.yml
├── Jenkinsfile.build / Jenkinsfile.deploy     # CI/CD
├── Makefile
└── CLAUDE.md                                  # Top-level project conventions
```

> Note: transactional email templates live **inside the API package** at `hussle-app-dispatch-api/src/shared/emails/`. There is no separate `hussle-emails/` workspace and no separate `extension/` Chrome-extension workspace at the repo root.

### `hussle-app-dispatch-api/`

```
hussle-app-dispatch-api/
├── prisma/                                    # schema.prisma, migrations, seed
├── scripts/                                   # CLI helpers
├── storage/                                   # local dev storage (when STORAGE_BACKEND=local)
├── postman-collection.json
├── eslint.config.mjs
├── tsconfig.json
├── package.json                               # `validate`, `lint`, `lint:deps`, `check-ts`, `test`
└── src/
    ├── index.ts                               # process entry — boots Redis, RabbitMQ, Prisma, Express
    ├── app.ts                                 # createApp({ prisma, redis }) → Express Application
    ├── config/
    │   ├── env.ts                             # validated env loader
    │   ├── database.ts                        # singleton PrismaClient + PrismaTransaction type
    │   ├── roles.ts                           # ROLES const enum
    │   ├── s3.ts
    │   ├── subscriptionLimits.ts
    │   ├── authEnumConfig.ts
    │   └── geoBootstrap.ts
    ├── middleware/
    │   └── auth.ts                            # requireAuth, requireRole
    ├── shared/
    │   ├── errors/                            # CustomError + typed subclasses
    │   ├── middleware/                        # validateRequest, errorHandler, security, rate limiter, apiKeyAuth
    │   ├── messaging/                         # EventBus + EventMap + rabbitMq/inMemory implementations
    │   ├── emails/                            # React Email templates (carrierInvite, invoice, settlement, ...)
    │   ├── notifications/                     # NotificationService factories (SES/SMTP/console + Twilio/console SMS)
    │   ├── prisma/                            # client re-exports / transaction utilities
    │   ├── storage/                           # storage provider factory (s3 / local)
    │   ├── providers/                         # third-party adapters (cognito, etc.)
    │   ├── scoring/                           # composite/CPM/chain/driverFit/minBookRate scoring
    │   ├── routing/                           # routing helpers
    │   ├── geo/, geoLookup.ts
    │   ├── mappers/                           # cross-feature mapper utilities
    │   ├── utils/                             # logger, cookies, decodeToken, distance, facility hours, ...
    │   ├── validators.ts                      # cross-feature Yup helpers
    │   ├── responseEnvelope.ts
    │   ├── pagination.ts
    │   ├── stateMachine.ts                    # carrier/load state-machine helpers
    │   ├── onboardingGate.ts                  # carrier onboarding readiness checks
    │   ├── financials.ts                      # Decimal helpers
    │   ├── sequenceGenerator.ts               # invoice/settlement number generators
    │   ├── loadQueries.ts                     # shared cross-module load read queries
    │   ├── s3Presign.ts
    │   └── redisClient.ts                     # singleton ioredis client
    ├── auth/                                  # login, refresh, logout, session, providers (cognito), AUTH_CONTRACT.md
    ├── api-keys/
    ├── audit/                                 # audit log feature + global subscribers
    ├── notifications/                         # email/sms orchestration + notificationSubscriber + carrierOnboardingSubscriber
    ├── carriers/                              # internal carrier management
    ├── carrier-portal/                        # public carrier-facing onboarding/portal API
    ├── drivers/
    ├── driver-portal/
    ├── vehicles/
    ├── customers/
    ├── contacts/
    ├── places/
    ├── loads/
    ├── load-board/                            # load-board ingest endpoints
    ├── load-intel/                            # load intelligence / scoring endpoints
    ├── invoices/
    ├── settlements/
    ├── expenses/                              # exports expensesRouter + recurringExpensesRouter + driverPortalExpensesRouter
    ├── ifta/
    ├── documents/
    ├── dashboard/
    ├── settings/
    ├── maps/
    ├── short-links/                           # mounted at /s (no /api/v1 prefix, no auth)
    ├── sms-prompts/
    └── __tests__/                             # top-level integration tests
```

Per-feature module shape (e.g. `src/carriers/`):

```
carriers/
├── index.ts                                   # module singleton — wires & exports <feature>Router
├── compositionRoot.ts                         # createCarriersModule({ prismaClient, eventBus, logger })
├── routes/carrierRoutes.ts                    # express.Router factory consuming controllers
├── controllers/
│   ├── carrierController.ts
│   ├── approvalController.ts
│   ├── inviteController.ts
│   ├── suspendController.ts
│   ├── dispatchOverrideController.ts
│   ├── onboardingDetailController.ts
│   ├── mappers/                               # Request → service input
│   └── transformers/                          # Service output → response shape
├── services/
│   ├── carrierService.ts
│   ├── carrierApprovalService.ts
│   ├── carrierInviteService.ts
│   ├── carrierSuspendService.ts
│   ├── carrierOnboardingDetailService.ts
│   ├── dispatchOverrideService.ts
│   ├── carrierStateMachine.ts
│   ├── carrierSubscriber.ts                   # RabbitMQ subscriber initializer
│   ├── carrierComplianceSubscriber.ts
│   └── __tests__/
├── repositories/
│   ├── carrierRepositoryPrisma.ts
│   ├── carrierStatsQueryPrisma.ts
│   └── carrierAuditPortPrisma.ts
├── validators/                                # Yup schemas (carrierValidators, approvalValidators, ...)
├── types/                                     # port interfaces + domain types
├── jobs/                                      # background/cron jobs (carriers only)
└── __tests__/                                 # flat unit tests; integration tests in __tests__/integration/
```

### `hussle-app-dispatch-ui/`

```
hussle-app-dispatch-ui/
├── index.html
├── vite.config.ts
├── eslint.config.js
├── jest.config.ts, jest.setup.ts, jest.importMetaTransformer.ts
├── playwright.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.test.json / tsconfig.node.json
├── nginx.conf                                 # prod static-serve config
├── public/                                    # static assets served as-is
├── e2e/, e2e-results/, playwright-report/
├── mockups/, mocks/
├── package.json
└── src/
    ├── index.tsx                              # ReduxProvider → RouterProvider
    ├── App.tsx                                # ThemeCustomization → Locales → Notistack → Outlet + ModalManager + DrawerManager
    ├── config.ts                              # VITE_* exports
    ├── routes/index.tsx                       # createBrowserRouter + per-feature route modules
    ├── store/
    │   ├── index.ts                           # configureStore + typed useDispatch/useSelector
    │   ├── reducers/index.ts                  # combineReducers({ pages, entities, auth }) + logout reset
    │   ├── sagas/rootsaga.ts                  # all([...feature watchers])
    │   └── middleware/                        # saga navigation middleware
    ├── features/                              # feature modules — primary code home
    │   ├── auth/
    │   ├── dashboard/
    │   ├── ui/                                # global modal/drawer registries + uiSlice
    │   ├── carrier/                           # internal carrier mgmt
    │   ├── carrier-portal/                    # public carrier onboarding/portal SPA pages
    │   ├── driver/
    │   ├── driver-portal/
    │   ├── vehicle/
    │   ├── customer/
    │   ├── contact/
    │   ├── place/
    │   ├── load/
    │   ├── loadintelligence/
    │   ├── invoices/
    │   ├── accounting/                        # settlements, expenses, IFTA
    │   ├── documents/
    │   ├── settings/
    │   └── dev/                               # internal dev/debug routes
    ├── components/                            # cross-feature shared components
    │   ├── PageWrapper/, PageHeader/, MainCard/, SectionCard/, SectionHeader/
    │   ├── AppLayout/, DetailLayout/, ListLayout/, DetailTabBar/
    │   ├── ProtectedRoute/, ErrorPage/, Loader/, Statusbadge/
    │   ├── FilterBar/, ListKpiBar/, SummaryBar/
    │   ├── ConversationalForm/, SteppedConversationalForm/, StepperForm/
    │   ├── DocumentsTab/, DocumentPicker/, FileUploadRow/
    │   ├── EditDrawer/, FormDialog (in mocho), ActionMenu/, SplitButton/
    │   ├── EntityAutocomplete/, AddressTypeahead/, MapView/
    │   ├── Typography/, FieldRow/, EditableSectionHeader/
    │   └── ContextualAlert/, UpgradePlanDialog/
    ├── hooks/                                 # cross-feature hooks (useAuth, ...)
    ├── utils/
    │   ├── axios.ts                           # axios instance + 401 refresh interceptor
    │   ├── api/<domain>/                      # API client functions per resource
    │   ├── redux/                             # createCrudReducers, createEntityModule, page slice helpers
    │   ├── validation/                        # shared Yup helpers
    │   ├── getNavigate.ts                     # imperative navigation for sagas
    │   ├── formatPhone.ts / formatNumber.ts / formatLocation.ts
    │   ├── imageStateManager.ts / uploadInlineImages.ts / getDropzoneData.ts
    │   └── ...                                # entity-specific helpers
    ├── themes/                                # MUI theme config
    ├── templates/                             # one-off layout templates
    ├── types/                                 # cross-feature TS types + overrides/ (MUI augmentation)
    ├── mocho/                                 # vendored mocho-ui components (form-fields, NewDataGrid, EmptyState, DebouncedInput, KpiCell, ...)
    ├── mocks/, __mocks__/
    └── vite-env.d.ts
```

Per-feature module shape (e.g. `src/features/carrier/`):

```
features/carrier/
├── routes/carrierRoutes.tsx                   # RouteObject(s) merged into top-level router
├── pages/                                     # page-level index.tsx ONLY (no inline components)
│   ├── CarrierListPage/index.tsx
│   ├── CarrierDetailPage/index.tsx
│   ├── CreateCarrierPage/index.tsx
│   └── __tests__/
├── components/
│   ├── CarrierListPage/                       # page-local components (used by one page)
│   │   └── CarrierCellRenderers.tsx
│   ├── CarrierDetailPage/                     # page-local tab components: *Tab.tsx
│   │   ├── GeneralTab.tsx
│   │   ├── DriversTab.tsx
│   │   └── ...
│   ├── CarrierKPI/                            # feature-shared
│   └── CarrierNoteDrawer/                     # feature-shared (registered in drawerRegistry)
├── store/
│   ├── reducers/
│   │   ├── carrierEntitySlice.ts              # createEntityAdapter
│   │   ├── carrierNewPageSlice.ts             # page slice (UI state)
│   │   ├── carrierNotesSlice.ts
│   │   ├── carrierDetailActions.ts
│   │   └── index.ts
│   ├── sagas/
│   │   ├── carrierSagasWatcher.ts             # takeLatest registrations
│   │   ├── fetchCarriersSaga.ts
│   │   ├── fetchCarrierDetailsSaga.ts
│   │   ├── fetchCarrierStatsSaga.ts
│   │   ├── createCarrierSaga.ts
│   │   ├── updateCarrierSaga.ts
│   │   ├── deleteCarrierSaga.ts
│   │   ├── adminActivateCarrierSaga.ts
│   │   ├── fetchCarrierNotesSaga.ts
│   │   ├── createCarrierNoteSaga.ts
│   │   ├── fetchCarrierDriversSaga.ts
│   │   ├── fetchCarrierVehiclesSaga.ts
│   │   ├── fetchCarrierTabCountsSaga.ts
│   │   └── carrierCrudSaga.ts
│   └── selectors/carrierSelectors.ts
├── validators/                                # Yup schemas
├── constants.ts
├── onboardingTypes.ts
└── types.ts
```

## Directory Purposes

**`hussle-app-dispatch-api/src/<feature>/`:**
- Purpose: One self-contained domain module. Owns its routes, controllers, services, repositories, types, validators.
- Contains: `index.ts` (singleton wiring), `compositionRoot.ts` (factory), `routes/`, `controllers/{mappers,transformers}`, `services/`, `repositories/`, `types/`, `validators/`, `__tests__/`.
- Key files: `index.ts`, `compositionRoot.ts`, `routes/<feature>Routes.ts`.

**`hussle-app-dispatch-api/src/shared/`:**
- Purpose: Cross-feature infrastructure and utilities.
- Contains: `errors/`, `middleware/`, `messaging/`, `emails/`, `notifications/`, `storage/`, `scoring/`, `utils/`, `prisma/`, `providers/`.
- Key files: `messaging/eventMap.ts`, `messaging/eventBus.ts`, `middleware/errorHandler.ts`, `middleware/validateRequest.ts`, `utils/logger.ts`, `redisClient.ts`.

**`hussle-app-dispatch-api/src/config/`:**
- Purpose: Process-wide configuration and singletons.
- Key files: `env.ts` (validated env loader), `database.ts` (PrismaClient singleton + `PrismaTransaction` type), `roles.ts`.

**`hussle-app-dispatch-api/src/middleware/`:**
- Purpose: Cookie/JWT auth middleware specific to this API. (Generic middleware lives in `src/shared/middleware/`.)
- Key files: `auth.ts` exporting `requireAuth` and `requireRole`.

**`hussle-app-dispatch-ui/src/features/<feature>/`:**
- Purpose: Self-contained UI feature module — pages, components, store, routes.
- Key files: `routes/<feature>Routes.tsx`, `pages/<Page>/index.tsx`, `store/reducers/<feature>EntitySlice.ts`, `store/sagas/<feature>SagasWatcher.ts`.

**`hussle-app-dispatch-ui/src/components/`:**
- Purpose: Cross-feature shared UI primitives and composite components.
- Notable: `PageWrapper`, `PageHeader`, `MainCard`, `SectionCard`, `ConversationalForm`, `ListLayout`, `DetailLayout`, `Typography`.

**`hussle-app-dispatch-ui/src/mocho/`:**
- Purpose: Vendored `@mocho/ui` library (form-fields, NewDataGrid, EmptyState, DebouncedInput, KpiCell, ModalManager pieces). Imports come from here, not a separate workspace.

**`hussle-app-dispatch-ui/src/store/`:**
- Purpose: Redux store, root reducer, root saga, store middleware. Single global store; one saga middleware.

**`hussle-app-dispatch-ui/src/utils/`:**
- Purpose: Frontend shared utilities.
- Notable: `axios.ts` (only place that talks to backend), `api/<domain>/*.ts` (per-resource API clients), `redux/` (slice factories), `getNavigate.ts` (imperative router handle for sagas).

## Key File Locations

**API Entry Points:**
- `hussle-app-dispatch-api/src/index.ts` — process bootstrap (Redis, RabbitMQ, Prisma, Express, graceful shutdown).
- `hussle-app-dispatch-api/src/app.ts` — `createApp({ prisma, redis })` Express factory; mounts all feature routers.

**API Configuration:**
- `hussle-app-dispatch-api/src/config/env.ts` — typed env loader.
- `hussle-app-dispatch-api/src/config/database.ts` — Prisma singleton + transaction type.
- `hussle-app-dispatch-api/src/config/roles.ts` — `ROLES` enum used by `requireRole`.
- `hussle-app-dispatch-api/prisma/schema.prisma` — single source of truth for entity types.

**API Core Logic:**
- `hussle-app-dispatch-api/src/<feature>/services/` — business logic per feature.
- `hussle-app-dispatch-api/src/<feature>/compositionRoot.ts` — DI wiring per feature.
- `hussle-app-dispatch-api/src/shared/messaging/eventMap.ts` — every domain event in the system.

**API Testing:**
- `hussle-app-dispatch-api/src/<feature>/__tests__/<verb><Entity>.test.ts` — unit tests (flat).
- `hussle-app-dispatch-api/src/<feature>/__tests__/integration/` — integration tests.
- `hussle-app-dispatch-api/src/__tests__/` — repo-wide integration tests.

**UI Entry Points:**
- `hussle-app-dispatch-ui/src/index.tsx` — Vite entry, mounts ReduxProvider + RouterProvider.
- `hussle-app-dispatch-ui/src/App.tsx` — app shell (theme, locales, notistack, modal/drawer managers).
- `hussle-app-dispatch-ui/src/routes/index.tsx` — `createBrowserRouter`, composes all feature `RouteObject`s.

**UI Configuration:**
- `hussle-app-dispatch-ui/src/config.ts` — exports `VITE_*` env values.
- `hussle-app-dispatch-ui/vite.config.ts` — path aliases, dev server proxy.

**UI Core Logic:**
- `hussle-app-dispatch-ui/src/store/index.ts` — store, saga middleware.
- `hussle-app-dispatch-ui/src/store/reducers/index.ts` — `{ pages, entities, auth }` shape; logout-resets-all logic.
- `hussle-app-dispatch-ui/src/store/sagas/rootsaga.ts` — `all([...])` of feature watchers.
- `hussle-app-dispatch-ui/src/utils/axios.ts` — axios instance + 401 refresh queue.
- `hussle-app-dispatch-ui/src/features/ui/drawerRegistry.ts` + `modalRegistry.ts` — popup registries.

## Naming Conventions

**API Files:**
- Entity-specific files use `<entity><Role>.ts`: `carrierService.ts`, `carrierRepositoryPrisma.ts`, `carrierValidators.ts`, `carrierTypes.ts`.
- Subscribers: `<feature>Subscriber.ts` or `<feature>ComplianceSubscriber.ts`.
- Composition roots: `compositionRoot.ts` (per module).
- Tests: `<verbEntity>.test.ts` unit; `<feature>Routes.integration.test.ts` integration.

**API Directories:**
- Feature folders: kebab-case for compound feature names (`carrier-portal`, `driver-portal`, `load-board`, `load-intel`, `short-links`, `sms-prompts`, `api-keys`). Single-word features singular except plural-when-referring-to-collection (`carriers`, `drivers`, `loads`, `invoices`, `settlements`, `expenses`, `vehicles`, `customers`, `contacts`, `places`, `documents`, `notifications`).

**UI Files:**
- React components: PascalCase folder with `index.tsx` (`CarrierListPage/index.tsx`).
- Page-local components: PascalCase file under `components/<PageName>/` (`GeneralTab.tsx`).
- Hooks: `use<Name>.ts` (`useAuth.ts`).
- Sagas: `<verb><Entity>Saga.ts` (`createCarrierSaga.ts`); watcher is `<feature>SagasWatcher.ts`.
- Slices: `<feature>EntitySlice.ts` (entity adapter) + `<feature>PageSlice.ts` (UI). Carrier uses `carrierNewPageSlice.ts` historically.
- Selectors: `<feature>Selectors.ts`.
- Validators: Yup schemas in `validators/`, types via `InferType<typeof schema>`.
- Routes: `<feature>Routes.tsx` (camelCase file, exports default).
- Utilities: camelCase single file per function (`formatPhone.ts`, `getNavigate.ts`).

**Identifiers (both packages):**
- Functions/methods/vars: camelCase.
- Types/interfaces/classes: PascalCase (`CarrierApprovalPort`, `CreateCarrierInput`).
- Props interfaces: `<Component>Props` (`CarrierKPIProps`).
- Constants/env vars: UPPER_SNAKE (`ROLES.ADMIN`, `VITE_API_URL`, `RABBITMQ_URL`).
- Redux action creators: `<verb><Entity>{Request|Success|Failure}` (`fetchCarriersRequest`, `createCarrierSuccess`).

## Where to Add New Code

**New API feature module:**
1. Primary code: `hussle-app-dispatch-api/src/<feature>/` with `routes/`, `controllers/{mappers,transformers}`, `services/`, `repositories/`, `types/`, `validators/`.
2. Wiring: `<feature>/compositionRoot.ts` exporting `createXxxModule({...})`, and `<feature>/index.ts` calling it with shared singletons and exporting `<feature>Router`.
3. Mount: add `import { <feature>Router } from './<feature>'` and `app.use('/api/v1/<feature>', <feature>Router)` in `src/app.ts`.
4. Tests: `src/<feature>/__tests__/<verb><Entity>.test.ts` for unit; `__tests__/integration/<feature>Routes.integration.test.ts` for integration.

**New API endpoint on an existing module:**
1. Validator: add Yup schema to `<feature>/validators/`.
2. Mapper + transformer: add files under `<feature>/controllers/{mappers,transformers}/`.
3. Service: add `<verb><Entity>.ts` (or method on existing service factory) in `<feature>/services/`.
4. Controller: create `<verb>Controller.ts` (or extend existing) using the mapper/service/transformer.
5. Wire in `<feature>/compositionRoot.ts`.
6. Route: add `router.<method>('/path', requireAuth, requireRole([...]), validateRequest(schema), controllers.<verb>)` in `<feature>/routes/`.
7. Unit test in `<feature>/__tests__/`.

**New domain event:**
1. Add typed entry to `src/shared/messaging/eventMap.ts`.
2. Publisher: have the relevant service return `{ data, events: [{ type: '<new.event>', payload }] }` and let its controller publish via injected `eventBus`.
3. Subscriber: add `<feature>Subscriber.ts` (or extend existing) that calls `eventBus.subscribe('<new.event>', '<queue-group>', handler)`, wire it into `<feature>/compositionRoot.ts`, and call `initializeSubscriber()` from `<feature>/index.ts`.

**New UI feature:**
1. Folder: `src/features/<feature>/{pages,components,routes,store/{reducers,sagas,selectors},validators}`.
2. Entity + page slice: `<feature>EntitySlice.ts` (use `createEntityModule()` factory from `utils/redux/`) + `<feature>PageSlice.ts` (use `createCrudReducers()` factory or hand-roll).
3. Sagas: one file per operation in `store/sagas/`, plus `<feature>SagasWatcher.ts` registering `takeLatest`.
4. API client: add `utils/api/<domain>/<resource>.ts`.
5. Register reducers in `src/store/reducers/index.ts` (`pages` and/or `entities` combiners).
6. Register saga watcher in `src/store/sagas/rootsaga.ts`.
7. Routes: `<Feature>Routes.tsx` and import in `src/routes/index.tsx`.

**New UI page on existing feature:**
1. `features/<feature>/pages/<NewPage>/index.tsx` — orchestrate state, compose components, wrap in `PageWrapper`.
2. Page-local components: `features/<feature>/components/<NewPage>/` (only used by this page).
3. Tab components: `features/<feature>/components/<NewPage>/<X>Tab.tsx` (no separate `tabs/` folder).
4. Route: add to `<feature>/routes/<Feature>Routes.tsx`.

**New shared API utility:**
- `hussle-app-dispatch-api/src/shared/utils/<name>.ts` (one function per file). Tests at `src/shared/utils/__tests__/<name>.test.ts`.

**New shared UI utility:**
- `hussle-app-dispatch-ui/src/utils/<name>.ts` (or `utils/<category>/<name>.ts` if category exists — e.g. `utils/api/...`, `utils/validation/...`, `utils/redux/...`).

**New shared UI component:**
- `hussle-app-dispatch-ui/src/components/<ComponentName>/index.tsx`. Check `src/mocho/` and existing `components/` first — never duplicate. Form fields belong in `@mocho/ui/components/form-fields` (vendored under `src/mocho/`).

**New drawer or modal:**
1. Component: `features/<feature>/components/<Name>/index.tsx`.
2. Type: add to `DrawerType`/`ModalType` union in `features/ui/types/popupTypes.ts`.
3. Prop shape: add to `DrawerTypeMap`/`ModalTypeMap` in the same file.
4. Register in `features/ui/drawerRegistry.ts` or `modalRegistry.ts`.
5. Open with `useDrawerActions().openDrawer(type, { entityId })` — never local `useState`.
6. Drawer forms must use `useDirtyFormBlocker` (typically via `EditDrawer`).

## Special Directories

**`hussle-app-dispatch-api/prisma/`:**
- Purpose: Prisma schema, migrations, seed scripts.
- Generated: `prisma/generated/` is generated; `node_modules/.prisma/client` is generated.
- Committed: Yes (schema + migrations).

**`hussle-app-dispatch-api/storage/`:**
- Purpose: Local file storage when `STORAGE_BACKEND=local` (dev/test).
- Committed: No (`.gitignore`d).

**`hussle-app-dispatch-api/coverage/`:**
- Purpose: Jest coverage output.
- Committed: No.

**`hussle-app-dispatch-ui/dist/`:**
- Purpose: Vite production build output.
- Committed: No.

**`hussle-app-dispatch-ui/e2e/` and `playwright-report/`:**
- Purpose: Playwright end-to-end specs and HTML reports.
- Committed: Specs yes; reports/results no.

**`hussle-app-dispatch-ui/src/mocho/`:**
- Purpose: Vendored `@mocho/ui` source (form-fields, NewDataGrid, EmptyState, KpiCell, DebouncedInput, etc.).
- Note: Imports of `@mocho/ui` resolve here via tsconfig path mapping — there is no separate `mocho-ui/` workspace anymore.

**`hussle-app-dispatch-ui/__mocks__/`:**
- Purpose: Jest module mocks (mirrors module paths).
- Committed: Yes.

**Where business logic vs presentation lives:**
- API business logic: `hussle-app-dispatch-api/src/<feature>/services/*.ts`. Never in controllers, validators, routes, mappers, transformers.
- UI business logic / async orchestration: `hussle-app-dispatch-ui/src/features/<feature>/store/sagas/*.ts`. Never in components.
- UI pure derivation: `hussle-app-dispatch-ui/src/features/<feature>/store/selectors/*.ts` using `createSelector`.
- UI presentation: `hussle-app-dispatch-ui/src/features/<feature>/pages/` and `components/`. Components consume Redux via typed `useSelector`/`useDispatch` from `store`, never `react-redux` directly.

**Where cross-feature shared code lives:**
- API: `hussle-app-dispatch-api/src/shared/` (utils, errors, middleware, messaging, scoring, emails, notifications, storage).
- UI: `hussle-app-dispatch-ui/src/{components,hooks,utils,types,themes}/` plus vendored library `src/mocho/`.

---

*Structure analysis: 2026-05-13*
