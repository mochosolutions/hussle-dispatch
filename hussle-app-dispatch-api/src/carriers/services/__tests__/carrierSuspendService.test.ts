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
  dispatchAgreementOnFile: true,
  insuranceCertOnFile: true,
  insuranceExpiry: futureDate,
  w9OnFile: true,
  ...overrides,
});

const makeDeps = () => {
  const port: jest.Mocked<CarrierSuspendPort> = {
    findById: jest.fn(),
    setStatus: jest.fn().mockImplementation((id, status) =>
      Promise.resolve({ id, status }),
    ),
  };
  const auditLog = {
    create: jest.fn().mockResolvedValue(undefined),
  };
  return { suspendPort: port, auditLog };
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
    const deps = makeDeps();
    deps.suspendPort.findById.mockResolvedValue(
      buildCarrier({
        status: CarrierStatus.SUSPENDED,
        insuranceExpiry: new Date('2020-01-01'),
      }),
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
