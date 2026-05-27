import { DriverStatus } from '@prisma/client';
import { createPortalDriversService } from '../portalDriversService';

const CARRIER_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';

const buildDriver = (overrides: Partial<{ id?: string; firstName: string; lastName: string; payType?: string; payRate?: number }> = {}) => ({
  firstName: 'Maya',
  lastName: 'Driver',
  ...overrides,
});

const setup = (existing: { id: string }[] = []) => {
  const driverRepo = {
    findByCarrierId: jest.fn().mockResolvedValue(existing),
    deleteByCarrierId: jest.fn().mockResolvedValue(undefined),
    upsertMany: jest.fn(
      async (_carrierId: string, data: { id?: string; firstName: string; lastName: string }[], _deleteIds: string[]) =>
        data.map((d, i) => ({
          id: d.id ?? `new-${i}`,
          firstName: d.firstName,
          lastName: d.lastName,
        })),
    ),
  };
  const service = createPortalDriversService({ driverRepo });
  return { service, driverRepo };
};

describe('portalDriversService.saveDrivers (upsert-by-id)', () => {
  it('soft-deletes all drivers when hasAdditionalDrivers is false', async () => {
    const { service, driverRepo } = setup([{ id: 'drv-1' }]);

    const result = await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: false,
    });

    expect(driverRepo.deleteByCarrierId).toHaveBeenCalledWith(CARRIER_ID);
    expect(driverRepo.upsertMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('creates new drivers when carrier has none', async () => {
    const { service, driverRepo } = setup([]);

    const result = await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: true,
      drivers: [buildDriver(), buildDriver({ firstName: 'Sam' })],
    });

    const [, data, deleteIds] = driverRepo.upsertMany.mock.calls[0] as [string, Array<{ id?: string }>, string[]];
    expect(deleteIds).toEqual([]);
    expect(data).toHaveLength(2);
    expect(data[0]?.id).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it('preserves ids on re-save of the same drivers', async () => {
    const { service, driverRepo } = setup([{ id: 'drv-1' }, { id: 'drv-2' }]);

    await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: true,
      drivers: [buildDriver({ id: 'drv-1' }), buildDriver({ id: 'drv-2', firstName: 'Sam' })],
    });

    const [, data, deleteIds] = driverRepo.upsertMany.mock.calls[0] as [string, Array<{ id?: string }>, string[]];
    expect(deleteIds).toEqual([]);
    expect(data.map((d) => d.id)).toEqual(['drv-1', 'drv-2']);
  });

  it('matrix: edit + remove + add yields correct delete + upsert sets', async () => {
    const { service, driverRepo } = setup([
      { id: 'drv-1' },
      { id: 'drv-2' },
      { id: 'drv-3' },
    ]);

    await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: true,
      drivers: [
        buildDriver({ id: 'drv-1', firstName: 'EditedMaya' }),
        buildDriver({ id: 'drv-3' }),
        buildDriver({ firstName: 'NewHire' }),
      ],
    });

    const [, data, deleteIds] = driverRepo.upsertMany.mock.calls[0] as [string, Array<{ id?: string; firstName: string }>, string[]];
    expect(deleteIds).toEqual(['drv-2']);
    expect(data[0]).toMatchObject({ id: 'drv-1', firstName: 'EditedMaya' });
    expect(data[1]).toMatchObject({ id: 'drv-3' });
    expect(data[2]?.id).toBeUndefined();
    expect(data[2]?.firstName).toBe('NewHire');
  });

  it('soft-deletes all drivers when hasAdditionalDrivers=true but drivers list is empty', async () => {
    const { service, driverRepo } = setup([{ id: 'drv-1' }]);

    const result = await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: true,
      drivers: [],
    });

    expect(driverRepo.deleteByCarrierId).toHaveBeenCalledWith(CARRIER_ID);
    expect(driverRepo.upsertMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('maps pay types and defaults missing payType to PERCENTAGE', async () => {
    const { service, driverRepo } = setup([]);

    await service.saveDrivers({
      carrierId: CARRIER_ID,
      hasAdditionalDrivers: true,
      drivers: [
        buildDriver({ payType: 'PER_MILE', payRate: 0.55 }),
        buildDriver({ firstName: 'Default' }),
      ],
    });

    const call = driverRepo.upsertMany.mock.calls[0] as unknown as [
      string,
      Array<{ payType: string; payRate: number; status: DriverStatus }>,
      string[],
    ];
    const [, data] = call;
    expect(data[0]?.payType).toBe('PER_MILE');
    expect(data[1]?.payType).toBe('PERCENTAGE');
    expect(data[0]?.status).toBe(DriverStatus.ACTIVE);
  });
});
