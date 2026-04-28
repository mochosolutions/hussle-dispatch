import { expect, test, type Page, type Route } from '@playwright/test';

// Load summary view coverage for the driver portal.
// Mocks GET /api/v1/driver-portal/portal/load with deterministic data and
// asserts on rendered output (formatted strings, not raw API values).

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
  schedulingType: string;
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

const mockLoadEndpoint = async (page: Page, load: MockLoad): Promise<void> => {
  await page.route('**/api/v1/driver-portal/portal/load*', async (route) => {
    await fulfillJson(route, 200, { data: load });
  });
};

// Capture console errors so a render-time error fails the test.
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

const buildStandardLoad = (): MockLoad => ({
  id: 'load-standard',
  loadNumber: 'LD-2026-0042',
  status: 'DISPATCHED',
  equipmentType: 'DRY_VAN',
  commodity: 'Palletized Electronics',
  weight: 24500,
  driverInstructions: 'Call dispatcher upon arrival. Use door 14 for unloading.',
  stops: [
    {
      id: 'pickup-1',
      type: 'PICKUP',
      sequence: 1,
      facilityName: 'Atlas Distribution',
      address: '500 Industrial Pkwy',
      city: 'Dallas',
      state: 'TX',
      zip: '75201',
      // 2026-04-26 14:00–16:00 UTC — formatted via local TZ but format pattern stable.
      appointmentStart: '2026-04-26T14:00:00.000Z',
      appointmentEnd: '2026-04-26T16:00:00.000Z',
      schedulingType: 'APPOINTMENT',
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
      schedulingType: 'APPOINTMENT',
      contactName: 'Mary Jones',
      contactPhone: '5559876543',
      notes: null,
    },
  ],
  driver: { firstName: 'Jane', lastName: 'Doe' },
});

const buildLoadWithoutInstructions = (): MockLoad => ({
  ...buildStandardLoad(),
  id: 'load-no-instructions',
  loadNumber: 'LD-2026-0043',
  driverInstructions: null,
});

const buildMultiDropLoad = (): MockLoad => ({
  id: 'load-multi-drop',
  loadNumber: 'LD-2026-0044',
  status: 'DISPATCHED',
  equipmentType: 'REEFER',
  commodity: 'Frozen Goods',
  weight: 38000,
  driverInstructions: null,
  stops: [
    {
      id: 'pickup-md',
      type: 'PICKUP',
      sequence: 1,
      facilityName: 'Cold Storage North',
      address: '100 Frozen Way',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      appointmentStart: '2026-04-26T10:00:00.000Z',
      appointmentEnd: '2026-04-26T12:00:00.000Z',
      schedulingType: 'APPOINTMENT',
      contactName: 'Pat Lee',
      contactPhone: '3125550100',
      notes: null,
    },
    {
      id: 'delivery-md-1',
      type: 'DELIVERY',
      sequence: 2,
      facilityName: 'Grocer Hub East',
      address: '250 Market Blvd',
      city: 'Indianapolis',
      state: 'IN',
      zip: '46201',
      appointmentStart: '2026-04-26T20:00:00.000Z',
      appointmentEnd: '2026-04-26T22:00:00.000Z',
      schedulingType: 'APPOINTMENT',
      contactName: 'Sam Doe',
      contactPhone: '3175550101',
      notes: null,
    },
    {
      id: 'delivery-md-2',
      type: 'DELIVERY',
      sequence: 3,
      facilityName: 'Grocer Hub South',
      address: '700 Cargo Loop',
      city: 'Louisville',
      state: 'KY',
      zip: '40202',
      appointmentStart: '2026-04-27T14:00:00.000Z',
      appointmentEnd: '2026-04-27T16:00:00.000Z',
      schedulingType: 'APPOINTMENT',
      contactName: 'Kim Park',
      contactPhone: '5025550102',
      notes: null,
    },
  ],
  driver: { firstName: 'Drew', lastName: 'Rivera' },
});

