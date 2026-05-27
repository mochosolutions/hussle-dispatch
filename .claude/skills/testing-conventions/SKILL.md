# Testing Conventions

Test patterns, naming, structure, and quality standards for all implementation agents.

> **Note:** The code examples below use common JavaScript/TypeScript testing tools (vitest, supertest, @testing-library/react, Playwright) as reference patterns. Agents should adapt these to the actual testing framework configured in the package. The package's CLAUDE.md and existing tests are the primary reference for project-specific conventions.

---

## File Structure

### Backend

```
src/<module>/
├── __tests__/
│   ├── unit/
│   │   ├── <module>Service.test.ts
│   │   └── <module>Validation.test.ts
│   └── integration/
│       └── <module>Endpoints.test.ts
```

### Frontend

```
src/pages/<page>/
├── __tests__/
│   ├── <Page>.test.tsx          (component tests)
│   └── <Page>.e2e.spec.ts       (E2E, if applicable)
src/hooks/api/
├── __tests__/
│   └── use<Resource>.test.ts    (hook tests)
```

---

## Naming Conventions

### Test Files

- Unit tests: `<subject>.test.ts`
- Integration tests: `<subject>Endpoints.test.ts`
- Component tests: `<Component>.test.tsx`
- E2E tests: `<flow>.e2e.spec.ts`

### Test Cases

Use this format: `it('should <expected behavior> when <condition>')`

```typescript
// Good
it('should return paginated shifts when valid orgId provided')
it('should throw NotFoundError when shift does not exist')
it('should render empty state when no shifts returned')

// Bad
it('works correctly')
it('test create shift')
it('handles error')
```

### Describe Blocks

```typescript
describe('<ModuleName>Service', () => {
  describe('create', () => {
    it('should create a shift when valid data provided', ...)
    it('should throw ValidationError when startTime >= endTime', ...)
    it('should throw ConflictError when overlapping shift exists', ...)
  })

  describe('findMany', () => {
    it('should return paginated results with default limit', ...)
    it('should filter by status when status param provided', ...)
  })
})
```

---

## Unit Test Pattern

Mock all ports. Test business logic only. Arrange-Act-Assert.

### Backend Service Tests

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createShiftService } from '../services/shiftService'
import type { ShiftRepoPort } from '../types/ShiftRepoPort'

describe('ShiftService', () => {
  let service: ReturnType<typeof createShiftService>
  let mockRepo: ShiftRepoPort

  beforeEach(() => {
    // Arrange: create mock port implementation
    mockRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    service = createShiftService({ shiftRepo: mockRepo })
  })

  describe('create', () => {
    it('should create a shift when valid data provided', async () => {
      // Arrange
      const input = {
        facilityId: 'fac_001',
        orgId: 'org_001',
        startTime: new Date('2026-02-15T08:00:00Z'),
        endTime: new Date('2026-02-15T16:00:00Z'),
      }
      const expected = { id: 'shift_001', ...input, status: 'open' }
      vi.mocked(mockRepo.create).mockResolvedValue(expected)

      // Act
      const result = await service.create(input)

      // Assert
      expect(result).toEqual(expected)
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'open' })
      )
    })

    it('should throw ValidationError when startTime >= endTime', async () => {
      // Arrange
      const input = {
        facilityId: 'fac_001',
        orgId: 'org_001',
        startTime: new Date('2026-02-15T16:00:00Z'),
        endTime: new Date('2026-02-15T08:00:00Z'), // Before start
      }

      // Act & Assert
      await expect(service.create(input)).rejects.toThrow('ValidationError')
      expect(mockRepo.create).not.toHaveBeenCalled()
    })
  })
})
```

### Key Principles

- Mock at the PORT level, never mock internal functions
- Services receive dependencies via factory function parameter (dependency injection)
- Test the SERVICE behavior, not the repository implementation
- Each test case tests ONE behavior
- Use realistic data, not empty strings or zeroes
- Test error paths as thoroughly as success paths

---

## Integration Test Pattern

Test endpoints with real HTTP requests. Mock external services if needed but use real middleware chain.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../../app'

describe('Shift Endpoints', () => {
  let app: Express.Application
  let authToken: string

  beforeAll(async () => {
    app = createApp({ /* test config */ })
    // Obtain auth token for test user
    authToken = await getTestAuthToken()
  })

  describe('POST /api/org/:orgId/shifts', () => {
    it('should create a shift and return 201', async () => {
      const res = await request(app)
        .post('/api/org/org_test/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          facilityId: 'fac_001',
          startTime: '2026-02-15T08:00:00Z',
          endTime: '2026-02-15T16:00:00Z',
        })

      expect(res.status).toBe(201)
      expect(res.body.data).toMatchObject({
        facilityId: 'fac_001',
        status: 'open',
      })
      expect(res.body.data.id).toMatch(/^shift_/)
    })

    it('should return 400 when startTime >= endTime', async () => {
      const res = await request(app)
        .post('/api/org/org_test/shifts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          facilityId: 'fac_001',
          startTime: '2026-02-15T16:00:00Z',
          endTime: '2026-02-15T08:00:00Z',
        })

      expect(res.status).toBe(400)
      expect(res.body.error).toBe('ValidationError')
    })

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/org/org_test/shifts')
        .send({ facilityId: 'fac_001' })

      expect(res.status).toBe(401)
    })
  })
})
```

