import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

// US-05 — driver-initiated check-in coverage.
//
// Covers the dedicated "Add Note / ETA Update" form on DriverPortalPage and
// the standalone DriverLocationButton ("Share My Location") quick-share. The
// auto-fire check-in that piggybacks on a status transition is covered in
// status-transitions.spec.ts.
//
// Scenarios:
//  1. Notes + auto-captured GPS submit successfully (form path)
//  2. Location-only quick share via DriverLocationButton
//  3. Submit button is disabled when notes is empty (form path)
//  4. 2000-char notes accepted (max length, server-side cap)
//  5. 2001+ char input is truncated to 2000 by client-side maxLength (HTML
//     attribute). Verifies textarea inputValue caps at 2000 — server never
//     sees the over-length payload.
//  6. GPS unavailable does not block the form check-in submission
//  7. Network error mid-submit: error visible, notes preserved, retry succeeds

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
  id: 'load-checkin-1',
  loadNumber: 'LD-2026-CHK1',
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

const installLoadEndpoint = async (page: Page, status: string): Promise<void> => {
  await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await fulfillJson(route, 200, { data: buildLoad(status) });
  });
};

const installCheckInEndpoint = async (
  page: Page,
  responder: (route: Route) => Promise<void>,
): Promise<void> => {
  await page.route('**/api/v1/driver-portal/portal/load/check-in*', responder);
};

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
  return `e2e-results/screenshots/check-in-${name}-${label}.png`;
};

const filterExpectedConsoleErrors = (errors: string[]): string[] =>
  // 4xx/5xx responses produce a "Failed to load resource" console entry
  // that we want to ignore in error-path tests.
  errors.filter((msg) => !/Failed to load resource.*\b(400|500)\b/i.test(msg));

const noteTextarea = (page: Page) =>
  page.getByPlaceholder('Enter notes or ETA update...');

const submitNoteButton = (page: Page) =>
  page.getByRole('button', { name: 'Submit Note', exact: true });

const shareLocationButton = (page: Page) =>
  page.getByRole('button', { name: /Share My Location/i });