test.describe('Driver portal load summary view', () => {
  test('renders standard load with all fields populated', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await mockLoadEndpoint(page, buildStandardLoad());

    await page.goto('/driver-portal/standard-token');

    // Header + status chip
    await expect(page.getByRole('heading', { name: /Load LD-2026-0042/ })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('Dispatched', { exact: true })).toBeVisible();

    // Driver greeting
    await expect(page.getByText(/Hi Jane, here are your load details\./)).toBeVisible();

    // Load info card — equipment label has underscores replaced with spaces.
    await expect(page.getByText('Equipment: DRY VAN')).toBeVisible();
    await expect(page.getByText('Commodity: Palletized Electronics')).toBeVisible();
    await expect(page.getByText('Weight: 24,500 lbs')).toBeVisible();

    // Pickup stop
    await expect(page.getByText(/Pickup\s+—\s+Atlas Distribution/)).toBeVisible();
    await expect(page.getByText('500 Industrial Pkwy')).toBeVisible();
    await expect(page.getByText('Dallas, TX, 75201')).toBeVisible();
    await expect(page.getByText(/Contact: John Smith\s+—\s+\(555\) 123-4567/)).toBeVisible();

    // Delivery stop
    await expect(page.getByText(/Delivery\s+—\s+Beta Receiving/)).toBeVisible();
    await expect(page.getByText('900 Commerce St')).toBeVisible();
    await expect(page.getByText('Houston, TX, 77002')).toBeVisible();
    await expect(page.getByText(/Contact: Mary Jones\s+—\s+\(555\) 987-6543/)).toBeVisible();

    // Appointment lines — assert the "Appt:" prefix and the en dash range separator are
    // present without locking the test to a specific timezone-formatted time.
    const apptLines = page.getByText(/^Appt:\s+\w+\s+\d+,\s+\d+:\d{2}\s+(AM|PM)\s+–\s+\d+:\d{2}\s+(AM|PM)$/);
    await expect(apptLines.first()).toBeVisible();
    expect(await apptLines.count()).toBeGreaterThanOrEqual(2);

    // Driver instructions section is rendered with full text.
    await expect(page.getByRole('heading', { name: 'Instructions' })).toBeVisible();
    await expect(
      page.getByText('Call dispatcher upon arrival. Use door 14 for unloading.'),
    ).toBeVisible();

    const viewport = page.viewportSize()?.width ?? 0;
    const label = viewport >= 1000 ? 'desktop' : 'mobile';
    await page.screenshot({
      path: `e2e-results/screenshots/load-summary-standard-${label}.png`,
      fullPage: true,
    });

    expect(consoleErrors, `console errors during render: ${consoleErrors.join(' | ')}`).toEqual(
      [],
    );
  });

  test('hides instructions section when driverInstructions is null', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await mockLoadEndpoint(page, buildLoadWithoutInstructions());

    await page.goto('/driver-portal/no-instructions-token');

    await expect(page.getByRole('heading', { name: /Load LD-2026-0043/ })).toBeVisible({
      timeout: 15000,
    });

    // Instructions heading must not appear at all when there is no instructions text.
    await expect(page.getByRole('heading', { name: 'Instructions' })).toHaveCount(0);

    const viewport = page.viewportSize()?.width ?? 0;
    const label = viewport >= 1000 ? 'desktop' : 'mobile';
    await page.screenshot({
      path: `e2e-results/screenshots/load-summary-no-instructions-${label}.png`,
      fullPage: true,
    });

    expect(consoleErrors, `console errors during render: ${consoleErrors.join(' | ')}`).toEqual(
      [],
    );
  });

  test('renders multi-drop load with all stops in sequence order', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await mockLoadEndpoint(page, buildMultiDropLoad());

    await page.goto('/driver-portal/multi-drop-token');

    await expect(page.getByRole('heading', { name: /Load LD-2026-0044/ })).toBeVisible({
      timeout: 15000,
    });

    // All three stops must render.
    await expect(page.getByText(/Pickup\s+—\s+Cold Storage North/)).toBeVisible();
    await expect(page.getByText(/Delivery\s+—\s+Grocer Hub East/)).toBeVisible();
    await expect(page.getByText(/Delivery\s+—\s+Grocer Hub South/)).toBeVisible();

    // Each stop's address renders.
    await expect(page.getByText('100 Frozen Way')).toBeVisible();
    await expect(page.getByText('250 Market Blvd')).toBeVisible();
    await expect(page.getByText('700 Cargo Loop')).toBeVisible();

    // Stops appear in sequence order in the DOM (pickup -> delivery 1 -> delivery 2).
    const stopHeadings = await page
      .getByText(/^(Pickup|Delivery)\s+—/)
      .allTextContents();
    expect(stopHeadings.length).toBeGreaterThanOrEqual(3);
    expect(stopHeadings[0]).toContain('Cold Storage North');
    expect(stopHeadings[1]).toContain('Grocer Hub East');
    expect(stopHeadings[2]).toContain('Grocer Hub South');

    // Equipment with underscore is reformatted.
    await expect(page.getByText('Equipment: REEFER')).toBeVisible();
    await expect(page.getByText('Weight: 38,000 lbs')).toBeVisible();

    const viewport = page.viewportSize()?.width ?? 0;
    const label = viewport >= 1000 ? 'desktop' : 'mobile';
    await page.screenshot({
      path: `e2e-results/screenshots/load-summary-multi-drop-${label}.png`,
      fullPage: true,
    });

    expect(consoleErrors, `console errors during render: ${consoleErrors.join(' | ')}`).toEqual(
      [],
    );
  });
});

