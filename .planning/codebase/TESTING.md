# Testing Patterns

**Analysis Date:** 2026-05-13

## Test Framework

**Runner — per package:**

| Package | Framework | Version | Config |
|---------|-----------|---------|--------|
| `hussle-app-dispatch-api/` | Jest | 29.7.x via `ts-jest` 29.x | inline `jest` block in `hussle-app-dispatch-api/package.json` |
| `hussle-app-dispatch-ui/` | Jest | 30.x via `ts-jest` 29.x | `hussle-app-dispatch-ui/jest.config.ts` + `hussle-app-dispatch-ui/jest.setup.ts` + `hussle-app-dispatch-ui/tsconfig.test.json` |
| `hussle-app-dispatch-ui/` (E2E) | Playwright | 1.59 | `hussle-app-dispatch-ui/playwright.config.ts` |
| `dat-load-scraper/` | Jest | 29.7.x via `ts-jest` 29.x | `dat-load-scraper/jest.config.js` + `src/__tests__/setup.ts` |

**Assertion / DOM libraries:**
- API: bare Jest assertions (`expect`, `jest.Mocked`, `jest.fn()`, `jest.MockedFunction`).
- UI: `@testing-library/react` 16.x + `@testing-library/user-event` 14.x + `@testing-library/jest-dom` 6.x (registered in `jest.setup.ts` via `import '@testing-library/jest-dom'`).
- UI saga testing: `redux-saga-test-plan` 4.x.
- UI HTTP mocking (available, used selectively): `msw` 2.x with worker directory `public/`.

**Test environment:**
- API: `node` (Express services, no DOM).
- UI: `jsdom` (via `jest-environment-jsdom`).
- Extension: `jsdom`.

**Run commands:**

```bash
# API
cd hussle-app-dispatch-api
npm test                  # Jest, all tests
npm run test:watch        # Jest watch mode

# UI
cd hussle-app-dispatch-ui
npm test                  # Jest unit/component tests
npm run test:e2e          # Playwright
npm run test:e2e:ui       # Playwright interactive UI

# Extension
cd dat-load-scraper
npm test                  # Jest

# Full quality gate (per package)
npm run validate          # lint + lint:deps + check-ts + test
```

## Test File Organization

**API (`hussle-app-dispatch-api/`):**

```
src/<feature>/
  services/__tests__/<service>.test.ts       # service unit tests
  __tests__/<file>.test.ts                   # feature-level unit tests (flat)
  __tests__/integration/<feature>Routes.integration.test.ts
```

Examples:
- `hussle-app-dispatch-api/src/documents/services/__tests__/documentService.test.ts`
- `hussle-app-dispatch-api/src/documents/services/__tests__/documentArchiveSubscriber.test.ts`
- `hussle-app-dispatch-api/src/documents/__tests__/integration/documentRoutes.integration.test.ts`
- `hussle-app-dispatch-api/src/invoices/__tests__/invoiceReadinessSubscriber.test.ts`
- `hussle-app-dispatch-api/src/notifications/services/__tests__/notificationSubscriber.test.ts`
- `hussle-app-dispatch-api/src/loads/__tests__/loadStatusService.test.ts`
- `hussle-app-dispatch-api/src/sms-prompts/__tests__/smsPromptWorker.test.ts`
- `hussle-app-dispatch-api/__tests__/app.test.ts` (top-level app smoke test)

There are currently **157** API test files. Unit tests live flat inside `__tests__/`; integration tests live in `__tests__/integration/`.

**UI (`hussle-app-dispatch-ui/`):**

Two co-location styles, both valid:
- Component-folder co-located: `MyComponent/MyComponent.test.tsx`
  - Example: `hussle-app-dispatch-ui/src/mocho/components/PageWrapper/PageWrapper.test.tsx`
  - Example: `hussle-app-dispatch-ui/src/mocho/components/DebouncedInput/DebouncedInput.test.tsx`
  - Example: `hussle-app-dispatch-ui/src/mocho/components/ConfirmDialog/ConfirmDialog.test.tsx`
