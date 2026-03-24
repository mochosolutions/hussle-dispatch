import type { Settings } from 'utils/api/fleet/settingsApi';

export const mockSettings: Settings = {
  id: 'settings-001',
  organizationId: 'org-001',
  timezone: 'America/Chicago',
  currency: 'USD',
  distanceUnit: 'miles',
  dateFormat: 'MM/DD/YYYY',
  invoicePrefix: 'INV',
  invoiceNextNumber: 10,
  defaultPaymentTerms: 30,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2026-03-01T08:00:00.000Z',
};
