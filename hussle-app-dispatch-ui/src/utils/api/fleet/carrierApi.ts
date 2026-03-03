import type { Carrier, CreateCarrierInput, UpdateCarrierInput } from 'pages/fleet/types';

const MOCK_ORG_ID = 'org-mock-0001';

const MOCK_CARRIERS: Carrier[] = [
  {
    id: 'carrier-0001',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Hustle Transportation',
    type: 'COMPANY_ASSET',
    mcNumber: 'MC-0981234',
    dotNumber: 'DOT-3456789',
    ein: null,
    phone: '(555) 100-2000',
    email: 'dispatch@hustletrans.com',
    address: '123 Main St',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: '2024-01-10T00:00:00.000Z',
    insuranceCertOnFile: true,
    insuranceExpiry: '2025-12-31T00:00:00.000Z',
    w9OnFile: true,
    carrierPacketOnFile: true,
    onboardingFlowId: null,
    onboardingStatus: 'complete',
    authorityStatus: 'active',
    status: 'active',
    notes: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 3,
    vehicleCount: 3,
  },
  {
    id: 'carrier-0002',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'JR Express LLC',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-1234567',
    dotNumber: 'DOT-9876543',
    ein: null,
    phone: '(555) 123-4567',
    email: 'jr@jrexpress.com',
    address: '456 Oak Ave',
    city: 'Houston',
    state: 'TX',
    zip: '77002',
    dispatchFeePercent: '12.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: '2024-02-15T00:00:00.000Z',
    insuranceCertOnFile: true,
    insuranceExpiry: '2025-06-30T00:00:00.000Z',
    w9OnFile: true,
    carrierPacketOnFile: true,
    onboardingFlowId: null,
    onboardingStatus: 'complete',
    authorityStatus: 'active',
    status: 'active',
    notes: null,
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 2,
    vehicleCount: 2,
  },
  {
    id: 'carrier-0003',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Summit Freight LLC',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-2345678',
    dotNumber: 'DOT-8765432',
    ein: null,
    phone: '(555) 234-5678',
    email: 'andre@summitfreight.com',
    address: null,
    city: 'San Antonio',
    state: 'TX',
    zip: '78201',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: true,
    insuranceExpiry: '2025-09-30T00:00:00.000Z',
    w9OnFile: true,
    carrierPacketOnFile: false,
    onboardingFlowId: null,
    onboardingStatus: 'complete',
    authorityStatus: 'active',
    status: 'active',
    notes: null,
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 2,
    vehicleCount: 2,
  },
  {
    id: 'carrier-0004',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Apex Carriers Inc',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-3456789',
    dotNumber: 'DOT-7654321',
    ein: null,
    phone: '(555) 345-6789',
    email: null,
    address: null,
    city: 'Austin',
    state: 'TX',
    zip: '73301',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: false,
    insuranceExpiry: null,
    w9OnFile: false,
    carrierPacketOnFile: false,
    onboardingFlowId: null,
    onboardingStatus: 'incomplete',
    authorityStatus: 'active',
    status: 'active',
    notes: null,
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2024-04-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 2,
    vehicleCount: 2,
  },
  {
    id: 'carrier-0005',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Metro Haulers LLC',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-4567890',
    dotNumber: 'DOT-6543210',
    ein: null,
    phone: '(555) 456-7890',
    email: null,
    address: null,
    city: 'Fort Worth',
    state: 'TX',
    zip: '76101',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: false,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: false,
    insuranceExpiry: null,
    w9OnFile: false,
    carrierPacketOnFile: false,
    onboardingFlowId: null,
    onboardingStatus: 'incomplete',
    authorityStatus: 'active',
    status: 'pending',
    notes: null,
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2024-05-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 0,
    vehicleCount: 0,
  },
  {
    id: 'carrier-0006',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Liberty Transport Co',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-5678901',
    dotNumber: 'DOT-5432109',
    ein: null,
    phone: '(555) 567-8901',
    email: 'maria@libertytransport.com',
    address: null,
    city: 'El Paso',
    state: 'TX',
    zip: '79901',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: false,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: false,
    insuranceExpiry: null,
    w9OnFile: false,
    carrierPacketOnFile: false,
    onboardingFlowId: null,
    onboardingStatus: 'incomplete',
    authorityStatus: 'active',
    status: 'pending',
    notes: null,
    createdAt: '2024-05-15T00:00:00.000Z',
    updatedAt: '2024-05-15T00:00:00.000Z',
    deletedAt: null,
    driverCount: 1,
    vehicleCount: 1,
  },
  {
    id: 'carrier-0007',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Eagle Logistics LLC',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-6789012',
    dotNumber: 'DOT-4321098',
    ein: null,
    phone: '(555) 678-9012',
    email: null,
    address: null,
    city: 'Lubbock',
    state: 'TX',
    zip: '79401',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: false,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: false,
    insuranceExpiry: null,
    w9OnFile: false,
    carrierPacketOnFile: false,
    onboardingFlowId: null,
    onboardingStatus: 'incomplete',
    authorityStatus: 'active',
    status: 'onboarding',
    notes: null,
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2024-06-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 0,
    vehicleCount: 0,
  },
  {
    id: 'carrier-0008',
    managedByOrgId: MOCK_ORG_ID,
    carrierOrgId: null,
    name: 'Swift Line Hauling',
    type: 'EXTERNAL_CARRIER',
    mcNumber: 'MC-1122334',
    dotNumber: 'DOT-9988776',
    ein: null,
    phone: '(555) 112-2334',
    email: null,
    address: null,
    city: 'Amarillo',
    state: 'TX',
    zip: '79101',
    dispatchFeePercent: '10.00',
    partnerSplitPercent: '50.00',
    feeIncludesAccessorials: false,
    ownerOpPayPercent: null,
    dispatchAgreementOnFile: true,
    dispatchAgreementSignedAt: '2023-06-01T00:00:00.000Z',
    insuranceCertOnFile: true,
    insuranceExpiry: '2024-01-01T00:00:00.000Z',
    w9OnFile: true,
    carrierPacketOnFile: true,
    onboardingFlowId: null,
    onboardingStatus: 'complete',
    authorityStatus: 'inactive',
    status: 'inactive',
    notes: null,
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    deletedAt: null,
    driverCount: 1,
    vehicleCount: 1,
  },
];

