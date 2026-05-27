# Coding Conventions

**Analysis Date:** 2026-05-13

The Fleet Command monorepo contains four TypeScript packages — `hussle-app-dispatch-api/` (Express + Prisma backend), `hussle-app-dispatch-ui/` (React + Vite frontend), `hussle-emails/` (React Email templates), and `dat-load-scraper/` (Chrome extension). All packages target the global Airbnb-flavored TypeScript standard from `~/.claude/CLAUDE.md`, with package-level overrides documented in each package's own `CLAUDE.md`.

## Naming Patterns

**Files:**

| Element | Convention | Example |
|---------|------------|---------|
| API services | camelCase, one function per file | `hussle-app-dispatch-api/src/documents/services/documentService.ts` |
| API repositories | camelCase + Prisma suffix | `entityRepositoryPrisma.ts` |
| API controllers | camelCase + `Controller` suffix | `companyController.ts` |
| API validators | camelCase + `Validator` suffix | `equipmentValidator.ts` |
| API per-module DI | `compositionRoot.ts` | `hussle-app-dispatch-api/src/carriers/compositionRoot.ts` |
| API event subscribers | camelCase + `Subscriber` suffix | `notificationSubscriber.ts`, `carrierOnboardingSubscriber.ts` |
| UI page components | PascalCase folder with `index.tsx` | `CarrierPortalPage/index.tsx` |
| UI shared components | PascalCase folder | `MainCard/`, `BaseFieldWrapper/` |
| UI Redux slice | camelCase + `Slice` suffix | `uiSlice.ts`, `featurePageSlice.ts` |
| UI Redux saga | camelCase + `Saga` suffix | `createPostSaga.ts`, `fetchAllSaga.ts` |
| UI selectors | camelCase + `Selectors` suffix | `featureSelectors.ts` |
| UI route files | PascalCase + `Routes` suffix | `CarrierRoutes.tsx`, `BlogRoutes.tsx` |
| UI hooks | camelCase with `use` prefix | `useAuth.ts`, `useDirtyFormBlocker.ts` |
| UI API client | camelCase by resource | `utils/api/carriers/index.ts` |
| Email templates | PascalCase + `Email` suffix | `shared/emails/carrierInvite/CarrierInviteEmail.tsx` |
| Tests | `<source>.test.ts(x)` co-located or in `__tests__/` | `documentService.test.ts` |
| Storybook | `.stories.tsx` co-located | `*.stories.tsx` |

**Functions / methods:** `camelCase`.
- Verbs preferred: `createCarrier`, `validateStops`, `composeSmsBody`, `resolveStopTimezone`.
- API service module factories use `create<Service>` (e.g., `createDocumentService`).

**Types / interfaces:** `PascalCase`.
- React props always suffixed `Props` (e.g., `ConfirmDialogProps`, `TextFieldProps`).
- API ports suffixed `Port` (e.g., `DocumentRepoPort`, `EventDispatcherPort`).
- Service-input types use `<Verb><Entity>Input` (e.g., `VerbEntityInput`).
- ESLint enforces `consistent-type-definitions: 'interface'` on the API (error) and `'warn'` on the UI — prefer `interface` over `type` for object shapes.

**Constants / env vars:** `UPPER_SNAKE_CASE`.
- Frontend env vars must start with `VITE_` (e.g., `VITE_API_URL`).
- API exit constants in `src/shared/`.

**Redux actions:** camelCase with `Request` / `Success` / `Failure` suffixes (`fetchCarriersRequest`, `createCarrierSuccess`, `deleteCarrierFailure`).

## Code Style

**Authoritative source:** The global Airbnb-derived rules in `~/.claude/CLAUDE.md` apply to all packages. Both production packages explicitly enforce a subset of those rules through ESLint flat configs.

**Formatting:**
- Tool: Prettier 3.x.
- Configs (identical): `hussle-app-dispatch-api/.prettierrc`, `hussle-app-dispatch-ui/.prettierrc`.
- Settings:
  ```json
  {
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false,
    "semi": true,
    "singleQuote": true,
    "trailingComma": "all",
    "bracketSpacing": true,
    "arrowParens": "always",
    "endOfLine": "lf"
  }
  ```
- `eslint-config-prettier` is loaded last in every ESLint config — formatting rules are owned exclusively by Prettier.

