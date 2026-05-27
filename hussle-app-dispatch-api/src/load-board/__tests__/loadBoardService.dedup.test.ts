import { createLoadBoardService } from '../services/loadBoardService';
import type { LoadBoardRedisPort } from '../types/loadBoardPorts';
import type { Logger } from '../../shared/utils/logger';

const buildRelayRaw = (sourceId: string): Record<string, unknown> => ({
  id: sourceId,
  payout: { value: 1500 },
  totalDistance: { value: 600 },
  deadhead: { value: 50 },
  loads: [
    {
      distance: { value: 550 },
      equipmentType: 'DRY_VAN',
      commodity: 'Electronics',
      loadType: 'FULL',
    },
  ],
  transitOperatorType: 'SOLO',
  workType: 'LONG_HAUL',
  totalDuration: 3600000,
  firstPickupTime: '2026-04-10T08:00:00Z',
  lastDeliveryTime: '2026-04-11T08:00:00Z',
  startLocation: { city: 'Dallas', state: 'TX', latitude: 32.78, longitude: -96.8 },
  endLocation: { city: 'Chicago', state: 'IL', latitude: 41.88, longitude: -87.63 },
  stopCount: 2,
});

const buildDatRaw = (sourceId: string): Record<string, unknown> => ({
  id: sourceId,
  rate: { rateUsd: 2000 },
  length: 700,
  origin: { city: 'Houston', stateProv: 'TX', latitude: 29.76, longitude: -95.37 },
  destination: { city: 'Atlanta', stateProv: 'GA', latitude: 33.75, longitude: -84.39 },
  equipmentType: 'V',
  deadheadMiles: 40,
});

describe('loadBoardService.ingest dedup', () => {
  const mockRedisPort: jest.Mocked<LoadBoardRedisPort> = {
    snapshotReplace: jest.fn(),
    addIfAbsent: jest.fn(),
    getAllLoads: jest.fn(),
    getLoadById: jest.fn(),
    clearSource: jest.fn(),
    getMeta: jest.fn(),
    updateMeta: jest.fn(),
  };

  const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const service = createLoadBoardService({
    redisPort: mockRedisPort,
    logger: mockLogger,
  });

  beforeEach(() => jest.clearAllMocks());

  it('returns ingested=N skipped=0 total=N when all loads are new', async () => {
    mockRedisPort.addIfAbsent.mockResolvedValue(true);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    const result = await service.ingest({
      organizationId: 'org-1',
      source: 'relay',
      loads: [buildRelayRaw('a'), buildRelayRaw('b'), buildRelayRaw('c')],
    });

    expect(result).toEqual({ ingested: 3, skipped: 0, total: 3 });
    expect(mockRedisPort.addIfAbsent).toHaveBeenCalledTimes(3);
  });

  it('returns ingested=0 skipped=N total=N when all loads already exist', async () => {
    mockRedisPort.addIfAbsent.mockResolvedValue(false);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    const result = await service.ingest({
      organizationId: 'org-1',
      source: 'relay',
      loads: [buildRelayRaw('a'), buildRelayRaw('b')],
    });

    expect(result).toEqual({ ingested: 0, skipped: 2, total: 2 });
  });

  it('returns split counts for mixed new + duplicate payload', async () => {
    mockRedisPort.addIfAbsent
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    const result = await service.ingest({
      organizationId: 'org-1',
      source: 'dat',
      loads: [buildDatRaw('a'), buildDatRaw('b'), buildDatRaw('c'), buildDatRaw('d')],
    });

    expect(result).toEqual({ ingested: 2, skipped: 2, total: 4 });
  });

  it('passes the correct org and source to addIfAbsent', async () => {
    mockRedisPort.addIfAbsent.mockResolvedValue(true);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    await service.ingest({
      organizationId: 'org-42',
      source: 'dat',
      loads: [buildDatRaw('x')],
    });

    expect(mockRedisPort.addIfAbsent).toHaveBeenCalledWith(
      'org-42',
      'dat',
      expect.objectContaining({ source: 'dat' }),
    );
  });

  it('updateMeta receives newly-added count, not total', async () => {
    mockRedisPort.addIfAbsent
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    await service.ingest({
      organizationId: 'org-1',
      source: 'relay',
      loads: [buildRelayRaw('a'), buildRelayRaw('b'), buildRelayRaw('c')],
    });

    expect(mockRedisPort.updateMeta).toHaveBeenCalledWith('org-1', 'relay', 2);
  });

  it('does not call snapshotReplace anymore', async () => {
    mockRedisPort.addIfAbsent.mockResolvedValue(true);
    mockRedisPort.updateMeta.mockResolvedValue(undefined);

    await service.ingest({
      organizationId: 'org-1',
      source: 'relay',
      loads: [buildRelayRaw('a')],
    });

    expect(mockRedisPort.snapshotReplace).not.toHaveBeenCalled();
  });
});