// Scheduling type label rendering — one scenario per Prisma SchedulingType enum value.
// Backend now projects `schedulingType` on each stop; the page maps the raw enum
// to a human-friendly label via SCHEDULING_TYPE_LABELS.
const buildLoadWithSchedulingType = (schedulingType: string): MockLoad => ({
  id: `load-sched-${schedulingType.toLowerCase()}`,
  loadNumber: `LD-2026-S${schedulingType.slice(0, 3).toUpperCase()}`,
  status: 'DISPATCHED',
  equipmentType: 'DRY_VAN',
  commodity: 'General Freight',
  weight: 20000,
  driverInstructions: null,
  stops: [
    {
      id: 'pickup-sched',
      type: 'PICKUP',
      sequence: 1,
      facilityName: 'Scheduling Test Facility',
      address: '1 Sched Way',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      appointmentStart: '2026-04-26T14:00:00.000Z',
      appointmentEnd: '2026-04-26T16:00:00.000Z',
      schedulingType,
      contactName: 'Sched Contact',
      contactPhone: '5550000000',
      notes: null,
    },
    {
      id: 'delivery-sched',
      type: 'DELIVERY',
      sequence: 2,
      facilityName: 'Scheduling Test Receiver',
      address: '2 Sched Way',
      city: 'Austin',
      state: 'TX',
      zip: '78702',
      appointmentStart: '2026-04-27T14:00:00.000Z',
      appointmentEnd: '2026-04-27T16:00:00.000Z',
      schedulingType: 'APPOINTMENT',
      contactName: 'Recv Contact',
      contactPhone: '5550000001',
      notes: null,
    },
  ],
  driver: { firstName: 'Jane', lastName: 'Doe' },
});

const SCHEDULING_TYPE_CASES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'APPOINTMENT', label: 'Scheduled appointment' },
  { value: 'FCFS', label: 'First-come, first-served' },
  { value: 'NOTIFICATION', label: 'Notification required' },
  { value: 'OPEN', label: 'Open dock' },
  { value: 'DROP_HOOK', label: 'Drop & hook' },
];

test.describe('Driver portal scheduling type labels', () => {
  for (const { value, label } of SCHEDULING_TYPE_CASES) {
    test(`renders human-readable label for schedulingType=${value}`, async ({ page }) => {
      const consoleErrors = attachConsoleErrorWatcher(page);
      await mockLoadEndpoint(page, buildLoadWithSchedulingType(value));

      await page.goto(`/driver-portal/sched-${value.toLowerCase()}-token`);

      await expect(page.getByText(/Scheduling Test Facility/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();

      expect(consoleErrors, `console errors during render: ${consoleErrors.join(' | ')}`).toEqual(
        [],
      );
    });
  }
});
