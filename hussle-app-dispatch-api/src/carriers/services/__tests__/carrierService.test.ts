import Decimal from 'decimal.js';
import { CarrierType } from '@prisma/client';
import { ForbiddenError, ValidationError } from '@/shared/errors';
import { createCarrierService } from '../carrierService';

const buildCarrier = () => ({
  id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
  managedByOrgId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
  carrierOrgId: null,
  name: 'Blue Bird Logistics',
  type: CarrierType.EXTERNAL_CARRIER,
  mcNumber: 'MC123456',
  dotNumber: 'DOT123456',
  ein: '12-3456789',
  phone: '555-111-2222',
  email: 'ops@bluebird.test',
  address: '101 Main St',
  city: 'Austin',
  state: 'TX',
  zip: '78701',
  dispatchFeePercent: new Decimal('10.00'),
  partnerSplitPercent: new Decimal('50.00'),
  feeIncludesAccessorials: false,
  ownerOpPayPercent: null,
  dispatchAgreementOnFile: true,
  dispatchAgreementSignedAt: null,
  insuranceCertOnFile: true,
  insuranceExpiry: null,
  w9OnFile: true,
  carrierPacketOnFile: true,
  onboardingFlowId: null,
  onboardingStatus: null,
  authorityStatus: 'active',
  status: 'active',
  notes: null,
  createdAt: new Date('2026-03-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  deletedAt: null,
  _count: {
    drivers: 2,
    vehicles: 1,
  },
});

describe('carrierService', () => {
  const mockCarrierRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    list: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockLoadRepository = {
    findBlockingLoadIds: jest.fn(),
  };

  const carrierService = createCarrierService({
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('blocks owner_operator role from creating carriers', async () => {
    await expect(
      carrierService.createCarrier({
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        input: {
          name: 'Blocked Carrier',
          type: CarrierType.EXTERNAL_CARRIER,
        },
        role: 'owner_operator',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('rejects OWNER_OPERATOR carrier type with validation error', async () => {
    await expect(
      carrierService.createCarrier({
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        input: {
          name: 'Unsupported Carrier',
          type: CarrierType.OWNER_OPERATOR,
        },
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('returns carrier counts from repository in getCarrierById', async () => {
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());

    const result = await carrierService.getCarrierById({
      id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      role: 'dispatcher',
    });

    expect(result.partnerSplitPercent).toEqual(new Decimal('50.00'));
    expect(result._count.drivers).toBe(2);
    expect(result._count.vehicles).toBe(1);
  });

  it('returns repository carrier fields in getCarrierById', async () => {
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());

    const result = await carrierService.getCarrierById({
      id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      role: 'admin',
    });

    expect(result.partnerSplitPercent).toEqual(new Decimal('50.00'));
  });
});
