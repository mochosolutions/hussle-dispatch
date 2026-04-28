import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

// Status-transition coverage for the driver portal.
// Verifies that:
//  1. Each driver-side transition shows the correct button label and advances
//     the load to the next status when clicked.
//  2. Terminal statuses do not render an action button.
//  3. When geolocation is granted, coords are captured and sent with the
//     transition (via the /load/check-in call the page makes immediately
//     before /load/status).
//  4. When geolocation is denied, the transition still succeeds.
//  5. A network error during a transition surfaces a retryable error and the
//     subsequent retry succeeds.

interface MockStop {
  id: string;
  type: 'PICKUP' | 'DELIVERY';
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  appointmentStart: string | null;
  appointmentEnd: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
}

interface MockLoad {
  id: string;
  loadNumber: string;
  status: string;
  equipmentType: string | null;
  commodity: string | null;
  weight: number | null;
  driverInstructions: string | null;
  stops: MockStop[];
  driver: { firstName: string; lastName: string } | null;
}

const fulfillJson = async (
  route: Route,
  status: number,
  body: Record<string, unknown>,
): Promise<void> => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
};

const buildLoad = (status: string): MockLoad => ({
  id: 'load-status-1',
  loadNumber: 'LD-2026-9001',
  status,
  equipmentType: 'DRY_VAN',
  commodity: 'General Freight',
  weight: 25000,
  driverInstructions: null,
  stops: [
    {
      id: 'pickup-1',
      type: 'PICKUP',
      sequence: 1,
      facilityName: 'ACME Warehouse',
      address: '123 Main St',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      appointmentStart: '2026-04-26T14:00:00.000Z',
      appointmentEnd: '2026-04-26T16:00:00.000Z',
      contactName: 'John Smith',
      contactPhone: '5551234567',
      notes: null,
    },
    {
      id: 'delivery-1',
      type: 'DELIVERY',
      sequence: 2,
      facilityName: 'Beta Receiving',
      address: '900 Commerce St',
      city: 'Houston',
      state: 'TX',
      zip: '77002',
      appointmentStart: '2026-04-27T20:00:00.000Z',
      appointmentEnd: '2026-04-27T22:00:00.000Z',
      contactName: 'Mary Jones',
      contactPhone: '5559876543',
      notes: null,
    },
  ],
  driver: { firstName: 'Jane', lastName: 'Doe' },
});

const attachConsoleErrorWatcher = (page: Page): string[] => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(err.message);
  });
  return errors;
};

// Helper: install a load endpoint mock whose returned status advances on a
// stage-by-stage basis. React StrictMode in dev runs effects twice, so we
// can't use a simple index counter — instead, the test calls
// `advance()` to transition to the next stage. Until then, the GET endpoint
// keeps returning the current stage's status.
interface LoadEndpointController {
  advance: () => void;
  getCallCount: () => number;
}

const installLoadEndpointSequence = async (
  page: Page,
  statuses: string[],
): Promise<LoadEndpointController> => {
  let stageIndex = 0;
  let callCount = 0;
  await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    const status = statuses[Math.min(stageIndex, statuses.length - 1)];
    callCount += 1;
    await fulfillJson(route, 200, { data: buildLoad(status) });
  });
  return {
    advance: () => {
      stageIndex += 1;
    },
    getCallCount: () => callCount,
  };
};

const installStatusEndpoint = async (
  page: Page,
  responder: (route: Route) => Promise<void>,
): Promise<void> => {
  await page.route('**/api/v1/driver-portal/portal/load/status*', responder);
};

const installCheckInEndpoint = async (
  page: Page,
  responder?: (route: Route) => Promise<void>,
): Promise<void> => {
  await page.route('**/api/v1/driver-portal/portal/load/check-in*', async (route) => {
    if (responder) {
      await responder(route);
      return;
    }
    await fulfillJson(route, 200, { data: { success: true } });
  });
};

interface ButtonExpectation {
  startStatus: string;
  nextStatus: string;
  buttonLabel: string;
  nextStatusChip: string;
}

// Em-dash 0x2014 used in the page source for AT_PICKUP.
const TRANSITIONS: ButtonExpectation[] = [
  {
    startStatus: 'DISPATCHED',
    nextStatus: 'EN_ROUTE_PICKUP',
    buttonLabel: 'Start Route to Pickup',
    nextStatusChip: 'En Route to Pickup',
  },
  {
    startStatus: 'EN_ROUTE_PICKUP',
    nextStatus: 'AT_PICKUP',
    buttonLabel: 'Arrived at Pickup',
    nextStatusChip: 'At Pickup',
  },
  {
    startStatus: 'AT_PICKUP',
    nextStatus: 'IN_TRANSIT',
    buttonLabel: 'Loaded — Start Transit',
    nextStatusChip: 'In Transit',
  },
  {
    startStatus: 'IN_TRANSIT',
    nextStatus: 'AT_DELIVERY',
    buttonLabel: 'Arrived at Delivery',
    nextStatusChip: 'At Delivery',
  },
  {
    startStatus: 'AT_DELIVERY',
    nextStatus: 'DELIVERED',
    buttonLabel: 'Mark Delivered',
    nextStatusChip: 'Delivered',
  },
];