- `__tests__/` subfolder for larger features:
  - Example: `hussle-app-dispatch-ui/src/components/FilterBar/__tests__/FilterBar.test.tsx`
  - Example: `hussle-app-dispatch-ui/src/components/DocumentsTab/__tests__/DocumentsTab.test.tsx`
  - Example: `hussle-app-dispatch-ui/src/components/ListKpiBar/__tests__/ListKpiBar.test.tsx`

There are currently **105** UI test files. Redux store tests live in `store/__tests__/` or `store/reducers/__test__/`. Utility tests live in `utils/__tests__/`.

**Test match patterns:**
- API: `**/__tests__/**/*.test.ts`, `**/*.test.ts` (from `package.json` `jest.testMatch`).
- UI: `**/__tests__/**/*.test.(ts|tsx)`, `**/*.test.(ts|tsx)` (from `jest.config.ts`).
- Extension: `<rootDir>/src/__tests__/**/*.test.ts`.

**Test files excluded from production builds** — both `tsconfig.app.json` (UI) and `tsconfig.json` (API) exclude `**/*.test.ts(x)` and `**/__tests__/**` so tests cannot leak into the bundle.

## Naming

- File: `<source>.test.ts` or `<source>.test.tsx` matching the file under test.
- `describe`: function, class, or component name being tested (e.g., `describe('createDocumentService', ...)`).
- Nested `describe` for sub-behaviors / methods (e.g., `describe('presign', ...)` inside the service describe).
- `it`: `it('<action> when <condition>')` — present-tense, behavior-focused.
  - "subscribes to document.confirmed with document-archive-service queue group"
  - "renders children when not loading"
  - "throws NotFoundError when entity does not exist"
- Section comments inside long files use `// ---` block dividers.

## Test Structure (AAA)

The codebase follows Arrange-Act-Assert with explicit `// Arrange`, `// Act`, `// Assert` comments in larger tests.

Real example from `hussle-app-dispatch-api/src/documents/services/__tests__/documentService.test.ts`:

```typescript
describe('createDocumentService', () => {
  let deps: ReturnType<typeof buildMockDeps>;
  let service: ReturnType<typeof createDocumentService>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
    service = createDocumentService(deps);
  });

  describe('presign', () => {
    it('builds correct S3 key and returns presigned URL with document id', async () => {
      // Arrange
      const input = {
        organizationId: 'org-1',
        entityType: 'load' as const,
        entityId: 'load-1',
        type: 'BOL_SIGNED' as const,
        fileName: 'bol.pdf',
        mimeType: 'application/pdf',
      };
      const createdDoc = makeDocument({ id: 'new-doc-id' });
      deps.storageProvider.getPresignedPutUrl.mockResolvedValue('https://s3.example.com/presigned');
      deps.documentRepository.create.mockResolvedValue(createdDoc);

      // Act
      const result = await service.presign(input);

      // Assert
      expect(result.documentId).toBe('new-doc-id');
      expect(deps.documentRepository.create).toHaveBeenCalledWith(/* ... */);
    });
  });
});
```

**Lifecycle hooks:**
- `beforeEach(() => jest.clearAllMocks())` — universal pattern, runs at the top of every `describe` that uses mocks.
- `beforeEach()` rebuilds the mock deps object so each test gets a clean slate.
- `afterAll(async () => { await prisma.$disconnect(); })` in integration tests.

## Mocking

**API — port-based mocking with `jest.Mocked<T>`:**

Because services receive all dependencies through port interfaces, unit tests build fully-typed mock objects with `jest.Mocked<Port>`:

```typescript
const documentRepository: jest.Mocked<DocumentRepoPort> = {
  create: jest.fn(),
  findById: jest.fn(),
  findManyByIds: jest.fn(),
  updateUploadStatus: jest.fn(),
  archiveByEntityAndType: jest.fn(),
  archive: jest.fn(),
  findMany: jest.fn(),
};

const eventBus: jest.Mocked<EventBus> = {
  publish: jest.fn().mockResolvedValue(undefined),
  publishDelayed: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

const logger: jest.Mocked<Logger> = {
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
```

Partial port mocking uses `jest.Mocked<Pick<Port, '<method>' | ...>>` plus a final `as unknown as jest.Mocked<Port>` cast — e.g., in `hussle-app-dispatch-api/src/invoices/__tests__/invoiceReadinessSubscriber.test.ts`.

