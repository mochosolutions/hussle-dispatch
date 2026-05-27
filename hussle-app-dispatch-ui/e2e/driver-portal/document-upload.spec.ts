import { expect, test, type Page, type Route } from '@playwright/test';

// US-06 — driver portal document upload coverage.
//
// Covers the PortalDocumentUpload component (BOL + POD) on DriverPortalPage.
// Status gating: BOL visible at AT_PICKUP/IN_TRANSIT/AT_DELIVERY/DELIVERED;
// POD visible at AT_DELIVERY/DELIVERED.
//
// Scenarios:
//  1. AT_PICKUP — BOL section visible, POD hidden
//  2. AT_DELIVERY — both BOL and POD visible
//  3. Upload a small JPEG — presign + S3 PUT + confirm + success
//  4. Upload a PDF — same flow
//  5. File >10MB rejected client-side, no presign request
//  6. Unsupported file type (.exe) rejected client-side, no presign
//  7. Upload success — "Upload Another" returns to picker idle state
//  8. Presign 500 — error visible, S3 PUT and confirm NOT called
//  9. Mobile — file input has accept attribute including image/* and PDF

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

interface PresignBody {
  fileName: string;
  mimeType: string;
  type: string;
}

const PRESIGN_HOST = 'test-s3.example.com';
const PRESIGN_URL_PREFIX = `https://${PRESIGN_HOST}/upload`;

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
  id: 'load-upload-1',
  loadNumber: 'LD-2026-UPL1',
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

interface UploadCallTrackers {
  presignCalls: PresignBody[];
  s3PutCalls: number;
  confirmCalls: { documentId: string }[];
}

const installUploadEndpoints = async (
  page: Page,
  options: {
    presignStatus?: number;
    s3Status?: number;
    documentId?: string;
  } = {},
): Promise<UploadCallTrackers> => {
  const trackers: UploadCallTrackers = {
    presignCalls: [],
    s3PutCalls: 0,
    confirmCalls: [],
  };
  const presignStatus = options.presignStatus ?? 200;
  const s3Status = options.s3Status ?? 200;
  const documentId = options.documentId ?? 'doc-1';

  await page.route(
    '**/api/v1/driver-portal/portal/load/documents/presign*',
    async (route) => {
      const body = route.request().postDataJSON() as PresignBody;
      trackers.presignCalls.push(body);
      if (presignStatus >= 400) {
        await fulfillJson(route, presignStatus, {
          errors: [{ message: 'Server error' }],
        });
        return;
      }
      await fulfillJson(route, presignStatus, {
        data: {
          documentId,
          presignedUrl: `${PRESIGN_URL_PREFIX}/${documentId}`,
          expiresIn: 900,
        },
      });
    },
  );

  await page.route(`${PRESIGN_URL_PREFIX}/**`, async (route) => {
    if (route.request().method() !== 'PUT') {
      await route.fallback();
      return;
    }
    trackers.s3PutCalls += 1;
    await route.fulfill({ status: s3Status, body: '' });
  });

  await page.route(
    '**/api/v1/driver-portal/portal/load/documents/*/confirm*',
    async (route) => {
      const url = route.request().url();
      const match = /\/documents\/([^/]+)\/confirm/.exec(url);
      const id = match !== null ? match[1] : '';
      trackers.confirmCalls.push({ documentId: id });
      await fulfillJson(route, 200, { data: {} });
    },
  );

  return trackers;
};

const screenshotPath = (page: Page, name: string): string => {
  const viewport = page.viewportSize()?.width ?? 0;
  const label = viewport >= 1000 ? 'desktop' : 'mobile';
  return `e2e-results/screenshots/document-upload-${name}-${label}.png`;
};

const filterExpectedConsoleErrors = (errors: string[]): string[] =>
  // 4xx/5xx responses produce a "Failed to load resource" console entry
  // that we want to ignore in error-path tests.
  errors.filter((msg) => !/Failed to load resource.*\b(400|500)\b/i.test(msg));

const bolFileInput = (page: Page) =>
  page
    .locator('input[type="file"]')
    .nth(0);

const podFileInput = (page: Page) =>
  page
    .locator('input[type="file"]')
    .nth(1);

const uploadSection = (page: Page) =>
  page.getByText('Document Upload', { exact: true });

