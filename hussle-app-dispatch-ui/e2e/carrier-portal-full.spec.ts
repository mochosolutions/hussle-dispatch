import { expect, test } from '@playwright/test';

// Wave 0 scaffold — covers STAB-14 (full 6-phase flow). Today only a smoke
// test runs; the full-flow test stays skipped until Plan 08 enables it.
//
// Security: only fake tokens may appear in this file (RESEARCH.md § Security
// Domain). The smoke test relies on every relevant API endpoint being mocked
// via `page.route()` so it never depends on a live backend.

const VALID_TOKEN = 'e2e-test-token';

const completedAt = '2026-05-13T12:00:00.000Z';

test.describe('Carrier portal — full 6-phase flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Seed session — phase 1 (Company), nothing completed.
    await page.route('**/api/v1/carrier-portal/session', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 's1',
            currentPhase: 1,
            completedPhases: [],
            completedAt: null,
          },
          carrier: { id: 'c1', name: 'E2E Test Carrier', email: 'test@example.com' },
          answers: {},
        }),
      });
    });

    // 2. Phase save endpoints (5 phases).
    await page.route('**/api/v1/carrier-portal/company', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });
    await page.route('**/api/v1/carrier-portal/equipment', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });
    await page.route('**/api/v1/carrier-portal/drivers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });
    await page.route('**/api/v1/carrier-portal/cost-analysis', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });
    await page.route('**/api/v1/carrier-portal/lane-preferences', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });

    // 3. Per-question autosave (PUT) — answers any auto-save call from the form.
    await page.route('**/api/v1/carrier-portal/session/answer', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: {} }),
      });
    });

    // 4. Final completion — emits a completedAt so PortalCompleteView can render.
    await page.route('**/api/v1/carrier-portal/session/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 's1',
            currentPhase: 6,
            completedPhases: [1, 2, 3, 4, 5, 6],
            completedAt,
          },
        }),
      });
    });
  });

  test('invite → portal renders phase 1', async ({ page }) => {
    // Smoke baseline — proves the spec wiring works end-to-end against mocked APIs.
    await page.goto(`/carrier-portal/${VALID_TOKEN}`);

    // The portal lists the 6 phases in PortalLayout; "Company" is always visible
    // on the phase rail before any interaction has happened.
    await expect(page.getByText('Company').first()).toBeVisible({ timeout: 15000 });
  });

  test.skip('invite → portal → all 6 phases → submit reaches completion view — STAB-14', async () => {
    // Plan 08 will fill this in:
    // 1. Walk Company → Equipment → Drivers → Cost → Lane → Documents
    // 2. Click Save & Continue on each phase
    // 3. Click Submit on the final phase
    // 4. Assert PortalCompleteView renders (session.completedAt is non-null)
  });
});