**Module mocking** for cross-cutting helpers:

```typescript
jest.mock('../services/invoiceGenerationService', () => ({
  generateTonuInvoice: jest.fn(),
}));

jest.mock('../../shared/sequenceGenerator', () => ({
  generateSequenceNumber: jest.fn().mockResolvedValue('INV-0002'),
}));

const mockedGenerateTonuInvoice = generateTonuInvoice as jest.MockedFunction<
  typeof generateTonuInvoice
>;
```

`@/shared/emails` is mocked at the top of subscriber tests to stub out React Email rendering (see `hussle-app-dispatch-api/src/notifications/services/__tests__/notificationSubscriber.test.ts`).

**Event subscriber handler capture pattern:**

Subscribers register handlers via `eventBus.subscribe(eventName, queueGroup, handler)`. Tests reach the handler by inspecting `subscribe.mock.calls`:

```typescript
const extractHandler = <K extends keyof EventMap>(
  subscribeMock: jest.Mocked<EventBus>['subscribe'],
  eventName: K,
): ((data: EventMap[K]) => Promise<void>) => {
  const call = subscribeMock.mock.calls.find(([name]) => name === eventName);
  if (!call) throw new Error(`No subscription found for event: ${eventName}`);
  return call[2];
};
```

Or, capture handlers into a `Map<string, Handler>` from the mock implementation (see `notificationSubscriber.test.ts`):

```typescript
const handlers = new Map<string, Handler>();
const eventBus: EventBus = {
  publish: jest.fn(),
  publishDelayed: jest.fn(),
  subscribe: jest.fn(async (event: string, _group: string, handler: Handler) => {
    handlers.set(event, handler);
  }),
  close: jest.fn(),
};
```

**Integration test mocking** (`hussle-app-dispatch-api/src/documents/__tests__/integration/documentRoutes.integration.test.ts`):

Auth is the only thing mocked — the route + controller + service stack is wired manually inside the test with a stubbed `requireAuth` middleware that injects `req.user`:

```typescript
let currentUser: AuthenticatedUser | null = null;
jest.mock('@/middleware/auth', () => {
  const actual = jest.requireActual('@/middleware/auth');
  return {
    ...actual,
    requireAuth: (req, res, next) => {
      if (currentUser === null) {
        res.status(401).json({ errors: [{ message: 'Authentication required' }] });
        return;
      }
      req.user = currentUser;
      req.organizationId = currentUser.organizationId;
      next();
    },
  };
});
```

**Prisma / Redis / RabbitMQ are NOT touched** in unit tests — they are abstracted behind ports (`DocumentRepoPort`, `EventBus`, etc.) and replaced with `jest.fn()` implementations.

**UI — Formik factory + RTL queries:**

Form-field unit tests build a stub Formik shape with the factory pattern:

```typescript
const createMockFormik = (overrides = {}) => ({
  values: {},
  errors: {},
  touched: {},
  handleChange: jest.fn(),
  handleBlur: jest.fn(),
  setFieldValue: jest.fn(),
  ...overrides,
});

it('displays error when touched and has error', () => {
  const formik = createMockFormik({
    errors: { field: 'Required' },
    touched: { field: true },
  });
  render(<MyField name="field" label="Label" formik={formik} />);
  expect(screen.getByText('Required')).toBeInTheDocument();
});
```

**Child component mocking:**

```typescript
jest.mock('mocho/components/DebouncedInput', () => {
  const MockDebouncedInput = (props: Record<string, unknown>) => (
    <input
      data-testid="debounced-input"
      placeholder={props.placeholder as string}
      value={props.value as string}
      onChange={() => {}}
    />
  );
  MockDebouncedInput.displayName = 'MockDebouncedInput';
  return { __esModule: true, default: MockDebouncedInput };
});
```

**User interactions:** Use `userEvent.setup()` once per test, then call instance methods:

```typescript
const user = userEvent.setup();
await user.type(screen.getByRole('textbox'), 'test@example.com');
await user.click(screen.getByRole('button', { name: /submit/i }));
```

**What to mock:**
- All injected ports (repos, event buses, storage providers, loggers, email/SMS services).
- Cross-module helpers via `jest.mock('<module>', ...)`.
- React child components that pull from Redux or trigger network calls.
- Auth middleware in integration tests.