interface GetCarriersParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const delay = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 200));

export const getCarriers = async (
  params: GetCarriersParams,
): Promise<{ data: Carrier[]; meta: PaginationMeta }> => {
  await delay();

  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const search = params.search?.trim().toLowerCase() ?? '';
  const typeFilter = params.type ?? 'all';

  const filtered = MOCK_CARRIERS.filter((carrier) => {
    if (typeFilter !== 'all' && carrier.type !== typeFilter) {
      return false;
    }

    if (!search) {
      return true;
    }

    return (
      carrier.name.toLowerCase().includes(search) ||
      (carrier.mcNumber?.toLowerCase().includes(search) ?? false) ||
      (carrier.dotNumber?.toLowerCase().includes(search) ?? false) ||
      (carrier.email?.toLowerCase().includes(search) ?? false)
    );
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
};

export const getCarrier = async (id: string): Promise<{ carrier: Carrier }> => {
  await delay();

  const carrier = MOCK_CARRIERS.find((c) => c.id === id);

  if (!carrier) {
    throw new Error(`Carrier with id ${id} not found`);
  }

  return { carrier };
};

export const createCarrier = async (data: CreateCarrierInput): Promise<{ carrier: Carrier }> => {
  await delay();

  const now = new Date().toISOString();
  const carrier: Carrier = {
    id: crypto.randomUUID(),
    managedByOrgId: data.managedByOrgId,
    carrierOrgId: null,
    name: data.name,
    type: data.type,
    mcNumber: data.mcNumber ?? null,
    dotNumber: data.dotNumber ?? null,
    ein: data.ein ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    zip: data.zip ?? null,
    dispatchFeePercent: data.dispatchFeePercent ?? '10.00',
    partnerSplitPercent: data.partnerSplitPercent ?? '50.00',
    feeIncludesAccessorials: data.feeIncludesAccessorials ?? false,
    ownerOpPayPercent: data.ownerOpPayPercent ?? null,
    dispatchAgreementOnFile: data.dispatchAgreementOnFile ?? false,
    dispatchAgreementSignedAt: null,
    insuranceCertOnFile: data.insuranceCertOnFile ?? false,
    insuranceExpiry: data.insuranceExpiry ?? null,
    w9OnFile: data.w9OnFile ?? false,
    carrierPacketOnFile: data.carrierPacketOnFile ?? false,
    onboardingFlowId: null,
    onboardingStatus: null,
    authorityStatus: 'active',
    status: data.status ?? 'active',
    notes: data.notes ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    driverCount: 0,
    vehicleCount: 0,
  };

  MOCK_CARRIERS.push(carrier);

  return { carrier };
};

export const updateCarrier = async (
  id: string,
  data: UpdateCarrierInput,
): Promise<{ carrier: Carrier }> => {
  await delay();

  const index = MOCK_CARRIERS.findIndex((c) => c.id === id);

  if (index === -1) {
    throw new Error(`Carrier with id ${id} not found`);
  }

  const existing = MOCK_CARRIERS[index];
  const updated: Carrier = {
    ...existing,
    ...data,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };

  MOCK_CARRIERS[index] = updated;

  return { carrier: updated };
};

export const deleteCarrier = async (_id: string): Promise<void> => {
  await delay();
  // No-op (mocked)
};

export const getCarrierOnboarding = async (id: string): Promise<{ carrier: Carrier }> =>
  getCarrier(id);