---

## Frontend Component Test Pattern

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShiftListPage } from '../ShiftListPage'

// Wrap component with required providers
function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('ShiftListPage', () => {
  it('should render loading state initially', () => {
    renderWithProviders(<ShiftListPage />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should render shift data in grid after loading', async () => {
    renderWithProviders(<ShiftListPage />)
    await waitFor(() => {
      expect(screen.getByText('Open')).toBeInTheDocument()
    })
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1) // header + data rows
  })

  it('should render empty state when no shifts exist', async () => {
    // Mock hook to return empty array
    renderWithProviders(<ShiftListPage />)
    await waitFor(() => {
      expect(screen.getByText(/no shifts found/i)).toBeInTheDocument()
    })
  })
})
```

---

## Playwright E2E Pattern

```typescript
// src/__tests__/e2e/shifts/shift-crud.e2e.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Shift Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to shifts
    await page.goto('/shifts')
    await page.waitForLoadState('networkidle')
  })

  test('should display shift list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Shifts' })).toBeVisible()
    await expect(page.getByRole('grid')).toBeVisible()
  })

  test('should create a new shift', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Shift' }).click()
    await page.getByLabel('Facility').fill('Main Hospital')
    await page.getByLabel('Start Time').fill('2026-02-15T08:00')
    await page.getByLabel('End Time').fill('2026-02-15T16:00')
    await page.getByRole('button', { name: 'Save' }).click()

    // Verify redirect to list and new shift appears
    await expect(page).toHaveURL('/shifts')
    await expect(page.getByText('Main Hospital')).toBeVisible()
  })
})
```

### When to Write E2E Tests

- During implementation with mocks: smoke tests — page loads, grid renders, basic interactions work
- During integration with real API: full CRUD flows — create, read, update, delete end-to-end
- Run via the E2E command documented in the package's CLAUDE.md
- Screenshots on failure if supported by the E2E framework

---

## What to Test

### Always Test

- Happy path for each task's acceptance criteria
- Input validation (boundary values, required fields, type mismatches)
- Error handling (what happens when dependencies fail)
- Auth/permissions (unauthorized access attempts)
- Edge cases mentioned in the PRD or contract

### Never Test

- Framework internals (don't test that React renders, that Express routes)
- Third-party library behavior
- Private implementation details that could change without affecting behavior
- Simple getters/setters with no logic
- TypeScript type correctness (the compiler handles this)

---

## Test Output Management

Always redirect test output to `/tmp` — never let raw output flow into context.

```bash
# Run tests — ALWAYS redirect to file
npx vitest --run > /tmp/test-results.txt 2>&1
echo "EXIT_CODE: $?"

# On failure — read compact summary
head -30 /tmp/test-results.txt
```

For framework-specific output parsing (e.g., JSON reporters, structured output), check the package's CLAUDE.md for documented patterns. Fall back to `head -30` if no specific parsing is documented.