**What NOT to mock:**
- The system under test itself (the service factory, the controller, the component).
- Yup validators — exercise the real schema.
- Pure utility functions (`composeSmsBody`, `resolveStopTimezone`, etc.).
- Typed error classes — assert with `instanceof` against the real class.
- Third-party library internals.

## Render Helpers

**UI canonical helper:** `hussle-app-dispatch-ui/src/mocho/__tests__/test-utils.tsx`

```typescript
function customRender(
  ui: ReactElement,
  { themeMode = ThemeMode.LIGHT, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeCustomization mode={themeMode}>{children}</ThemeCustomization>;
  }
  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { customRender as render };
```

Import via `import { render, screen } from '<relative>/__tests__/test-utils'`. Override `render` with the custom one so all tests pick up the theme provider automatically.

**Inline alternative** — many older tests define their own minimal `renderWithTheme` helper inline:

```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
```

This pattern appears in `PageWrapper.test.tsx`, `ListKpiBar.test.tsx`, `FilterBar.test.tsx`, etc. Either approach is acceptable, but new tests should prefer the shared `test-utils` helper to reduce boilerplate.

**Accessibility-first query priority:**
1. `getByRole` (preferred)
2. `getByText`
3. `getByLabelText`
4. `getByTestId` (last resort — avoid in new code)

## Fixtures and Factories

**Pattern:** Build-helper factories with `<entity>: Partial<T> = {}` overrides at the top of the test file.

```typescript
const makeDocument = (overrides: Partial<DocumentWithUploader> = {}): DocumentWithUploader => ({
  id: 'doc-1',
  organizationId: 'org-1',
  entityType: 'load',
  entityId: 'load-1',
  type: 'BOL_SIGNED',
  fileName: 'bol.pdf',
  mimeType: 'application/pdf',
  s3Key: 'org-1/loads/load-1/bol_signed/bol.pdf',
  url: 'https://s3.example.com/presigned-put',
  uploadStatus: UPLOAD_STATUS.PENDING,
  isArchived: false,
  uploadedByUserId: 'user-1',
  uploadedByUser: { firstName: 'Alice', lastName: 'Adams' },
  // ...
  createdAt: new Date('2026-01-01'),
  ...overrides,
} as DocumentWithUploader);
```

Other examples:
- `buildMockDeps()` factory in `documentService.test.ts` and `invoiceReadinessSubscriber.test.ts`.
- `createMockDeps()` in `notificationSubscriber.test.ts`.
- `buildUser`, `buildService`, `buildDocument` in `documentRoutes.integration.test.ts`.
- `createMockLoad` in `loadStatusService.test.ts`.

**Fixture location:** Lives at the top of the test file (or in a sibling helper file in the same `__tests__/` directory). There is no central `fixtures/` directory — factories stay local to the suite that needs them.

## Coverage

**Configured but not strictly enforced:**

- API (`hussle-app-dispatch-api/package.json` `jest` block):
  ```json
  "collectCoverageFrom": [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/**/*.d.ts"
  ]
  ```
- Target documented in `hussle-app-dispatch-api/CLAUDE.md`: **90%** coverage across three tiers (unit, integration, security).
- No `coverageThreshold` block — CI does not currently fail on coverage drop.
- A `coverage/` directory exists at `hussle-app-dispatch-api/coverage/` — runs are checked in locally but not part of the validate gate.

**View coverage:**

```bash
cd hussle-app-dispatch-api
npx jest --coverage
```

UI has no coverage threshold configured.

## Test Types

**Unit tests (dominant tier):**
- Mock every injected port.
- Cover business-rule branches, error throws, event emissions.
- Live flat inside `<feature>/__tests__/` or `<feature>/services/__tests__/`.