**Linting:**
- Tool: ESLint 9/10 flat config + `typescript-eslint` 8.x.
- API config: `hussle-app-dispatch-api/eslint.config.mjs`.
- UI config: `hussle-app-dispatch-ui/eslint.config.js`.
- Shared base: `js.configs.recommended`, `tseslint.configs.strict`, `tseslint.configs.stylistic`, `prettierConfig`.
- UI adds: `eslint-plugin-react-hooks` (`...reactHooks.configs.recommended.rules`) and `eslint-plugin-react-refresh` (`only-export-components: 'warn'`).

**Shared custom rules (both packages):**
```js
'no-console': 'warn',
eqeqeq: 'error',
'no-nested-ternary': 'error',
'no-unneeded-ternary': 'error',
'prefer-const': 'error',
'no-return-assign': 'error',
'prefer-template': 'error',
'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
```

**Per-package differences:**

| Rule | API (`eslint.config.mjs`) | UI (`eslint.config.js`) |
|------|----------|---------|
| `max-params` | `['error', 3]` — middleware error handler exempt | `['error', 5]` |
| `@typescript-eslint/no-explicit-any` | `'error'` (strict for new backend code) | `'warn'` (migration override) |
| `@typescript-eslint/no-non-null-assertion` | `'error'` | `'warn'` (migration override) |
| `@typescript-eslint/consistent-type-definitions` | `['error', 'interface']` | `'warn'` |
| Test files (`__tests__/**`, `*.test.*`) | `no-explicit-any` relaxed to `warn`, `consistent-type-definitions` off | inherits default but parser project disabled |

**ESLint suppressions are forbidden** — `eslint-disable`, `@ts-ignore`, `@ts-expect-error` must NEVER be added to bypass a rule. Fix the underlying code.

**TypeScript strictness:**

| Setting | API (`tsconfig.json`) | UI (`tsconfig.app.json`) |
|---------|---|---|
| `strict` | `true` | `true` |
| `noImplicitAny` | `true` (explicit) | inherited from `strict` |
| `noImplicitReturns` | `true` | not set |
| `noFallthroughCasesInSwitch` | `true` | `true` |
| `noUncheckedIndexedAccess` | `true` (very strict) | not set |
| `noUncheckedSideEffectImports` | not set | `true` |
| `target` / `module` | `ES2020` / `commonjs` | `ES2022` / `ESNext` (bundler) |
| Path alias | `@/*` → `./src/*` | `store`, `utils/*`, `components/*`, `pages/*`, `hooks/*`, `types/*`, `features/*`, `mocho/*`, `@mocho/ui[/...]` |

## Import Organization

**Order (enforced by convention, not by lint rule):**

UI (per `hussle-app-dispatch-ui/CLAUDE.md`):
1. React (`react`, `react-dom`)
2. External packages (`@mui/material`, `react-router`, `@ant-design/icons`, etc.)
3. Internal aliases (`store`, `utils/...`, `components/...`, `pages/...`, `types/...`, `features/...`, `mocho/...`, `@mocho/ui/...`)
4. Relative imports (within the same feature module only)

Each group is separated by a blank line.

API (per `hussle-app-dispatch-api/CLAUDE.md` and observed in test files):
1. External packages (`express`, `@prisma/client`, `decimal.js`, `yup`)
2. Path-alias imports (`@/shared/...`)
3. Relative imports (within the same module)

Example from `hussle-app-dispatch-api/src/loads/__tests__/loadStatusService.test.ts`:
```typescript
import Decimal from 'decimal.js';
import { createLoadStatusService } from '../services/loadStatusService';
import type { LoadStatusService } from '../services/loadStatusService';
import type { LoadRepoPort, LoadWithRelations } from '../types/loadTypes';
import type { EventBus } from '@/shared/messaging/eventBus';
import { NotFoundError, InvalidTransitionError } from '@/shared/errors';
```

**Type-only imports:** Always use `import type { Foo }` for type-only imports. Never mix type and value imports in the same statement.

**Path Aliases:**

UI (declared in `tsconfig.app.json`, mirrored in `jest.config.ts` `moduleNameMapper`):
- `store` → `src/store`
- `utils/*` → `src/utils/*`
- `components/*` → `src/components/*`
- `pages/*` → `src/pages/*`
- `hooks/*` → `src/hooks/*`
- `types/*` → `src/types/*`
- `features/*` → `src/features/*`
- `mocho/*` → `src/mocho/*`
- `@mocho/ui[/redux|/components|/forms|/hooks|/utils|/types|/theme]` → `src/mocho[/...]`

