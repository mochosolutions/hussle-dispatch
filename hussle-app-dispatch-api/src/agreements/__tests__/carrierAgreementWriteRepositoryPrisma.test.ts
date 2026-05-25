import type { PrismaClient } from '@prisma/client';

import { carrierAgreementWriteRepositoryPrisma } from '../repositories/carrierAgreementWriteRepositoryPrisma';

interface MockCarrierDelegate {
  findUnique: jest.Mock;
  update: jest.Mock;
}

const makePrismaMock = (): { prisma: PrismaClient; carrier: MockCarrierDelegate } => {
  const carrier: MockCarrierDelegate = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const prisma = { carrier } as unknown as PrismaClient;
  return { prisma, carrier };
};

describe('carrierAgreementWriteRepositoryPrisma.setSignedAgreementId', () => {
  it('writes signedAgreementId and dispatchAgreementSignedAt when both fields are null', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({
      signedAgreementId: null,
      dispatchAgreementSignedAt: null,
    });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.setSignedAgreementId('car-1', 'ag-1');

    expect(carrier.findUnique).toHaveBeenCalledWith({
      where: { id: 'car-1' },
      select: { signedAgreementId: true, dispatchAgreementSignedAt: true },
    });
    expect(carrier.update).toHaveBeenCalledTimes(1);
    const updateArgs = carrier.update.mock.calls[0]?.[0];
    expect(updateArgs.where).toEqual({ id: 'car-1' });
    expect(updateArgs.data.signedAgreementId).toBe('ag-1');
    expect(updateArgs.data.dispatchAgreementSignedAt).toBeInstanceOf(Date);
  });

  it('skips the update when signedAgreementId and dispatchAgreementSignedAt are already set (idempotency)', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({
      signedAgreementId: 'ag-existing',
      dispatchAgreementSignedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.setSignedAgreementId('car-1', 'ag-new');

    expect(carrier.update).not.toHaveBeenCalled();
  });

  it('writes when only one of the projection fields is set (partial state self-heal)', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({
      signedAgreementId: 'ag-existing',
      dispatchAgreementSignedAt: null,
    });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.setSignedAgreementId('car-1', 'ag-new');

    expect(carrier.update).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the carrier no longer exists', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue(null);

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.setSignedAgreementId('car-deleted', 'ag-1');

    expect(carrier.update).not.toHaveBeenCalled();
  });

  it('writes dispatchAgreementOnFile=true alongside the timestamps (lockstep)', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({
      signedAgreementId: null,
      dispatchAgreementSignedAt: null,
    });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.setSignedAgreementId('car-1', 'ag-1');

    const updateArgs = carrier.update.mock.calls[0]?.[0];
    expect(updateArgs.data.dispatchAgreementOnFile).toBe(true);
  });
});

describe('carrierAgreementWriteRepositoryPrisma.clearSignedAgreement', () => {
  it('clears all three projection fields atomically', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({ status: 'ONBOARDING' });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.clearSignedAgreement('car-1');

    const updateArgs = carrier.update.mock.calls[0]?.[0];
    expect(updateArgs.data.signedAgreementId).toBeNull();
    expect(updateArgs.data.dispatchAgreementSignedAt).toBeNull();
    expect(updateArgs.data.dispatchAgreementOnFile).toBe(false);
  });

  it('reverts PENDING_APPROVAL → ONBOARDING when the carrier had completed onboarding', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({ status: 'PENDING_APPROVAL' });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.clearSignedAgreement('car-1');

    const updateArgs = carrier.update.mock.calls[0]?.[0];
    expect(updateArgs.data.status).toBe('ONBOARDING');
  });

  it('does not touch status for ONBOARDING carriers (typical mid-flow case)', async () => {
    const { prisma, carrier } = makePrismaMock();
    carrier.findUnique.mockResolvedValue({ status: 'ONBOARDING' });
    carrier.update.mockResolvedValue({});

    const repo = carrierAgreementWriteRepositoryPrisma(prisma);
    await repo.clearSignedAgreement('car-1');

    const updateArgs = carrier.update.mock.calls[0]?.[0];
    expect(updateArgs.data.status).toBeUndefined();
  });
});
