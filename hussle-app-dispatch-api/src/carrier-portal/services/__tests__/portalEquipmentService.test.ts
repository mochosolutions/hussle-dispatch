import type { VehicleCategory } from '@prisma/client';
import { ValidationError } from '@/shared/errors';
import { createPortalEquipmentService } from '../portalEquipmentService';

const CARRIER_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const ORG_ID = '11111111-1111-1111-1111-111111111111';

const carrier = { id: CARRIER_ID, mcNumber: '123456', dotNumber: '654321' };

const buildVehicle = (
  overrides: Partial<Parameters<ReturnType<typeof createPortalEquipmentService>['saveEquipment']>[0]['vehicles'][number]> = {},
) => ({
  category: 'SEMI_TRUCK' as VehicleCategory,
  year: 2020,
  make: 'Freightliner',
  model: 'Cascadia',
  vin: '1FUJGHDV0CLBP1234',
  licensePlate: 'TX-AB123',
  ...overrides,
});

describe('portalEquipmentService.saveEquipment (upsert-by-id)', () => {
  const setup = (
    existing: { id: string; unitNumber: string }[] = [],
  ) => {
    const findCarrierById = jest.fn().mockResolvedValue(carrier);
    const findVehiclesByCarrierId = jest.fn().mockResolvedValue(existing);
    const upsertVehicles = jest.fn(
      async (_carrierId: string, data: { id?: string }[], _deleteIds: string[]) =>
        data.map((v, i) => ({
          id: v.id ?? `new-${i}`,
          category: 'SEMI_TRUCK' as VehicleCategory,
          make: 'M',
          model: 'M',
          year: 2020,
        })),
    );
    const service = createPortalEquipmentService({
      findCarrierById,
      findVehiclesByCarrierId,
      upsertVehicles,
    });
    return { service, findCarrierById, findVehiclesByCarrierId, upsertVehicles };
  };

  it('creates all vehicles when carrier has no existing vehicles', async () => {
    const { service, upsertVehicles } = setup([]);

    await service.saveEquipment({
      carrierId: CARRIER_ID,
      organizationId: ORG_ID,
      vehicles: [buildVehicle(), buildVehicle({ make: 'Volvo' })],
    });

    const [, data, deleteIds] = upsertVehicles.mock.calls[0] as [string, Array<{ id?: string; unitNumber: string }>, string[]];
    expect(deleteIds).toEqual([]);
    expect(data).toHaveLength(2);
    expect(data[0]?.id).toBeUndefined();
    expect(data[1]?.id).toBeUndefined();
    expect(data[0]?.unitNumber).toBe('V-001');
    expect(data[1]?.unitNumber).toBe('V-002');
  });

  it('preserves ids and unitNumbers on re-save of the same list', async () => {
    const existing = [
      { id: 'veh-1', unitNumber: 'V-001' },
      { id: 'veh-2', unitNumber: 'V-002' },
    ];
    const { service, upsertVehicles } = setup(existing);

    await service.saveEquipment({
      carrierId: CARRIER_ID,
      organizationId: ORG_ID,
      vehicles: [
        buildVehicle({ id: 'veh-1' }),
        buildVehicle({ id: 'veh-2', make: 'Volvo' }),
      ],
    });

    const [, data, deleteIds] = upsertVehicles.mock.calls[0] as [string, Array<{ id?: string; unitNumber: string }>, string[]];
    expect(deleteIds).toEqual([]);
    expect(data.map((v) => v.id)).toEqual(['veh-1', 'veh-2']);
    expect(data.map((v) => v.unitNumber)).toEqual(['V-001', 'V-002']);
  });

  it('matrix: edit + remove + add yields correct delete + upsert sets with stable ids', async () => {
    const existing = [
      { id: 'veh-1', unitNumber: 'V-001' },
      { id: 'veh-2', unitNumber: 'V-002' },
      { id: 'veh-3', unitNumber: 'V-003' },
    ];
    const { service, upsertVehicles } = setup(existing);

    // veh-1 edited (kept), veh-2 removed, veh-3 unchanged, plus one new vehicle.
    await service.saveEquipment({
      carrierId: CARRIER_ID,
      organizationId: ORG_ID,
      vehicles: [
        buildVehicle({ id: 'veh-1', make: 'EditedMake' }),
        buildVehicle({ id: 'veh-3', make: 'Kenworth' }),
        buildVehicle({ make: 'NewMake', vin: '1HGCM82633A123456' }),
      ],
    });

    const [, data, deleteIds] = upsertVehicles.mock.calls[0] as [string, Array<{ id?: string; unitNumber: string }>, string[]];

    expect(deleteIds).toEqual(['veh-2']);

    // Existing rows keep their ids and unitNumbers.
    expect(data[0]).toMatchObject({ id: 'veh-1', unitNumber: 'V-001', make: 'EditedMake' });
    expect(data[1]).toMatchObject({ id: 'veh-3', unitNumber: 'V-003', make: 'Kenworth' });

    // New row has no id (the repo will allocate) and a unique unitNumber that does not
    // collide with the reused V-001 / V-003 — V-002 is free or V-004 is next.
    expect(data[2]?.id).toBeUndefined();
    expect(data[2]?.unitNumber).not.toBe('V-001');
    expect(data[2]?.unitNumber).not.toBe('V-003');
    expect(data[2]?.unitNumber.startsWith('V-')).toBe(true);
  });

  it('deletes all existing vehicles when the incoming list is empty of known ids', async () => {
    const existing = [
      { id: 'veh-1', unitNumber: 'V-001' },
      { id: 'veh-2', unitNumber: 'V-002' },
    ];
    const { service, upsertVehicles } = setup(existing);

    await service.saveEquipment({
      carrierId: CARRIER_ID,
      organizationId: ORG_ID,
      vehicles: [buildVehicle()],
    });

    const [, data, deleteIds] = upsertVehicles.mock.calls[0] as [string, Array<{ id?: string; unitNumber: string }>, string[]];
    expect(deleteIds).toEqual(expect.arrayContaining(['veh-1', 'veh-2']));
    expect(data).toHaveLength(1);
    expect(data[0]?.id).toBeUndefined();
  });

  it('throws ValidationError when carrier is missing MC number for a semi truck', async () => {
    const findCarrierById = jest
      .fn()
      .mockResolvedValue({ id: CARRIER_ID, mcNumber: null, dotNumber: '654321' });
    const findVehiclesByCarrierId = jest.fn().mockResolvedValue([]);
    const upsertVehicles = jest.fn();
    const service = createPortalEquipmentService({
      findCarrierById,
      findVehiclesByCarrierId,
      upsertVehicles,
    });

    await expect(
      service.saveEquipment({
        carrierId: CARRIER_ID,
        organizationId: ORG_ID,
        vehicles: [buildVehicle({ category: 'SEMI_TRUCK' })],
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(upsertVehicles).not.toHaveBeenCalled();
  });

  it('throws ValidationError when carrier is not found', async () => {
    const findCarrierById = jest.fn().mockResolvedValue(null);
    const findVehiclesByCarrierId = jest.fn();
    const upsertVehicles = jest.fn();
    const service = createPortalEquipmentService({
      findCarrierById,
      findVehiclesByCarrierId,
      upsertVehicles,
    });

    await expect(
      service.saveEquipment({
        carrierId: 'missing',
        organizationId: ORG_ID,
        vehicles: [buildVehicle()],
      }),
    ).rejects.toBeInstanceOf(ValidationError);

    expect(findVehiclesByCarrierId).not.toHaveBeenCalled();
    expect(upsertVehicles).not.toHaveBeenCalled();
  });
});
