import Decimal from 'decimal.js';
import { BadRequestError } from '@mocho/common';
import { CarrierType, DispatchFeeType } from '@prisma/client';
import {
  ActiveLoadsConflictError,
  ForbiddenError,
  NotFoundError,
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
  dispatchFeeType: DispatchFeeType.PERCENTAGE,
  dispatchFeeAmount: new Decimal('0'),
  partnerSplitPercent: new Decimal('50.00'),
  feeIncludesAccessorials: true,
  ownerOpPayPercent: null,
  tin: '12-3456789',
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
  description: null,
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

  const mockAuditLog = {
    create: jest.fn().mockResolvedValue(undefined),
  };

  const mockInviteTokenRepo = {
    findByToken: jest.fn(),
    create: jest.fn(),
    revokeByCarrierId: jest.fn().mockResolvedValue(undefined),
    revokeByOrganizationId: jest.fn().mockResolvedValue(undefined),
  };

  // Compute-on-read compliance: mock the document + agreement repos so a
  // carrier with a confirmed, non-expired INSURANCE_CERT and a signed
  // DISPATCH_AGREEMENT presents as fully compliant — matches the legacy
  // fixture's cached column values (`*OnFile: true`, `*Expiry: null`).
  const mockDocumentRepo = {
    findManyForCompliance: jest.fn().mockResolvedValue([
      {
        id: 'doc-insurance-1',
        organizationId: 'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        entityType: 'carrier',
        entityId: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
        type: 'INSURANCE_CERT',
        fileName: 'coi.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        s3Key: 's3://test/coi.pdf',
        url: 'https://test/coi.pdf',
        uploadStatus: 'confirmed',
        isArchived: false,
        uploadedByUserId: null,
        notes: null,
        expiresAt: null,
        metadata: null,
        reviewStatus: 'approved',
        reviewedAt: null,
        reviewedByUserId: null,
        rejectionReason: null,
        signatureData: null,
        signedAt: null,
        createdAt: new Date('2026-03-01T00:00:00.000Z'),
        uploadedByUser: null,
      },
    ]),
  };
  const mockAgreementRepo = {
    findManySigned: jest.fn().mockResolvedValue([
      {
        id: 'agreement-1',
        carrierId: '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
        signedAt: new Date('2026-03-01T00:00:00.000Z'),
      },
    ]),
  };

  const carrierService = createCarrierService({
    carrierRepository: mockCarrierRepository,
    loadRepository: mockLoadRepository,
    noteRepository: mockNoteRepository,
    auditLog: mockAuditLog,
    inviteTokenRepo: mockInviteTokenRepo,
    derivedComplianceDeps: {
      documentRepo: mockDocumentRepo,
      agreementRepo: mockAgreementRepo,
    },
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
      'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
      expect.any(Date),
    );
    expect(mockInviteTokenRepo.revokeByCarrierId).toHaveBeenCalledWith(
      '4b8f0dc8-6bb8-4d7f-b1ca-611e7f04f238',
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
          dispatchFeeType: DispatchFeeType.PERCENTAGE,
          dispatchFeePercent: 10,
        },
        role: 'admin',
      });

      expect(mockCarrierRepository.create).toHaveBeenCalledWith(
        'd73084dd-d6e7-4b79-af2b-63d17b4f4349',
        {
          name: 'Blue Bird Logistics',
          type: CarrierType.EXTERNAL_CARRIER,
          dispatchFeeType: DispatchFeeType.PERCENTAGE,
          dispatchFeePercent: 10,
        },
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
          dispatchFeeType: DispatchFeeType.PERCENTAGE,
          dispatchFeePercent: 10,
          drivers: [{ firstName: 'John', lastName: 'Doe', payType: 'PER_MILE' as const, payRate: 0.5 }],
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
            dispatchFeeType: DispatchFeeType.PERCENTAGE,
            dispatchFeePercent: 10,
            drivers: [{ firstName: 'John', lastName: 'Doe', payType: 'PER_MILE' as const, payRate: 0.5 }],
            vehicles: [{ unitNumber: 'T-100', type: 'DRY_VAN' }],
          },
          drivers: [{ firstName: 'John', lastName: 'Doe', payType: 'PER_MILE' as const, payRate: 0.5 }],
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

  });

  describe('dispatch fee business rules', () => {
    const ORG = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';

    it('rejects EXTERNAL_CARRIER with PERCENTAGE fee of 0', async () => {
      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Zero Fee Carrier',
            type: CarrierType.EXTERNAL_CARRIER,
            dispatchFeeType: DispatchFeeType.PERCENTAGE,
            dispatchFeePercent: 0,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('rejects EXTERNAL_CARRIER with FLAT fee of 0', async () => {
      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Zero Flat Carrier',
            type: CarrierType.EXTERNAL_CARRIER,
            dispatchFeeType: DispatchFeeType.FLAT,
            dispatchFeeAmount: 0,
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestError);
    });

    it('accepts EXTERNAL_CARRIER with PERCENTAGE fee > 0', async () => {
      mockCarrierRepository.create.mockResolvedValue(buildCarrier());

      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Valid PCT Carrier',
            type: CarrierType.EXTERNAL_CARRIER,
            dispatchFeeType: DispatchFeeType.PERCENTAGE,
            dispatchFeePercent: 10,
          },
        }),
      ).resolves.toBeDefined();
    });

    it('accepts EXTERNAL_CARRIER with FLAT fee > 0', async () => {
      mockCarrierRepository.create.mockResolvedValue(buildCarrier());

      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Valid Flat Carrier',
            type: CarrierType.EXTERNAL_CARRIER,
            dispatchFeeType: DispatchFeeType.FLAT,
            dispatchFeeAmount: 300,
          },
        }),
      ).resolves.toBeDefined();
    });

    it('accepts COMPANY_ASSET with fee of 0', async () => {
      mockCarrierRepository.create.mockResolvedValue(buildCarrier());

      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Company Asset',
            type: CarrierType.COMPANY_ASSET,
            dispatchFeeType: DispatchFeeType.PERCENTAGE,
            dispatchFeePercent: 0,
          },
        }),
      ).resolves.toBeDefined();
    });

    it('accepts LEASED_CARRIER with fee of 0', async () => {
      mockCarrierRepository.create.mockResolvedValue(buildCarrier());

      await expect(
        carrierService.createCarrier({
          organizationId: ORG,
          role: 'admin',
          input: {
            name: 'Leased Carrier',
            type: CarrierType.LEASED_CARRIER,
            dispatchFeeType: DispatchFeeType.PERCENTAGE,
            dispatchFeePercent: 0,
          },
        }),
      ).resolves.toBeDefined();
    });
  });
});
