import { CarrierStatus, CarrierType } from '@prisma/client';
import { InvalidTransitionError, NotFoundError } from '@/shared/errors';
import { createCarrierSuspendService } from '../carrierSuspendService';
import type { CarrierForSuspend, CarrierSuspendPort } from '../../types/suspendTypes';

const ORG = 'org-1';
const CARRIER = 'carrier-1';
const USER = 'user-1';

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);

const buildCarrier = (overrides: Partial<CarrierForSuspend> = {}): CarrierForSuspend => ({
  id: CARRIER,
  name: 'Test Carrier',
  managedByOrgId: ORG,
  status: CarrierStatus.ACTIVE,
  type: CarrierType.EXTERNAL_CARRIER,
  tinOnFile: true,
  ...overrides,
});

interface ComplianceFixture {
  insuranceExpiresAt: Date | null;
  agreementSigned: boolean;
}

const makeDeps = (
  fixture: ComplianceFixture = { insuranceExpiresAt: futureDate, agreementSigned: true },
) => {
  const port: jest.Mocked<CarrierSuspendPort> = {
    findById: jest.fn(),
    setStatus: jest.fn().mockImplementation((id, status) =>
      Promise.resolve({ id, status }),
    ),
  };
  const auditLog = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  // Compute-on-read: feed the gate via mocked document/agreement repos.
  const insuranceDocs = [
    {
      id: 'doc-insurance-1',
      organizationId: ORG,
      entityType: 'carrier',
      entityId: CARRIER,
      type: 'INSURANCE_CERT',
      fileName: 'coi.pdf',
      fileSize: null,
      mimeType: 'application/pdf',
      s3Key: 's3://test/coi.pdf',
      url: 'https://test/coi.pdf',
      uploadStatus: 'confirmed',
      isArchived: false,
      uploadedByUserId: null,
      notes: null,
      expiresAt: fixture.insuranceExpiresAt,
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
  ];
  const documentRepo = {
    findManyForCompliance: jest.fn().mockResolvedValue(insuranceDocs),
  };
  const agreementRepo = {
    findManySigned: jest.fn().mockResolvedValue(
      fixture.agreementSigned
        ? [
            {
              id: 'agreement-1',
              carrierId: CARRIER,
              signedAt: new Date('2026-03-01T00:00:00.000Z'),
            },
          ]
        : [],
    ),
  };
  return {
    suspendPort: port,
    auditLog,
    derivedComplianceDeps: { documentRepo, agreementRepo },
  };
};

describe('carrierSuspendService.suspend', () => {
  it('transitions ACTIVE -> SUSPENDED and writes audit log with reason', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(buildCarrier());

    const service = createCarrierSuspendService(deps);
    const result = await service.suspend({
      carrierId: CARRIER,
      organizationId: ORG,
      userId: USER,
      reason: 'Repeated late deliveries',
    });

    expect(result.data.status).toBe(CarrierStatus.SUSPENDED);
    expect(deps.suspendPort.setStatus).toHaveBeenCalledWith(CARRIER, CarrierStatus.SUSPENDED);
    expect(deps.auditLog.create).toHaveBeenCalledWith(ORG, expect.objectContaining({
      userId: USER,
      action: 'CARRIER_SUSPENDED',
      entityType: 'CARRIER',
      entityId: CARRIER,
      changes: { status: { old: CarrierStatus.ACTIVE, new: CarrierStatus.SUSPENDED } },
      metadata: { reason: 'Repeated late deliveries' },
    }));
  });

  it('throws NotFoundError when carrier missing or in other org', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(null);

    const service = createCarrierSuspendService(deps);

    await expect(
      service.suspend({ carrierId: CARRIER, organizationId: ORG, userId: USER, reason: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws InvalidTransitionError when carrier is in DRAFT (not active)', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(buildCarrier({ status: CarrierStatus.DRAFT }));

    const service = createCarrierSuspendService(deps);

    await expect(
      service.suspend({ carrierId: CARRIER, organizationId: ORG, userId: USER, reason: 'x' }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});

describe('carrierSuspendService.unsuspend', () => {
  it('transitions SUSPENDED -> ACTIVE when documents are valid', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(buildCarrier({ status: CarrierStatus.SUSPENDED }));

    const service = createCarrierSuspendService(deps);
    const result = await service.unsuspend({
      carrierId: CARRIER,
      organizationId: ORG,
      userId: USER,
    });

    expect(result.data.status).toBe(CarrierStatus.ACTIVE);
    expect(deps.suspendPort.setStatus).toHaveBeenCalledWith(CARRIER, CarrierStatus.ACTIVE);
    expect(deps.auditLog.create).toHaveBeenCalledWith(ORG, expect.objectContaining({
      action: 'CARRIER_UNSUSPENDED',
      changes: { status: { old: CarrierStatus.SUSPENDED, new: CarrierStatus.ACTIVE } },
      metadata: null,
    }));
  });

  it('transitions SUSPENDED -> ACTION_REQUIRED when insurance expired', async () => {
    const deps = makeDeps({
      insuranceExpiresAt: new Date('2020-01-01'),
      agreementSigned: true,
    });
    deps.suspendPort.findById.mockResolvedValue(
      buildCarrier({ status: CarrierStatus.SUSPENDED }),
    );

    const service = createCarrierSuspendService(deps);
    const result = await service.unsuspend({
      carrierId: CARRIER,
      organizationId: ORG,
      userId: USER,
    });

    expect(result.data.status).toBe(CarrierStatus.ACTION_REQUIRED);
    expect(deps.suspendPort.setStatus).toHaveBeenCalledWith(
      CARRIER,
      CarrierStatus.ACTION_REQUIRED,
    );
    expect(deps.auditLog.create).toHaveBeenCalledWith(ORG, expect.objectContaining({
      action: 'CARRIER_UNSUSPENDED',
      metadata: expect.objectContaining({
        missingDocuments: expect.arrayContaining([expect.stringContaining('expired')]),
      }),
    }));
  });

  it('throws NotFoundError when carrier missing', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(null);

    const service = createCarrierSuspendService(deps);

    await expect(
      service.unsuspend({ carrierId: CARRIER, organizationId: ORG, userId: USER }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws InvalidTransitionError when carrier is not SUSPENDED', async () => {
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(buildCarrier({ status: CarrierStatus.ACTIVE }));

    const service = createCarrierSuspendService(deps);

    await expect(
      service.unsuspend({ carrierId: CARRIER, organizationId: ORG, userId: USER }),
    ).rejects.toBeInstanceOf(InvalidTransitionError);
  });
});
