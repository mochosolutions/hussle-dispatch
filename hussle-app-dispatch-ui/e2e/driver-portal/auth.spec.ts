import { expect, test, type Route } from '@playwright/test';

// Token authentication coverage for the driver portal route.
// Uses page.route to mock the load-summary endpoint deterministically so
// these scenarios run without the backend.

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

const buildMockLoad = (): MockLoad => ({
  id: 'load-1',
  loadNumber: 'L-1001',
  status: 'DISPATCHED',
  equipmentType: 'DRY_VAN',
  commodity: 'General Freight',
  weight: 25000,
  driverInstructions: 'Call dispatcher upon arrival.',
  stops: [
    {
      id: 'stop-1',
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
      id: 'stop-2',
      type: 'DELIVERY',
      sequence: 2,
      facilityName: 'Beta Distribution',
      address: '456 Oak Ave',
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

test.describe('Driver portal token authentication', () => {
  test('valid token renders load details', async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await fulfillJson(route, 200, { data: buildMockLoad() });
    });

    await page.goto('/driver-portal/valid-token-abc');

    await expect(page.getByRole('heading', { name: /Load L-1001/ })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/Hi Jane/)).toBeVisible();
    await expect(page.getByText('Dispatched', { exact: true })).toBeVisible();

    await page.screenshot({
      path: 'e2e-results/screenshots/auth-valid.png',
      fullPage: true,
    });
  });

  test('expired token shows Link Expired error', async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await fulfillJson(route, 401, { errors: [{ message: 'Token expired' }] });
    });

    await page.goto('/driver-portal/expired-token');

    await expect(page.getByRole('heading', { name: 'Link Expired' })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: 'e2e-results/screenshots/auth-expired.png',
      fullPage: true,
    });
  });

  test('revoked token shows Link Revoked error', async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await fulfillJson(route, 401, { errors: [{ message: 'Token revoked' }] });
    });

    await page.goto('/driver-portal/revoked-token');

    await expect(page.getByRole('heading', { name: 'Link Revoked' })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: 'e2e-results/screenshots/auth-revoked.png',
      fullPage: true,
    });
  });

  test('malformed token shows Invalid Link error', async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await fulfillJson(route, 401, { errors: [{ message: 'Invalid token' }] });
    });

    await page.goto('/driver-portal/!!!not-a-uuid???');

    await expect(page.getByRole('heading', { name: 'Invalid Link' })).toBeVisible({
      timeout: 15000,
    });

    await page.screenshot({
      path: 'e2e-results/screenshots/auth-malformed.png',
      fullPage: true,
    });
  });

  test('network error shows generic error with Try Again button', async ({ page }) => {
    await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/driver-portal/some-token');

    await expect(page.getByRole('heading', { name: 'Something Went Wrong' })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();

    await page.screenshot({
      path: 'e2e-results/screenshots/auth-network-error.png',
      fullPage: true,
    });
  });
});