API: `@/*` → `./src/*`. Resolved at runtime via `tsconfig-paths/register` (ts-node-dev), at build time via `tsc-alias`, and in tests via Jest `moduleNameMapper`.

**Barrel exports:** Used for `src/shared/errors/index.ts`, feature `store/reducers/index.ts`, `store/sagas/index.ts`, and UI hooks. Avoid creating new `index.ts` files purely for re-export of logic — name files by what they contain.

## Error Handling

**Backend — typed error classes:**

All errors extend `CustomError` (from `@mocho/common`). Defined in `hussle-app-dispatch-api/src/shared/errors/commonErrors.ts`:

```typescript
export class NotFoundError extends CustomError {
  statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(public message: string) {
    super(message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
```

Catalog (status code, error code):

| Class | Status | `code` |
|-------|--------|--------|
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `ConflictError` | 409 | `CONFLICT` |
| `ActiveLoadsConflictError` | 409 | `ACTIVE_LOADS` |
| `AssignmentValidationError` | 422 | `ASSIGNMENT_BLOCKED` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `OrgSuspendedError` | 403 | `ORG_SUSPENDED` |
| `InvalidTransitionError` | 422 | `INVALID_STATUS_TRANSITION` |
| `OnboardingBlockError` | 422 | `ONBOARDING_INCOMPLETE` |
| `ProhibitedCommodityError` | 422 | `PROHIBITED_COMMODITY` |
| `InsuranceExpiredError` | 422 | `INSURANCE_EXPIRED` |
| `ConcurrentEditError` | 409 | `CONCURRENT_EDIT` |
| `SequenceError` | 500 | `SEQUENCE_ERROR` |
| `SeatLimitReachedError` | 429 | `SEAT_LIMIT_REACHED` |
| `LastAdminError` | 409 | `LAST_ADMIN` |

Module-specific errors live next to their domain types — e.g., `hussle-app-dispatch-api/src/documents/types/documentErrors.ts` defines `DocumentNotFoundError`, `DocumentAlreadyConfirmedError`, `DocumentUploadNotConfirmedError`.

Other shared error classes:
- `hussle-app-dispatch-api/src/shared/errors/authError.ts`
- `hussle-app-dispatch-api/src/shared/errors/goneError.ts`
- `hussle-app-dispatch-api/src/shared/errors/missingEnvError.ts`
- `hussle-app-dispatch-api/src/shared/errors/missingEstimatedHoursError.ts`
- `hussle-app-dispatch-api/src/shared/errors/requestValidationError.ts`

**Type guard:** `isCustomError(error: unknown): error is CustomError` exported from `commonErrors.ts`.

**Express centralized handler:** Errors thrown inside async controllers are forwarded by `express-async-errors` (imported once in `src/app.ts`) and handled by `src/middleware/errorHandler.ts`. Controllers do **not** use try/catch.

**Frontend — three-layer model:**

| Layer | File | Handles |
|-------|------|---------|
| Axios interceptor | `hussle-app-dispatch-ui/src/utils/axios.ts` | 401 → refresh token → retry queue → on failure: logout + redirect |
| Saga try/catch | per-saga files in `pages/<feature>/store/sagas/` | API errors → dispatch failure action + `enqueueSnackbar` |
| ErrorBoundary | `hussle-app-dispatch-ui/src/mocho/components/ErrorBoundary/ErrorBoundary.tsx` (via `PageWrapper`) | React render crashes → fallback UI |

Standard saga catch pattern:
```typescript
catch (error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'Operation failed';
  yield put(operationFailure({ error: errorMessage }));
  yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
}
```

**Typed enum + interface error pattern (frontend):**

For domain-specific error shapes the codebase uses an enum + interface pair, e.g. `hussle-app-dispatch-ui/src/utils/imageUploadErrors.ts`:

```typescript
export enum ImageUploadErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ImageUploadError {
  type: ImageUploadErrorType;
  message: string;
  technicalDetails?: string;
  retryable: boolean;
  statusCode?: number;
}
```

**Universal rules (from global CLAUDE.md):**
- NEVER throw generic `Error`.
- Always `catch (error: unknown)` and narrow with `instanceof` checks or type guards.
- NEVER use `error: any`.

## Logging

**Backend — injected logger port:**

Defined as `LoggerPort` (a.k.a. `Logger`) in `hussle-app-dispatch-api/src/shared/utils/logger.ts`. Methods: `info`, `debug`, `warn`, `error`. Always injected as a service dep — never imported directly inside business logic.

