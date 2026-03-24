import Decimal from 'decimal.js';
import { CarrierType } from '@prisma/client';
import {
  ActiveLoadsConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@/shared/errors';
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
  billingMethod: 'DIRECT',
  factoringCompanyName: null,
  factoringCompanyEmail: null,
  factoringSubmissionMethod: null,
  factoringAdvanceRate: null,
  factoringFeePercent: null,
  factoringNoa: null,
  outboundEmailMode: 'MANUAL',
  replyToEmail: null,
  status: 'ACTIVE',
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
    createWithAssets: jest.fn(),
  };

  const mockLoadRepository = {
    findBlockingLoadIds: jest.fn(),
  };

  const mockNoteRepository = {
    createNote: jest.fn(),
    listNotes: jest.fn(),
    countNotes: jest.fn(),
  };

  const carrierService = createCarrierService({
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
    noteRepository: mockNoteRepository,
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

  it('returns enriched carrier with counts and no partnerSplitPercent for non-admin role', async () => {
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());

    const result = await carrierService.getCarrierById({
      id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      role: 'dispatcher',
    });

    expect(result.partnerSplitPercent).toBeUndefined();
    expect(result.driverCount).toBe(2);
    expect(result.vehicleCount).toBe(1);
    expect(result.onboardingComplete).toBe(true);
    expect(result.insuranceWarning).toBeNull();
  });

  it('returns partnerSplitPercent for admin role in getCarrierById', async () => {
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());

    const result = await carrierService.getCarrierById({
      id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      role: 'admin',
    });

    expect(result.partnerSplitPercent).toEqual(new Decimal('50.00'));
  });

  it('throws NotFoundError when carrier does not exist on delete', async () => {
    mockCarrierRepository.findById.mockResolvedValue(null);

    await expect(
      carrierService.deleteCarrier({
        id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws ActiveLoadsConflictError with blockingLoadIds when carrier has active loads', async () => {
    const blockingIds = [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    ];
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());
    mockLoadRepository.findBlockingLoadIds.mockResolvedValue(blockingIds);

    const error = await carrierService
      .deleteCarrier({
        id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        role: 'admin',
      })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ActiveLoadsConflictError);
    expect((error as ActiveLoadsConflictError).blockingLoadIds).toEqual(blockingIds);
  });

  it('soft-deletes carrier when no active loads exist', async () => {
    mockCarrierRepository.findById.mockResolvedValue(buildCarrier());
    mockLoadRepository.findBlockingLoadIds.mockResolvedValue([]);
    mockCarrierRepository.softDelete.mockResolvedValue(undefined);

    await carrierService.deleteCarrier({
      id: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      role: 'admin',
    });

    expect(mockCarrierRepository.softDelete).toHaveBeenCalledWith(
      '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
      expect.any(Date),
    );
  });

  describe('createCarrier', () => {
    it('creates carrier and returns enriched output for admin role', async () => {
      mockCarrierRepository.create.mockResolvedValue(buildCarrier());

      const result = await carrierService.createCarrier({
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        input: {
          name: 'Blue Bird Logistics',
          type: CarrierType.EXTERNAL_CARRIER,
        },
        role: 'admin',
      });

      expect(mockCarrierRepository.create).toHaveBeenCalledWith(
        'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        { name: 'Blue Bird Logistics', type: CarrierType.EXTERNAL_CARRIER },
      );
      expect(result.driverCount).toBe(2);
      expect(result.vehicleCount).toBe(1);
      expect(result.onboardingComplete).toBe(true);
      expect(result.insuranceWarning).toBeNull();
      expect(result.partnerSplitPercent).toEqual(new Decimal('50.00'));
    });
  });

  describe('createCarrierWithAssets', () => {
    const buildCarrierWithAssets = () => ({
      ...buildCarrier(),
      drivers: [{ id: 'drv-1', name: 'John Doe' }],
      vehicles: [{ id: 'veh-1', unitNumber: 'T-100' }],
    });

    it('creates carrier with drivers and vehicles for admin role', async () => {
      mockCarrierRepository.createWithAssets.mockResolvedValue(buildCarrierWithAssets());

      const result = await carrierService.createCarrierWithAssets({
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        input: {
          name: 'Blue Bird Logistics',
          type: CarrierType.EXTERNAL_CARRIER,
          drivers: [{ firstName: 'John', lastName: 'Doe' }],
          vehicles: [{ unitNumber: 'T-100', type: 'DRY_VAN' }],
        },
        role: 'admin',
      });

      expect(mockCarrierRepository.createWithAssets).toHaveBeenCalledWith(
        'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        {
          carrier: {
            name: 'Blue Bird Logistics',
            type: CarrierType.EXTERNAL_CARRIER,
            drivers: [{ firstName: 'John', lastName: 'Doe' }],
            vehicles: [{ unitNumber: 'T-100', type: 'DRY_VAN' }],
          },
          drivers: [{ firstName: 'John', lastName: 'Doe' }],
          vehicles: [{ unitNumber: 'T-100', type: 'DRY_VAN' }],
        },
      );
      expect(result.drivers).toHaveLength(1);
      expect(result.vehicles).toHaveLength(1);
      expect(result.partnerSplitPercent).toEqual(new Decimal('50.00'));
    });

    it('blocks owner_operator role', async () => {
      await expect(
        carrierService.createCarrierWithAssets({
          organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
          input: {
            name: 'Blocked Carrier',
            type: CarrierType.EXTERNAL_CARRIER,
          },
          role: 'owner_operator',
        }),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it('rejects OWNER_OPERATOR carrier type', async () => {
      await expect(
        carrierService.createCarrierWithAssets({
          organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
          input: {
            name: 'Unsupported Carrier',
            type: CarrierType.OWNER_OPERATOR,
          },
          role: 'admin',
        }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});