const bolHeading = (page: Page) =>
  page.getByText('Bill of Lading (BOL)', { exact: true });

const podHeading = (page: Page) =>
  page.getByText('Proof of Delivery (POD)', { exact: true });

test.describe('Driver portal document upload', () => {
  test('AT_PICKUP shows BOL upload, hides POD', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    await installUploadEndpoints(page);

    await page.goto('/driver-portal/token-at-pickup');

    await expect(uploadSection(page)).toBeVisible({ timeout: 15000 });
    await expect(bolHeading(page)).toBeVisible();
    await expect(podHeading(page)).toHaveCount(0);

    await page.screenshot({ path: screenshotPath(page, 'at-pickup'), fullPage: true });

    expect(
      consoleErrors,
      `console errors at AT_PICKUP: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('AT_DELIVERY shows both BOL and POD', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_DELIVERY');
    await installUploadEndpoints(page);

    await page.goto('/driver-portal/token-at-delivery');

    await expect(uploadSection(page)).toBeVisible({ timeout: 15000 });
    await expect(bolHeading(page)).toBeVisible();
    await expect(podHeading(page)).toBeVisible();

    await page.screenshot({ path: screenshotPath(page, 'at-delivery'), fullPage: true });

    expect(
      consoleErrors,
      `console errors at AT_DELIVERY: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('uploads a small JPEG via presign + S3 PUT + confirm', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    const trackers = await installUploadEndpoints(page, { documentId: 'doc-jpeg' });

    await page.goto('/driver-portal/token-jpeg');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    // Set file directly via the hidden input.
    const jpegBuffer = Buffer.alloc(100 * 1024, 0xff); // 100 KB
    await bolFileInput(page).setInputFiles({
      name: 'bol-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: jpegBuffer,
    });

    // Wait for the success alert.
    const successAlert = page
      .getByRole('alert')
      .filter({ hasText: /uploaded successfully/i });
    await expect(successAlert).toBeVisible({ timeout: 15000 });
    await expect(successAlert).toContainText('bol-photo.jpg');

    // Verify request sequence.
    expect(trackers.presignCalls).toHaveLength(1);
    expect(trackers.presignCalls[0]).toMatchObject({
      fileName: 'bol-photo.jpg',
      mimeType: 'image/jpeg',
      type: 'BOL_SIGNED',
    });
    expect(trackers.s3PutCalls).toBe(1);
    expect(trackers.confirmCalls).toEqual([{ documentId: 'doc-jpeg' }]);

    await page.screenshot({ path: screenshotPath(page, 'jpeg-success'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during JPEG upload: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('uploads a PDF via presign + S3 PUT + confirm', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_DELIVERY');
    const trackers = await installUploadEndpoints(page, { documentId: 'doc-pdf' });

    await page.goto('/driver-portal/token-pdf');

    await expect(podHeading(page)).toBeVisible({ timeout: 15000 });

    const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf body bytes');
    // POD input is the second file input (BOL is first since AT_DELIVERY shows both).
    await podFileInput(page).setInputFiles({
      name: 'pod-receipt.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer,
    });

    const successAlert = page
      .getByRole('alert')
      .filter({ hasText: /uploaded successfully/i });
    await expect(successAlert).toBeVisible({ timeout: 15000 });
    await expect(successAlert).toContainText('pod-receipt.pdf');

    expect(trackers.presignCalls).toHaveLength(1);
    expect(trackers.presignCalls[0]).toMatchObject({
      fileName: 'pod-receipt.pdf',
      mimeType: 'application/pdf',
      type: 'POD',
    });
    expect(trackers.s3PutCalls).toBe(1);
    expect(trackers.confirmCalls).toEqual([{ documentId: 'doc-pdf' }]);

    await page.screenshot({ path: screenshotPath(page, 'pdf-success'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during PDF upload: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('rejects file larger than 10 MB client-side, no presign call', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    const trackers = await installUploadEndpoints(page);

    await page.goto('/driver-portal/token-too-large');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    const tooBig = Buffer.alloc(11 * 1024 * 1024, 0); // 11 MB
    await bolFileInput(page).setInputFiles({
      name: 'huge.jpg',
      mimeType: 'image/jpeg',
      buffer: tooBig,
    });

    // Error message visible — wording from the component: "File is too large. Maximum size is 10 MB."
    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /too large|maximum size/i });
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Critically: no presign request should have been made.
    expect(trackers.presignCalls).toHaveLength(0);
    expect(trackers.s3PutCalls).toBe(0);
    expect(trackers.confirmCalls).toHaveLength(0);

    await page.screenshot({ path: screenshotPath(page, 'too-large'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during oversize rejection: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('rejects unsupported file type client-side, no presign call', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    const trackers = await installUploadEndpoints(page);

    await page.goto('/driver-portal/token-bad-type');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    const exeBuffer = Buffer.from('MZ\x00\x00 fake exe header');
    await bolFileInput(page).setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: exeBuffer,
    });

    // Error message visible.
    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /not supported|unsupported|file type|jpeg|png|pdf/i });
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Critically: no presign request should have been made.
    expect(trackers.presignCalls).toHaveLength(0);
    expect(trackers.s3PutCalls).toBe(0);
    expect(trackers.confirmCalls).toHaveLength(0);

    await page.screenshot({ path: screenshotPath(page, 'bad-type'), fullPage: true });

    expect(
      consoleErrors,
      `console errors during bad-type rejection: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('after success, "Upload Another" returns to idle for next upload', async ({
    page,
  }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    await installUploadEndpoints(page, { documentId: 'doc-reset' });

    await page.goto('/driver-portal/token-reset');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    await bolFileInput(page).setInputFiles({
      name: 'first.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(50 * 1024, 0xaa),
    });

    const successAlert = page
      .getByRole('alert')
      .filter({ hasText: /uploaded successfully/i });
    await expect(successAlert).toBeVisible({ timeout: 15000 });

    // Click "Upload Another" — restores the picker.
    await page.getByRole('button', { name: /Upload Another/i }).click();

    // Picker button is visible again.
    await expect(
      page.getByRole('button', { name: /Take Photo or Choose File/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.screenshot({ path: screenshotPath(page, 'upload-another'), fullPage: true });

    expect(
      consoleErrors,
      `console errors after upload-another reset: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('presign 500 -> error, S3 PUT and confirm not called', async ({ page }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    const trackers = await installUploadEndpoints(page, { presignStatus: 500 });

    await page.goto('/driver-portal/token-presign-500');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    await bolFileInput(page).setInputFiles({
      name: 'fail.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(80 * 1024, 0x55),
    });

    const errorAlert = page
      .getByRole('alert')
      .filter({ hasText: /Upload failed/i });
    await expect(errorAlert).toBeVisible({ timeout: 15000 });

    // Presign was called (and failed), but neither S3 PUT nor confirm fired.
    expect(trackers.presignCalls).toHaveLength(1);
    expect(trackers.s3PutCalls).toBe(0);
    expect(trackers.confirmCalls).toHaveLength(0);

    // "Try Again" button visible for retry.
    await expect(page.getByRole('button', { name: /Try Again/i })).toBeVisible();

    await page.screenshot({ path: screenshotPath(page, 'presign-500'), fullPage: true });

    expect(
      filterExpectedConsoleErrors(consoleErrors),
      `unexpected console errors during presign 500: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });

  test('file input has accept attribute including image and PDF mime types', async ({
    page,
  }) => {
    const consoleErrors = attachConsoleErrorWatcher(page);
    await installLoadEndpoint(page, 'AT_PICKUP');
    await installUploadEndpoints(page);

    await page.goto('/driver-portal/token-accept-attr');

    await expect(bolHeading(page)).toBeVisible({ timeout: 15000 });

    const accept = await bolFileInput(page).getAttribute('accept');
    expect(accept, 'file input must have an accept attribute').not.toBeNull();
    // Must include JPEG, PNG, and PDF — protects mobile camera + document workflows.
    expect(accept).toMatch(/image\/jpeg/);
    expect(accept).toMatch(/image\/png/);
    expect(accept).toMatch(/application\/pdf/);

    await page.screenshot({ path: screenshotPath(page, 'accept-attr'), fullPage: true });

    expect(
      consoleErrors,
      `console errors checking accept attr: ${consoleErrors.join(' | ')}`,
    ).toEqual([]);
  });
});
