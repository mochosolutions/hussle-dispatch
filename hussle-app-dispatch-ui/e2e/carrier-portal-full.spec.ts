import { expect, test } from '@playwright/test';

// STAB-14 — full 6-phase carrier portal walkthrough against mocked APIs.
//
// Strategy: the mocked GET /carrier-portal/session response seeds answers for
// every required field across all 6 phases. Each phase's form picks up its
// slice of those answers, validation passes, and the spec only needs to click
// "Save & Continue" to drive the saga path that Plan 06 wired up
// (handleSubmit → saveXxx saga → mocked 200 → saveXxxSuccess reducer →
// lastSavedPhase rising-edge useEffect → setCurrentPhase(+1)).
//
// Phase 4 is special: when all 6 cost fields are pre-populated,
// CarrierPortalPage swaps PhaseForm for CostResultCard (Plan 06 Task 3
// conditional render). The spec asserts CostResultCard is visible by the
// "COST ANALYSIS COMPLETE" overline, then clicks its "This looks right —
// Continue →" button to advance to phase 5.
//
// Per RESEARCH.md A4: "approve" in STAB-14 is interpreted as carrier-side
// submit reaching PortalCompleteView. Dispatcher-side approval is a
// separate concern (out of scope for this spec).
//
// Security: only fake tokens may appear in this file (RESEARCH.md § Security
// Domain). All API calls mocked via `page.route()` — no real backend reached.

const VALID_TOKEN = 'e2e-test-token';
const completedAt = '2026-05-13T12:00:00.000Z';

// Pre-seeded answers covering every required field across all 6 phases.
// Field IDs match the QuestionDefinition `id` values from each phase's
// questions file (companyQuestions.ts, equipmentQuestions.ts, etc.).
const SEEDED_ANSWERS: Record<string, unknown> = {
  // Phase 1 — Company (10 fields + address sub-fields)
  'company.name': 'E2E Test Carrier',
  'company.legalName': 'E2E Test Carrier LLC',
  'company.taxClassification': 'SOLE_PROPRIETOR',
  'company.mcNumber': 'MC123456',
  'company.dotNumber': '1234567',
  'company.tinType': 'EIN',
  'company.tin': '12-3456789',
  'company.phone': '+15555551234',
  'company.email': 'e2e@example.com',
  'company.address': '100 Main St',
  'company.city': 'Austin',
  'company.state': 'TX',
  'company.zip': '78701',
  'company.lat': 30.2672,
  'company.lng': -97.7431,

  // Phase 2 — Equipment (vehicleList, min 1 entry per buildPhaseSchema)
  'equipment.vehicles': [
    {
      category: 'TRACTOR',
      year: 2022,
      make: 'Freightliner',
      model: 'Cascadia',
      vin: '1FUJA6CK57LV12345',
      licensePlate: 'TX-12345',
      gvwr: 80000,
    },
  ],

  // Phase 3 — Drivers (driverList, NOT required — empty array passes)
  'drivers.entries': [],

  // Phase 4 — Cost Analysis (all 6 cost fields populated → triggers
  // CostResultCard conditional render in CarrierPortalPage line 332)
  'costAnalysis.truckPayment': 1200,
  'costAnalysis.insuranceCost': 1200,
  'costAnalysis.fuelCostPerGallon': 4.0,
  'costAnalysis.milesPerGallon': 6.0,
  'costAnalysis.maintenanceMonthlyCost': 500,
  'costAnalysis.otherMonthlyCosts': 250,
  'costAnalysis.ownsOutright': false,

  // Phase 5 — Lane Preferences (stateGrid, NOT required — empty object passes)
  'lanePreferences.statePreferences': {},

  // Phase 6 — Documents (1 sign + 3 uploads, all required)
  'docs.dispatchAgreement': true,
  'docs.insuranceCert': 'doc-coi-1',
  'docs.w9': 'doc-w9-1',
  'docs.carrierPacket': 'doc-packet-1',
};

test.describe('Carrier portal — full 6-phase flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Seed session — phase 1 (Company), pre-populated answers covering
    //    all 6 phases. This lets each phase's form mount in a valid state.
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
          carrier: { id: 'c1', name: 'E2E Test Carrier', email: 'e2e@example.com' },
          answers: SEEDED_ANSWERS,
        }),
      });
    });

    // 2. Per-phase save endpoints (5 phases).
    await page.route('**/api/v1/carrier-portal/company', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });
    await page.route('**/api/v1/carrier-portal/equipment', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });
    await page.route('**/api/v1/carrier-portal/drivers', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });
    await page.route('**/api/v1/carrier-portal/cost-analysis', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });
    await page.route('**/api/v1/carrier-portal/lane-preferences', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });

    // 3. Per-question autosave (PUT) — answers any auto-save call from the form.
    await page.route('**/api/v1/carrier-portal/session/answer', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });

    // 4. Document operations (Phase 6 — presign, confirm, sign).
    await page.route('**/api/v1/carrier-portal/documents/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"data":{}}' });
    });

    // 5. Final completion — emits completedAt so PortalCompleteView renders.
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
    // Smoke baseline (kept from Plan 01) — proves the spec wiring works
    // end-to-end against mocked APIs.
    await page.goto(`/carrier-portal/${VALID_TOKEN}`);
    await expect(page.getByText('Company').first()).toBeVisible({ timeout: 15000 });
  });

  test('invite → portal → all 6 phases → submit reaches completion view — STAB-14', async ({
    page,
  }) => {
    await page.goto(`/carrier-portal/${VALID_TOKEN}`);

    // Phase 1 (Company) — assert form is mounted with seeded data, then advance.
    await expect(page.getByText(/business name/i).first()).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /save & continue/i }).click();

    // Phase 2 (Equipment)
    await expect(page.getByText(/tell us about your vehicles/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /save & continue/i }).click();

    // Phase 3 (Drivers) — match on the hint (label "Drivers" alone collides
    // with the phase stepper rail).
    await expect(page.getByText(/add each driver/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /save & continue/i }).click();

    // Phase 4 (Cost Analysis) — CostResultCard renders immediately because
    // all 6 cost fields are pre-seeded (Plan 06 Task 3 BLOCKER 3 path).
    await expect(page.getByText(/cost analysis complete/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /this looks right/i }).click();

    // Phase 5 (Lane Preferences)
    await expect(page.getByText(/which states do you prefer/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /save & continue/i }).click();

    // Phase 6 (Documents)
    await expect(page.getByText(/sign the dispatch agreement/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /save & continue/i }).click();

    // Completion view — heading "You're submitted, {name}." (typographic
    // apostrophe in source, hence `.?` to match either ' or '’).
    await expect(page.getByText(/you.?re submitted/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/what you completed/i)).toBeVisible();
  });
});