**Integration tests (API only):**
- Live in `<feature>/__tests__/integration/<feature>Routes.integration.test.ts`.
- Wire route + controller + service stack manually inside the test (no `app.ts` import).
- Spin up Express via `http.createServer(app)`, drive with `fetch` against the random port. (`supertest` is mentioned in the template but the actual integration suites use Node's native `http` server + `fetch`.)
- Mock only auth + side-effect ports; everything else uses real factories.
- Examples:
  - `hussle-app-dispatch-api/src/documents/__tests__/integration/documentRoutes.integration.test.ts`
  - `hussle-app-dispatch-api/src/documents/__tests__/integration/archiveRoute.integration.test.ts`
  - `hussle-app-dispatch-api/src/short-links/__tests__/integration/shortLinkRoutes.integration.test.ts`

**Component tests (UI):**
- Render with theme wrapper, query by accessibility role/text.
- Mock heavy children and Redux-coupled descendants.
- Co-located with the component folder.

**Saga tests (UI):**
- Use `redux-saga-test-plan` (`expectSaga`, `testSaga`) — available as a devDependency.
- Located in `store/__tests__/` under each feature.

**E2E tests (UI):**
- Playwright 1.59. Config: `hussle-app-dispatch-ui/playwright.config.ts`.
- Specs under `hussle-app-dispatch-ui/e2e/`.
- Results write to `hussle-app-dispatch-ui/e2e-results/` and `playwright-report/`.

**Extension tests:**
- `dat-load-scraper/src/__tests__/*.test.ts`.
- Jest with `jsdom` environment, setup file at `src/__tests__/setup.ts`.

## Common Patterns

**Async testing:**

```typescript
it('throws NotFoundError when entity does not exist', async () => {
  mockDeps.entityRepo.findById.mockResolvedValue(null);

  await expect(
    verbEntity({ entityId: '999', requestingUserId: 'user-1' }, mockDeps)
  ).rejects.toThrow(NotFoundError);
});
```

**Error / typed-error testing:**

```typescript
import { NotFoundError, InvalidTransitionError } from '@/shared/errors';

await expect(service.transition(input)).rejects.toThrow(InvalidTransitionError);
await expect(service.transition(input)).rejects.toMatchObject({
  code: 'INVALID_STATUS_TRANSITION',
  statusCode: 422,
});
```

**Event emission assertions (API services):**

```typescript
const result = await service.confirm(input);
expect(result.events).toHaveLength(1);
expect(result.events[0]).toMatchObject({
  type: 'DOCUMENT_CONFIRMED',
  payload: { documentId: 'doc-1' },
});
```

**Repeated calls / order assertions:**

```typescript
expect(eventBus.subscribe).toHaveBeenCalledWith(
  'document.confirmed',
  'document-archive-service',
  expect.any(Function),
);
```

**Conditional rendering / state branches (UI):**

```typescript
it('loading takes precedence over error', () => {
  renderWithTheme(
    <PageWrapper isLoading isError>
      <div>Page Content</div>
    </PageWrapper>
  );
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
});
```

**Setup file polyfills (UI):**

`hussle-app-dispatch-ui/jest.setup.ts`:
```typescript
import { TextEncoder, TextDecoder } from 'util';
Object.assign(global, { TextEncoder, TextDecoder });
import '@testing-library/jest-dom';
```

**Jest moduleNameMapper notes (UI):** `hussle-app-dispatch-ui/jest.config.ts` resolves `@emotion/*` and `@testing-library/*` against the workspace's own `node_modules` (not the root), and routes `utils/axios` to a manual mock at `src/__mocks__/axios.ts` to avoid `import.meta.env` issues during tests. CSS, PNG, and SVG imports are stubbed via `identity-obj-proxy`.

**TS-Jest configuration (UI):** `tsconfig.test.json` is used for tests with `diagnostics: false`, and a custom transformer `jest.importMetaTransformer.ts` rewrites `import.meta.env.*` for the test runner.

## What to Test

Per `~/.claude/CLAUDE.md` and `hussle-app-dispatch-api/CLAUDE.md`:

- Business logic branches and edge cases.
- Error conditions and typed-error throwing.
- Authorization checks (ownership, role gating).
- Data scoping (correct `organizationId` filter passed to the repo).
- Event emission shapes.

## What NOT to Test

- Third-party library internals (Express, Prisma, MUI, AG Grid).
- Implementation details that may change (private helper structure, internal function names).
- Private functions directly — exercise them through their public caller.
- Framework plumbing (route registration, store wiring) — covered by integration tests.

---

*Testing analysis: 2026-05-13*
