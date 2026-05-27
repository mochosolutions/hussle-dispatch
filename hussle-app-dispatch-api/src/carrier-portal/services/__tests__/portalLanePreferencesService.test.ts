import { createPortalLanePreferencesService } from '../portalLanePreferencesService';
import type {
  FleetLanePreferences,
  SaveLanePreferencesInput,
} from '../../types/lanePreferencesTypes';

const CARRIER_ID = 'd73084dd-d6e7-4b79-af2b-63d17b4f4349';
const ORG_ID = '11111111-1111-1111-1111-111111111111';

const buildFleet = (overrides: Partial<FleetLanePreferences> = {}): FleetLanePreferences => ({
  lanes: { TX: 'preferred', CA: 'avoid' },
  schedule: {
    mon: 'on',
    tue: 'on',
    wed: 'on',
    thu: 'on',
    fri: 'on',
    sat: 'off',
    sun: 'off',
  },
  schedulePreset: 'weekdays',
  homeBaseCity: 'Houston',
  homeBaseState: 'TX',
  maxDaysOut: 14,
  freightTypes: { dry_van: 'on' } as FleetLanePreferences['freightTypes'],
  ...overrides,
});

const buildInput = (overrides: Partial<SaveLanePreferencesInput> = {}): SaveLanePreferencesInput => ({
  fleet: buildFleet(),
  overrides: {},
  ...overrides,
});

const setup = (saveTransactional?: jest.Mock) => {
  const writePort = {
    saveTransactional: saveTransactional ?? jest.fn().mockResolvedValue(undefined),
  };
  const service = createPortalLanePreferencesService({ writePort });
  return { service, writePort };
};

describe('portalLanePreferencesService.saveLanePreferences', () => {
  it('forwards fleet defaults to the write port', async () => {
    const { service, writePort } = setup();

    await service.saveLanePreferences(CARRIER_ID, ORG_ID, buildInput());

    expect(writePort.saveTransactional).toHaveBeenCalledTimes(1);
    const call = writePort.saveTransactional.mock.calls[0] as unknown as [
      string,
      string,
      SaveLanePreferencesInput,
    ];
    expect(call[0]).toBe(CARRIER_ID);
    expect(call[1]).toBe(ORG_ID);
    expect(call[2].fleet.lanes).toEqual({ TX: 'preferred', CA: 'avoid' });
    expect(call[2].fleet.schedulePreset).toBe('weekdays');
    expect(call[2].overrides).toEqual({});
  });

  it('forwards per-driver overrides keyed by driverId', async () => {
    const { service, writePort } = setup();

    await service.saveLanePreferences(
      CARRIER_ID,
      ORG_ID,
      buildInput({
        overrides: {
          'driver-1': {
            lanes: { OR: 'preferred' },
            freightTypes: { reefer: 'on' } as FleetLanePreferences['freightTypes'],
          },
          'driver-2': {
            schedule: {
              mon: 'flex',
              tue: 'flex',
              wed: 'flex',
              thu: 'flex',
              fri: 'flex',
              sat: 'flex',
              sun: 'flex',
            },
          },
        },
      }),
    );

    const call = writePort.saveTransactional.mock.calls[0] as unknown as [
      string,
      string,
      SaveLanePreferencesInput,
    ];
    expect(Object.keys(call[2].overrides)).toEqual(['driver-1', 'driver-2']);
    expect(call[2].overrides['driver-1']?.lanes).toEqual({ OR: 'preferred' });
    expect(call[2].overrides['driver-2']?.schedule?.mon).toBe('flex');
  });

  it('propagates transactional write failures', async () => {
    const failingWrite = jest.fn().mockRejectedValue(new Error('driver update failed inside tx'));
    const { service } = setup(failingWrite);

    await expect(
      service.saveLanePreferences(CARRIER_ID, ORG_ID, buildInput()),
    ).rejects.toThrow('driver update failed inside tx');
  });

  it('returns saved: true on success', async () => {
    const { service } = setup();
    const result = await service.saveLanePreferences(CARRIER_ID, ORG_ID, buildInput());
    expect(result).toEqual({ saved: true });
  });
});