```typescript
deps.logger.info('Document confirmed', { documentId, entityType });
deps.logger.error('Handler failed', { type: event.type, error });
```

**Frontend:** `notistack` for user-facing notifications via `enqueueSnackbar(message, { variant: 'success' | 'error' | 'warning' | 'info' })`. Always dispatched from sagas via `yield call(enqueueSnackbar, ...)`, never directly from components. `console.log` is `'warn'` in ESLint and must not appear in committed code.

## Comments

- `/** ... */` for multiline JSDoc on exported functions, hooks, and components (see `hussle-app-dispatch-ui/src/mocho/forms/hooks/useDirtyFormBlocker.ts`).
- `//` for single-line clarifications, with a space after `//` and a blank line before.
- Section dividers in larger test files use `// ---------------------------------------------------------------------------` (see `documentService.test.ts`).
- `FIXME:` for known problems, `TODO:` for planned work.
- Do not narrate obvious code.

## Function Design

**Backend services** — every service is an arrow-function factory that:
- Accepts a single `input` argument and a single `deps` argument.
- Depends only on port interfaces, never on Prisma directly (enforced by `dependency-cruiser` rule `no-prisma-in-services`).
- Returns `Promise<ServiceResult<T>>` where `ServiceResult<T> = { data: T; events: DomainEvent[] }`.
- Throws typed errors on rule violations.
- Logs business operations via `deps.logger`.

**Backend repositories** — implement port interfaces and accept either `PrismaClient` or a `PrismaTransaction`. Defined as arrow-function factories that close over the client/tx.

**Backend controllers** — arrow-function factories that consume:
- `mapper(req) → input` (translates `req.body`, `req.params`, `req.query`, `req.user`, `req.scope` into service input).
- `service(input) → { data, events }`.
- `transformer(data) → response` (shapes the JSON payload).
- Dispatch returned events fire-and-forget via `eventDispatcher.dispatchAll(result.events)`.

**Frontend components:**
- Shared components — `React.FC<Props>` with named export.
- Page components — arrow function with default export.
- Event handler naming: `handle*` for handlers defined inside the component, `on*` for handlers received as props.

**Function parameter limits:** API max 3 (Express middleware error handler is exempt); UI max 5.

## Module Design

**Backend module layout** (canonical) — per `hussle-app-dispatch-api/CLAUDE.md`:

```
src/<featureName>/
  types/                       # Domain types, port interfaces, typed errors
  services/                    # Business logic (depends on ports only)
  repositories/                # Prisma queries implementing ports
  controllers/
    mappers/                   # req → service input
    transformers/              # service output → response
  validators/                  # Yup schemas (format only)
  events/handlers/             # Domain event handlers (side effects)
  routes/                      # Express route definitions
  compositionRoot.ts           # Per-module DI wiring
  __tests__/                   # Unit tests flat; integration tests in /integration
```

**Top-level orchestrator:** `hussle-app-dispatch-api/src/compositionRoot.ts` constructs shared infrastructure (logger, eventDispatcher, txManager) and wires each module by calling `create<Feature>Module(...)`.

**Frontend module layout** — per `hussle-app-dispatch-ui/CLAUDE.md`:

```
src/features/<feature>/
  pages/<Page>/index.tsx                # Page-level component (orchestration only)
  components/                           # Feature-shared components
  components/<Page>/                    # Page-local components (not in pages/ subfolder)
  routes/<Feature>Routes.tsx
  store/
    reducers/                           # *PageSlice, *EntitySlice, index.ts
    sagas/                              # one file per operation + watcher
    selectors/                          # *Selectors.ts
  validators/                           # Yup schemas
  constants/
```

**Exports:**
- Default export for page components and layouts.
- Named exports for utilities, types, selectors, hooks, shared components.
- API service factories export the factory function and the inferred service type.

## Forms & Validation

**Stack:** Formik 2.x + Yup 1.x.

**Pattern (UI):**
1. Define a Yup schema in `pages/<feature>/validators/` and derive form values via `InferType<typeof schema>`.
2. Use `@mocho/ui/components/form-fields` — `TextField`, `SelectField`, `EmailField`, `PasswordField`, `DateTimePickerField`, `ImageUploadField`, `RichTextEditorField`, `SubmitButton`, etc. All field components receive a `formik` prop and compose `BaseFieldWrapper`.
3. Always check `hussle-app-dispatch-ui/src/mocho/components/form-fields/` for an existing field component before building a new one.