const grantGeolocation = async (
  context: BrowserContext,
  latitude: number,
  longitude: number,
): Promise<void> => {
  await context.grantPermissions(['geolocation'], { origin: 'http://localhost:5173' });
  await context.setGeolocation({ latitude, longitude });
};

const screenshotPath = (page: Page, name: string): string => {
  const viewport = page.viewportSize()?.width ?? 0;
  const label = viewport >= 1000 ? 'desktop' : 'mobile';
  return `e2e-results/screenshots/status-transitions-${name}-${label}.png`;
};

test.describe('Driver portal status transitions', () => {
  test.beforeEach(async ({ context }) => {
    // Default: no geolocation permission. Individual tests opt-in.
    await context.clearPermissions();
  });

  for (const transition of TRANSITIONS) {
    test(`shows '${transition.buttonLabel}' button and advances ${transition.startStatus} -> ${transition.nextStatus}`, async ({
      page,
      context,
    }) => {
      const consoleErrors = attachConsoleErrorWatcher(page);
      // GPS denied for these per-transition tests so we don't tangle the
      // assertion with check-in body shape.
      await context.clearPermissions();

      const loadEndpoint = await installLoadEndpointSequence(page, [
        transition.startStatus,
        transition.nextStatus,
      ]);
      const statusRequests: { url: string; body: string | null }[] = [];
      await installStatusEndpoint(page, async (route) => {
        statusRequests.push({
          url: route.request().url(),
          body: route.request().postData(),
        });
        loadEndpoint.advance();
        await fulfillJson(route, 200, {
          data: { success: true, status: transition.nextStatus },
        });
      });
      await installCheckInEndpoint(page);

      await page.goto(`/driver-portal/token-${transition.startStatus.toLowerCase()}`);

      const button = page.getByRole('button', { name: transition.buttonLabel, exact: true });
      await expect(button).toBeVisible({ timeout: 15000 });
      await expect(button).toBeEnabled();

      await page.screenshot({
        path: screenshotPath(page, `before-${transition.startStatus}`),
        fullPage: true,
      });

      await button.click();

      // Wait for the transition POST to land.
      await expect.poll(() => statusRequests.length, { timeout: 15000 }).toBeGreaterThan(0);

      // Status chip should reflect the new status after re-fetch.
      const chip = page.getByText(transition.nextStatusChip, { exact: true }).first();
      await expect(chip).toBeVisible({ timeout: 15000 });

      // Status request body must contain the new status.
      const lastBody = statusRequests[statusRequests.length - 1]?.body ?? '';
      const parsed: { status?: string } = lastBody ? JSON.parse(lastBody) : {};
      expect(parsed.status).toBe(transition.nextStatus);

      await page.screenshot({
        path: screenshotPath(page, `after-${transition.nextStatus}`),
        fullPage: true,
      });

      expect(
        consoleErrors,
        `console errors during transition: ${consoleErrors.join(' | ')}`,
      ).toEqual([]);
    });
  }

  for (const terminal of ['DELIVERED', 'CANCELED', 'TONU', 'INVOICE_PENDING']) {
    test(`renders no advance button for terminal status ${terminal}`, async ({ page }) => {
      const consoleErrors = attachConsoleErrorWatcher(page);
      await installLoadEndpointSequence(page, [terminal]);
      await installStatusEndpoint(page, async (route) => {
        // Should never be called.
        await fulfillJson(route, 500, { errors: [{ message: 'should not be called' }] });
      });
      await installCheckInEndpoint(page);

      await page.goto(`/driver-portal/token-${terminal.toLowerCase()}`);

      // Wait for the load to render.
      await expect(page.getByRole('heading', { name: /Load LD-2026-9001/ })).toBeVisible({
        timeout: 15000,
      });

      // No advance button for any of the driver-side transition labels.
      const advanceButtons = page.getByRole('button', {
        name: /Start Route to Pickup|Arrived at Pickup|Loaded.*Start Transit|Arrived at Delivery|Mark Delivered/,
      });
      await expect(advanceButtons).toHaveCount(0);

      await page.screenshot({
        path: screenshotPath(page, `terminal-${terminal}`),
        fullPage: true,
      });

      expect(
        consoleErrors,
        `console errors for terminal status: ${consoleErrors.join(' | ')}`,
      ).toEqual([]);
    });
  }

  test('GPS granted: coords captured and sent with the transition', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    const lat = 39.7392;
    const lng = -104.9903;
    await grantGeolocation(context, lat, lng);

    const loadEndpoint = await installLoadEndpointSequence(page, [
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
    ]);

    let statusBody: string | null = null;
    await installStatusEndpoint(page, async (route) => {
      statusBody = route.request().postData();
      loadEndpoint.advance();
      await fulfillJson(route, 200, {
        data: { success: true, status: 'EN_ROUTE_PICKUP' },
      });
    });

    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-gps-granted');

    const button = page.getByRole('button', { name: 'Start Route to Pickup', exact: true });
    await expect(button).toBeVisible({ timeout: 15000 });
    await button.click();

    // Wait for the status request.
    await expect.poll(() => statusBody, { timeout: 15000 }).not.toBeNull();

    // The page captures GPS, then issues a check-in with lat/lng/status, then
    // calls /load/status. Coords must be present on the check-in request.
    expect(checkInBody, 'check-in request should fire when GPS is granted').not.toBeNull();
    const parsedCheckIn: { latitude?: number; longitude?: number; status?: string } =
      checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsedCheckIn.latitude).toBeCloseTo(lat, 3);
    expect(parsedCheckIn.longitude).toBeCloseTo(lng, 3);
    expect(parsedCheckIn.status).toBe('EN_ROUTE_PICKUP');

    // The /load/status body itself only contains the status (current API
    // shape — see driverPortalApi.advanceStatus).
    const parsedStatus: { status?: string } = statusBody !== null ? JSON.parse(statusBody) : {};
    expect(parsedStatus.status).toBe('EN_ROUTE_PICKUP');

    await page.screenshot({
      path: screenshotPath(page, 'gps-granted'),
      fullPage: true,
    });

    expect(
      consoleErrors,
      `console errors during GPS-granted transition: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('GPS denied: transition still succeeds without coords', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    // No grantPermissions for geolocation -> denied/unavailable.
    await context.clearPermissions();

    const loadEndpoint = await installLoadEndpointSequence(page, [
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
    ]);

    let statusBody: string | null = null;
    await installStatusEndpoint(page, async (route) => {
      statusBody = route.request().postData();
      loadEndpoint.advance();
      await fulfillJson(route, 200, {
        data: { success: true, status: 'EN_ROUTE_PICKUP' },
      });
    });

    let checkInCalled = false;
    await installCheckInEndpoint(page, async (route) => {
      checkInCalled = true;
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-gps-denied');

    const button = page.getByRole('button', { name: 'Start Route to Pickup', exact: true });
    await expect(button).toBeVisible({ timeout: 15000 });
    await button.click();

    // Status call should still succeed.
    await expect.poll(() => statusBody, { timeout: 20000 }).not.toBeNull();
    const parsedStatus: { status?: string } = statusBody !== null ? JSON.parse(statusBody) : {};
    expect(parsedStatus.status).toBe('EN_ROUTE_PICKUP');

    // No check-in call when there are no coords.
    expect(checkInCalled).toBe(false);

    // No error UI.
    await expect(page.getByRole('alert').filter({ hasText: /Failed to update status/ })).toHaveCount(
      0,
    );

    // Status chip advances.
    await expect(page.getByText('En Route to Pickup', { exact: true })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: screenshotPath(page, 'gps-denied'),
      fullPage: true,
    });

    expect(
      consoleErrors,
      `console errors during GPS-denied transition: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('network failure during transition: shows retryable error and recovers', async ({
    page,
    context,
  }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    // First POST returns 500 (no advance). Second POST succeeds and advances.
    const loadEndpoint = await installLoadEndpointSequence(page, [
      'DISPATCHED',
      'EN_ROUTE_PICKUP',
    ]);

    let statusCalls = 0;
    await installStatusEndpoint(page, async (route) => {
      statusCalls += 1;
      if (statusCalls === 1) {
        await fulfillJson(route, 500, {
          errors: [{ message: 'Internal server error' }],
        });
        return;
      }
      loadEndpoint.advance();
      await fulfillJson(route, 200, {
        data: { success: true, status: 'EN_ROUTE_PICKUP' },
      });
    });
    await installCheckInEndpoint(page);

    await page.goto('/driver-portal/token-retry');

    const button = page.getByRole('button', { name: 'Start Route to Pickup', exact: true });
    await expect(button).toBeVisible({ timeout: 15000 });
    await button.click();

    // Wait for the failure to be reflected in the UI.
    const errorAlert = page.getByRole('alert').filter({ hasText: /Failed|error|500/i }).first();
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Button must be re-enabled for retry.
    await expect(button).toBeEnabled({ timeout: 15000 });

    await page.screenshot({
      path: screenshotPath(page, 'retry-error-shown'),
      fullPage: true,
    });

    // Retry.
    await button.click();

    // Status chip should advance to "En Route to Pickup".
    await expect(page.getByText('En Route to Pickup', { exact: true })).toBeVisible({
      timeout: 15000,
    });

    expect(statusCalls).toBeGreaterThanOrEqual(2);

    await page.screenshot({
      path: screenshotPath(page, 'retry-recovered'),
      fullPage: true,
    });

    // Browser logs a "Failed to load resource ... 500" entry for the
    // intentionally-failed request. That's expected here — filter it out and
    // assert no other console errors occurred.
    const unexpectedErrors = consoleErrors.filter(
      (msg) => !/Failed to load resource.*500/i.test(msg),
    );
    expect(
      unexpectedErrors,
      `unexpected console errors during retry flow: ${unexpectedErrors.join(' | ')}`,
    ).toEqual([]);
  });
});
