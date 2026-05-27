import { NotFoundError } from '@/shared/errors/commonErrors';
import { createPortalCostAnalysisService } from '../portalCostAnalysisService';
import type { CostAnalysisInput } from '../../types/costAnalysisTypes';

const CARRIER_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const ORG_ID = '11111111-1111-1111-1111-111111111111';
const ASSET_ID = '22222222-2222-2222-2222-222222222222';

const baseInput = (overrides: Partial<CostAnalysisInput> = {}): CostAnalysisInput => ({
  equipmentPayments: [
    { assetId: ASSET_ID, ownership: 'financed', monthlyAmount: 2000, insuranceMonthlyAmount: 600 },
  ],
  policies: [{ id: 'pol-1', name: 'Cargo', monthlyAmount: 150 }],
  subscriptions: [{ id: 'sub-1', name: 'TMS', monthlyAmount: 50 }],
  overhead: {
    officeUtilities: 100,
    accountingLegal: 100,
    bankFeesCardsFactoring: 100,
  },
  ownerPay: { perTruckWeekly: 1000, payBasis: 'gross' },
  fuel: { dieselPrice: 4, mpg: 6.5 },
  wearOps: { maintenance: 0.1, tires: 0.04, def: 0.01, tolls: 0.05 },
  operating: { loadedMilesPerMonth: 9000, deadheadPct: 10, marginPct: 15 },
  ...overrides,
});

const setupDeps = (overrides: { findById?: jest.Mock; saveTransactional?: jest.Mock } = {}) => ({
  carrierCostProfileRepo: {
    findById: overrides.findById ?? jest.fn().mockResolvedValue({
      id: CARRIER_ID,
      dispatchFeePercent: 10,
      costProfileVersion: 0,
    }),
  },
  writePort: {
    saveTransactional: overrides.saveTransactional ?? jest.fn().mockResolvedValue(undefined),
  },
});

describe('portalCostAnalysisService.saveCostAnalysis (hybrid storage)', () => {
  it('throws NotFoundError when carrier cannot be found', async () => {
    const deps = setupDeps({ findById: jest.fn().mockResolvedValue(null) });
    const service = createPortalCostAnalysisService(deps);

    await expect(service.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput())).rejects.toBeInstanceOf(
      NotFoundError,
    );

    expect(deps.writePort.saveTransactional).not.toHaveBeenCalled();
  });

  it('forwards equipmentPayments, answers patch, and bumped costProfileVersion to writePort', async () => {
    const deps = setupDeps();
    const service = createPortalCostAnalysisService(deps);

    const result = await service.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput());

    expect(deps.writePort.saveTransactional).toHaveBeenCalledTimes(1);
    const args = deps.writePort.saveTransactional.mock.calls[0] as unknown as [
      string,
      string,
      {
        equipmentPayments: CostAnalysisInput['equipmentPayments'];
        answersPatch: { costAnalysis: Record<string, unknown> };
        minimumRatePerMile: number;
        nextCostProfileVersion: number;
        costProfileSource: string;
      },
    ];
    expect(args[0]).toBe(CARRIER_ID);
    expect(args[1]).toBe(ORG_ID);
    expect(args[2].equipmentPayments[0]?.assetId).toBe(ASSET_ID);
    expect(args[2].equipmentPayments[0]?.ownership).toBe('financed');
    expect(args[2].equipmentPayments[0]?.monthlyAmount).toBe(2000);
    expect(args[2].nextCostProfileVersion).toBe(1);
    expect(args[2].costProfileSource).toBe('onboarding_estimate');
    expect(args[2].answersPatch.costAnalysis).toMatchObject({
      policies: expect.any(Array),
      subscriptions: expect.any(Array),
      overhead: expect.any(Object),
      ownerPay: expect.any(Object),
      fuel: expect.any(Object),
      wearOps: expect.any(Object),
      operating: expect.any(Object),
      computed: expect.objectContaining({
        breakEvenCpm: expect.any(Number),
        minimumRatePerMile: expect.any(Number),
      }),
    });
    expect(result.costProfileVersion).toBe(1);
    expect(result.minimumRatePerMile).toBeGreaterThan(0);
    expect(result.breakEvenCpm).toBeGreaterThan(0);
    expect(result.fuelCostPerMile).toBeCloseTo(4 / 6.5, 6);
  });

  it('break-even CPM increases when fixed costs go up', async () => {
    const deps1 = setupDeps();
    const deps2 = setupDeps();
    const service1 = createPortalCostAnalysisService(deps1);
    const service2 = createPortalCostAnalysisService(deps2);

    const low = await service1.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput());
    const high = await service2.saveCostAnalysis(
      CARRIER_ID,
      ORG_ID,
      baseInput({
        policies: [{ id: 'pol-1', name: 'Cargo', monthlyAmount: 5000 }],
      }),
    );

    expect(high.breakEvenCpm).toBeGreaterThan(low.breakEvenCpm);
    expect(high.minimumRatePerMile).toBeGreaterThan(low.minimumRatePerMile);
  });

  it('minimumRatePerMile accounts for dispatch fee and margin', async () => {
    const lowFee = setupDeps({
      findById: jest
        .fn()
        .mockResolvedValue({ id: CARRIER_ID, dispatchFeePercent: 5, costProfileVersion: 0 }),
    });
    const highFee = setupDeps({
      findById: jest
        .fn()
        .mockResolvedValue({ id: CARRIER_ID, dispatchFeePercent: 20, costProfileVersion: 0 }),
    });

    const svc1 = createPortalCostAnalysisService(lowFee);
    const svc2 = createPortalCostAnalysisService(highFee);

    const r1 = await svc1.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput());
    const r2 = await svc2.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput());

    expect(r2.minimumRatePerMile).toBeGreaterThan(r1.minimumRatePerMile);
  });

  it('propagates writePort transactional failures (rollback handled by Prisma at the adapter layer)', async () => {
    const failingWrite = jest.fn().mockRejectedValue(new Error('vehicle update failed inside tx'));
    const deps = setupDeps({ saveTransactional: failingWrite });
    const service = createPortalCostAnalysisService(deps);

    await expect(service.saveCostAnalysis(CARRIER_ID, ORG_ID, baseInput())).rejects.toThrow(
      'vehicle update failed inside tx',
    );
  });
});