**Allowed type assertion:** Formik's `errors[name]` and `touched[name]` are typed as `string | string[] | FormikErrors<any> | undefined`. The codebase narrows them with `as string | undefined` and `as boolean | undefined` inside field wrappers. This is the only place `as` is acceptable (per `hussle-app-dispatch-ui/CLAUDE.md`).

**Dirty form blocking:** All drawer/form components MUST use `useDirtyFormBlocker` from `hussle-app-dispatch-ui/src/mocho/forms/hooks/useDirtyFormBlocker.ts`. Closing a drawer with unsaved changes must show a `ConfirmDialog`. Reference implementation: the carrier `CompanyInfoDrawer` pattern. The `EditDrawer` from `@mocho/ui` handles dirty state internally with a nested `ConfirmDialog`.

**Validation vs business rules (backend):**

| Layer | What | Where | Trigger |
|-------|------|-------|---------|
| Format validation | "Required", "must be email", "must be UUID" | `validators/*.ts` (Yup) | Express middleware before controller |
| Business rules | "Slug must be unique", "Cannot publish without docs" | `services/*.ts` | Inside service function, throws typed error |

Rule of thumb: if it requires a database check or domain knowledge, it is a business rule and belongs in services.

## Type Safety

**Backend:**
- `noUncheckedIndexedAccess: true` — array/index access always yields `T | undefined`.
- `@typescript-eslint/no-explicit-any: 'error'` — no `any` in production code.
- `@typescript-eslint/no-non-null-assertion: 'error'` — no `!` operator.
- Entity types derive from Prisma (`import { Entity } from '@prisma/client'`) — never hand-write entity shapes.
- Service-input types live in `types/` and use the `<Verb><Entity>Input` pattern.

**Frontend:**
- `@typescript-eslint/no-explicit-any: 'warn'` — migration override; new code must comply.
- `@typescript-eslint/no-non-null-assertion: 'warn'` — same.
- `@typescript-eslint/consistent-type-definitions: 'warn'` — prefer `interface`.

**Error narrowing (universal):**

```typescript
catch (error: unknown) {
  if (error instanceof NotFoundError) { /* ... */ }
  if (error instanceof Error) { logger.error(error.message); }
}
```

## State Management (UI)

- Redux Toolkit + Redux Saga only — thunks are **explicitly disabled** in the store config.
- Typed hooks (`useSelector`, `useDispatch`) come from `store` — never from `react-redux`.
- Dual-slice pattern: each CRUD entity has a **page slice** (UI state, composite keys like `"update:<id>"`) AND an **entity slice** (normalized via `createEntityAdapter`).
- Factories live in `hussle-app-dispatch-ui/src/utils/redux/`: `createCrudSlice`, `createEntityModule`, `createCrudSagas`.
- One saga per file, named `<operation><Entity>Saga.ts`. Watchers use `takeLatest` and live alongside the saga files.
- Modals and drawers open through `pages/ui/store/uiSlice.ts` via `useDrawerActions().openDrawer(type, props)` and `useModalActions().openModal(type, props)`. Never use local `useState` for drawer/modal visibility.

## Architectural Enforcement

`dependency-cruiser` runs in CI for the API and enforces:

| Rule | Forbids |
|------|---------|
| `no-prisma-in-services` | `src/.+/services/` importing `@prisma/client` |
| `no-repo-implementations-in-services` | `src/.+/services/` importing from `src/.+/repositories/` |
| `no-services-to-controllers` | `src/.+/services/` importing from `src/.+/controllers/` |
| `no-circular` | Any circular dependency |

Config: `hussle-app-dispatch-api/.dependency-cruiser.cjs`. UI has its own at `hussle-app-dispatch-ui/.dependency-cruiser.cjs`. Run with `npm run lint:deps`.

## Validation Commands

| Package | Single command | What it runs |
|---------|----------------|--------------|
| `hussle-app-dispatch-api/` | `npm run validate` | `lint` → `lint:deps` → `check-ts` → `test` |
| `hussle-app-dispatch-ui/` | `npm run validate` | `lint` → `lint:deps` → `check-ts` → `test` |

Sub-commands: `lint`, `lint:fix`, `lint:deps`, `check-ts`, `format`, `format:check`, `test`. The UI also exposes `test:e2e` (Playwright).

Every change must leave `npm run validate` green before being marked complete.

---

*Convention analysis: 2026-05-13*
