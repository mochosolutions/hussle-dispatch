import type { CarrierListItem, CarrierNote, CarrierOnboardingStatus } from 'features/carrier/types';

// Wire-level fixture shape: the real API emits `dispatchFeePercent` (the Prisma
// column name), not `companyMarginPercent`. The carrierApi client translates on
// read so the UI domain keeps using `companyMarginPercent`. Fixtures stay
// aligned with the API wire so mocks exercise the translation path.
type MockCarrierWire = Omit<Partial<CarrierListItem>, 'companyMarginPercent'> & {
  id: string;
  dispatchFeePercent: string;
};

export const mockCarriers: MockCarrierWire[] = [
  {
    id: 'carrier-001',
    name: 'Acme Freight LLC',
    type: 'COMPANY_ASSET',
    status: 'ACTIVE',
    mcNumber: 'MC-123456',
    dotNumber: '1234567',
    ein: '12-3456789',
    phone: '(555) 100-0001',
    email: 'ops@acmefreight.com',
    address: '100 Freight Way',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    dispatchFeePercent: '10.00',

    feeIncludesAccessorials: true,
    dispatchAgreementOnFile: true,
    insuranceCertOnFile: true,
    insuranceExpiry: '2027-01-15',
    insuranceWarning: null,
    w9OnFile: true,
    carrierPacketOnFile: true,
    notes: null,
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-06-01T08:00:00.000Z',
    deletedAt: null,
    driverCount: 2,
    vehicleCount: 2,
    onboardingComplete: true,
  },
  {
    id: 'carrier-002',
    name: "Mike's Leased Carrier",
    type: 'LEASED_CARRIER',
    status: 'DRAFT',
    mcNumber: 'MC-654321',
    dotNumber: '7654321',
    ein: null,
    phone: '(555) 200-0002',
    email: 'mike@mikestrucking.com',
    address: '42 Lone Star Blvd',
    city: 'Houston',
    state: 'TX',
    zip: '77001',
    dispatchFeePercent: '12.00',

    feeIncludesAccessorials: false,
    dispatchAgreementOnFile: true,
    insuranceCertOnFile: true,
    insuranceExpiry: '2026-03-28',
    insuranceWarning: '30_DAY',
    w9OnFile: false,
    carrierPacketOnFile: false,
    notes: 'Prefers Southeast runs.',
    createdAt: '2025-03-01T12:00:00.000Z',
    updatedAt: '2025-11-20T09:30:00.000Z',
    deletedAt: null,
    driverCount: 1,
    vehicleCount: 1,
    onboardingComplete: false,
  },
  {
    id: 'carrier-003',
    name: 'FastFreight External',
    type: 'EXTERNAL_CARRIER',
    status: 'DRAFT',
    mcNumber: null,
    dotNumber: null,
    ein: null,
    phone: '(555) 300-0003',
    email: null,
    address: null,
    city: 'Phoenix',
    state: 'AZ',
    zip: null,
    dispatchFeePercent: '8.00',

    feeIncludesAccessorials: false,
    dispatchAgreementOnFile: false,
    insuranceCertOnFile: false,
    insuranceExpiry: null,
    insuranceWarning: null,
    w9OnFile: false,
    carrierPacketOnFile: false,
    notes: 'New carrier — onboarding in progress.',
    createdAt: '2026-01-15T14:00:00.000Z',
    updatedAt: '2026-01-15T14:00:00.000Z',
    deletedAt: null,
    driverCount: 0,
    vehicleCount: 0,
    onboardingComplete: false,
  },
];

export const mockOnboardingStatuses: Record<string, CarrierOnboardingStatus> = {
  'carrier-001': {
    carrierId: 'carrier-001',
    complete: true,
    dispatchAgreementOnFile: true,
    insuranceCertOnFile: true,
    w9OnFile: true,
    carrierPacketOnFile: true,
    insuranceExpiry: '2027-01-15',
    insuranceWarning: null,
  },
  'carrier-002': {
    carrierId: 'carrier-002',
    complete: false,
    dispatchAgreementOnFile: true,
    insuranceCertOnFile: true,
    w9OnFile: false,
    carrierPacketOnFile: false,
    insuranceExpiry: '2026-03-28',
    insuranceWarning: '30_DAY',
  },
  'carrier-003': {
    carrierId: 'carrier-003',
    complete: false,
    dispatchAgreementOnFile: false,
    insuranceCertOnFile: false,
    w9OnFile: false,
    carrierPacketOnFile: false,
    insuranceExpiry: null,
    insuranceWarning: null,
  },
};

export const mockCarrierNotes: Record<string, CarrierNote[]> = {
  'carrier-001': [
    {
      id: 'note-001',
      carrierId: 'carrier-001',
      content: 'Renewed insurance cert — new expiry 2027-01-15.',
      authorName: 'Jane Doe',
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'note-002',
      carrierId: 'carrier-001',
      content: 'Completed onboarding and signed dispatch agreement.',
      authorName: 'Jane Doe',
      createdAt: '2025-06-01T10:00:00.000Z',
    },
  ],
  'carrier-002': [
    {
      id: 'note-003',
      carrierId: 'carrier-002',
      content: 'Missing W-9 and carrier packet — follow up next week.',
      authorName: 'Jane Doe',
      createdAt: '2026-03-15T14:00:00.000Z',
    },
  ],
};