test.describe('Driver portal check-in submission', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearPermissions();
  });

  test('submits notes + auto-captured GPS successfully', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    const lat = 39.7392;
    const lng = -104.9903;
    await grantGeolocation(context, lat, lng);

    await installLoadEndpoint(page, 'DISPATCHED');
    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-checkin-success');

    await expect(submitNoteButton(page)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: screenshotPath(page, 'form-empty'), fullPage: true });

    const noteText =
      'Loaded at pickup, heading out now. Should arrive at delivery on schedule.';
    await noteTextarea(page).fill(noteText);

    await submitNoteButton(page).click();

    await expect.poll(() => checkInBody, { timeout: 15000 }).not.toBeNull();
    const parsed: { notes?: string; latitude?: number; longitude?: number } =
      checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsed.notes).toBe(noteText);
    expect(parsed.latitude).toBeCloseTo(lat, 3);
    expect(parsed.longitude).toBeCloseTo(lng, 3);

    // Success alert visible and notes cleared.
    await expect(page.getByRole('alert').filter({ hasText: /Note submitted/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(noteTextarea(page)).toHaveValue('');

    await page.screenshot({ path: screenshotPath(page, 'form-success'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during note submit: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('shares location via DriverLocationButton without notes', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    const lat = 41.8781;
    const lng = -87.6298;
    await grantGeolocation(context, lat, lng);

    await installLoadEndpoint(page, 'IN_TRANSIT');
    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-share-location');

    const shareBtn = shareLocationButton(page);
    await expect(shareBtn).toBeVisible({ timeout: 15000 });
    await shareBtn.click();

    await expect.poll(() => checkInBody, { timeout: 15000 }).not.toBeNull();
    const parsed: { notes?: string; latitude?: number; longitude?: number } =
      checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsed.latitude).toBeCloseTo(lat, 3);
    expect(parsed.longitude).toBeCloseTo(lng, 3);
    // The component no longer sends a synthetic 'Location update' note —
    // notes is omitted entirely so the request body has only lat/lng/etc.
    expect(parsed.notes).toBeUndefined();

    await expect(page.getByRole('alert').filter({ hasText: /Location shared/i })).toBeVisible({
      timeout: 15000,
    });
    // The notes textarea should remain untouched (empty) since the user
    // didn't type anything in the form.
    await expect(noteTextarea(page)).toHaveValue('');

    await page.screenshot({ path: screenshotPath(page, 'share-success'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during share location: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('Submit Note button is disabled when notes is empty', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    await installLoadEndpoint(page, 'DISPATCHED');
    let checkInCalled = false;
    await installCheckInEndpoint(page, async (route) => {
      checkInCalled = true;
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-empty-notes');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    // Empty notes -> button disabled. Also verify trim: whitespace-only is
    // treated as empty.
    await expect(submitBtn).toBeDisabled();
    await noteTextarea(page).fill('   ');
    await expect(submitBtn).toBeDisabled();
    await noteTextarea(page).fill('actual note');
    await expect(submitBtn).toBeEnabled();

    // Confirm no request was made while disabled.
    expect(checkInCalled).toBe(false);

    await page.screenshot({ path: screenshotPath(page, 'empty-notes-disabled'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during empty-notes test: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('accepts 2000-character notes', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    await installLoadEndpoint(page, 'DISPATCHED');
    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-2000-chars');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    const longNote = 'x'.repeat(2000);
    await noteTextarea(page).fill(longNote);
    await expect(submitBtn).toBeEnabled();

    await submitBtn.click();

    await expect.poll(() => checkInBody, { timeout: 15000 }).not.toBeNull();
    const parsed: { notes?: string } = checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsed.notes?.length).toBe(2000);

    await expect(page.getByRole('alert').filter({ hasText: /Note submitted/i })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({ path: screenshotPath(page, '2000-chars-accepted'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during 2000-char submit: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('truncates input to 2000 characters via client-side maxLength', async ({
    page,
    context,
  }) => {
    // The notes textarea declares inputProps={{ maxLength: 2000 }}. When the
    // user attempts to input 2001 characters, the browser caps the value at
    // 2000 before the change reaches Formik/state, so the server never sees an
    // over-length payload. We verify the textarea value caps at 2000 and the
    // submitted body.notes.length === 2000.
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    await installLoadEndpoint(page, 'DISPATCHED');
    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-too-long');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    const tooLong = 'y'.repeat(2001);
    await noteTextarea(page).fill(tooLong);
    // maxLength=2000 truncates input — textarea reflects 2000 chars, not 2001.
    const actual = await noteTextarea(page).inputValue();
    expect(actual.length).toBe(2000);

    await submitBtn.click();

    await expect.poll(() => checkInBody, { timeout: 15000 }).not.toBeNull();
    const parsed: { notes?: string } = checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsed.notes?.length).toBe(2000);

    await expect(page.getByRole('alert').filter({ hasText: /Note submitted/i })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({ path: screenshotPath(page, '2001-truncated'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during 2001-truncate test: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('surfaces server validation error message when server rejects notes', async ({
    page,
    context,
  }) => {
    // Defensive: even though client-side maxLength caps at 2000, the page must
    // surface the server's structured error message (errors[0].message) when
    // the server returns 400. We force the server to reject with the validator
    // message and assert a substring match.
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    await installLoadEndpoint(page, 'DISPATCHED');
    await installCheckInEndpoint(page, async (route) => {
      await fulfillJson(route, 400, {
        errors: [{ message: 'body.notes must be at most 2000 characters' }],
      });
    });

    await page.goto('/driver-portal/token-server-reject');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    await noteTextarea(page).fill('valid client-side note');
    await submitBtn.click();

    // Assert friendly server message, not the generic axios "Request failed..."
    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /at most 2000/i })
      .first();
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    expect(
      filterExpectedConsoleErrors(consoleErrors),
      `unexpected console errors: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('GPS unavailable does not block check-in submit', async ({ page, context }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    // No grantPermissions for geolocation -> denied/unavailable.
    await context.clearPermissions();

    await installLoadEndpoint(page, 'EN_ROUTE_PICKUP');
    let checkInBody: string | null = null;
    await installCheckInEndpoint(page, async (route) => {
      checkInBody = route.request().postData();
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-no-gps');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    const note = 'Running 30 minutes late due to traffic.';
    await noteTextarea(page).fill(note);
    await submitBtn.click();

    // Even without GPS, the request must fire and notes must be submitted.
    await expect.poll(() => checkInBody, { timeout: 20000 }).not.toBeNull();
    const parsed: { notes?: string; latitude?: number; longitude?: number } =
      checkInBody !== null ? JSON.parse(checkInBody) : {};
    expect(parsed.notes).toBe(note);
    expect(parsed.latitude).toBeUndefined();
    expect(parsed.longitude).toBeUndefined();

    await expect(page.getByRole('alert').filter({ hasText: /Note submitted/i })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({ path: screenshotPath(page, 'no-gps-success'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during no-GPS submit: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('network error mid-submit: error visible, notes preserved, retry succeeds', async ({
    page,
    context,
  }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await context.clearPermissions();

    await installLoadEndpoint(page, 'IN_TRANSIT');

    let calls = 0;
    await installCheckInEndpoint(page, async (route) => {
      calls += 1;
      if (calls === 1) {
        await fulfillJson(route, 500, {
          errors: [{ message: 'Internal server error' }],
        });
        return;
      }
      await fulfillJson(route, 200, { data: { success: true } });
    });

    await page.goto('/driver-portal/token-network-error');

    const submitBtn = submitNoteButton(page);
    await expect(submitBtn).toBeVisible({ timeout: 15000 });

    const note = 'At the receiver dock door 14.';
    await noteTextarea(page).fill(note);
    await submitBtn.click();

    // Error surfaces.
    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /500|fail|error/i })
      .first();
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Notes preserved (textarea not cleared on failure).
    await expect(noteTextarea(page)).toHaveValue(note);

    // Submit re-enabled for retry.
    await expect(submitBtn).toBeEnabled({ timeout: 15000 });

    await page.screenshot({ path: screenshotPath(page, 'network-error'), fullPage: true });

    // Retry — succeeds.
    await submitBtn.click();
    await expect(page.getByRole('alert').filter({ hasText: /Note submitted/i })).toBeVisible({
      timeout: 15000,
    });
    await expect(noteTextarea(page)).toHaveValue('');
    expect(calls).toBeGreaterThanOrEqual(2);

    await page.screenshot({ path: screenshotPath(page, 'network-error-recovered'), fullPage: true });

    expect(
      filterExpectedConsoleErrors(consoleErrors),
      `unexpected console errors during retry flow: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });
});
