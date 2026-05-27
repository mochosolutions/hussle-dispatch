import { createLoadBoardService } from '../services/loadBoardService';
import type { LoadBoardRedisPort } from '../types/loadBoardPorts';
import type { Logger } from '../../shared/utils/logger';
import type { StagedLoad, FeedMeta } from '../types/loadBoardTypes';

const buildStagedLoad = (overrides: Partial<StagedLoad> = {}): StagedLoad => ({
  id: 'mock-staged-load-id',
  source: 'relay',
  sourceId: 'relay-src-1',
  payout: 1500,
  ratePerMile: 2.5,
  totalMiles: 600,
  deadheadMiles: 50,
  loadedMiles: 550,
  equipmentType: 'DRY_VAN',
  equipmentTypeRaw: 'DRY_VAN',
  commodity: 'Electronics',
  isTeamDriver: false,
  workType: 'LONG_HAUL',
  loadType: 'FULL',
  totalDuration: 60,
  firstPickupTime: '2026-04-10T08:00:00Z',
  lastDeliveryTime: '2026-04-11T08:00:00Z',
  originCity: 'Dallas',
  originState: 'TX',
  originLat: 32.7767,
  originLng: -96.797,
  destCity: 'Chicago',
  destState: 'IL',
  destLat: 41.8781,
  destLng: -87.6298,
  stopCount: 2,
  costBreakdown: null,
  tags: null,
  rawData: {},
  ingestedAt: '2026-04-10T00:00:00.000Z',
  ...overrides,
});

const buildFeedMeta = (): FeedMeta => ({
  total: 1,
  sources: { relay: 1 },
  lastUpdated: { relay: '2026-04-10T00:00:00.000Z' },
});

const buildRelayRaw = (): Record<string, unknown> => ({
  id: 'relay-src-1',
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
  startLocation: { city: 'Dallas', state: 'TX', latitude: 32.7767, longitude: -96.797 },
  endLocation: { city: 'Chicago', state: 'IL', latitude: 41.8781, longitude: -87.6298 },
  stopCount: 2,
});

const buildDatRaw = (): Record<string, unknown> => ({
  id: 'dat-src-1',
  rate: { rateUsd: 2000 },
  length: 700,
  origin: { city: 'Houston', stateProv: 'TX', latitude: 29.7604, longitude: -95.3698 },
  destination: { city: 'Atlanta', stateProv: 'GA', latitude: 33.749, longitude: -84.388 },
  equipmentType: 'V',
  deadheadMiles: 40,
});

describe('createLoadBoardService', () => {
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

  describe('ingest', () => {
    it('calls addIfAbsent with correct orgId and source for relay', async () => {
      // Arrange
      mockRedisPort.addIfAbsent.mockResolvedValue(true);
      mockRedisPort.updateMeta.mockResolvedValue(undefined);

      // Act
      await service.ingest({
        organizationId: 'org-1',
        source: 'relay',
        loads: [buildRelayRaw()],
      });

      // Assert
      expect(mockRedisPort.addIfAbsent).toHaveBeenCalledWith(
        'org-1',
        'relay',
        expect.objectContaining({ source: 'relay' }),
      );
    });

    it('calls addIfAbsent with correct orgId and source for dat', async () => {
      // Arrange
      mockRedisPort.addIfAbsent.mockResolvedValue(true);
      mockRedisPort.updateMeta.mockResolvedValue(undefined);

      // Act
      await service.ingest({
        organizationId: 'org-1',
        source: 'dat',
        loads: [buildDatRaw()],
      });

      // Assert
      expect(mockRedisPort.addIfAbsent).toHaveBeenCalledWith(
        'org-1',
        'dat',
        expect.objectContaining({ source: 'dat' }),
      );
    });

    it('returns ingested + skipped + total counts', async () => {
      // Arrange
      mockRedisPort.addIfAbsent.mockResolvedValue(true);
      mockRedisPort.updateMeta.mockResolvedValue(undefined);
      const rawLoads = [buildRelayRaw(), buildRelayRaw()];

      // Act
      const result = await service.ingest({
        organizationId: 'org-1',
        source: 'relay',
        loads: rawLoads,
      });

      // Assert
      expect(result).toEqual({ ingested: 2, skipped: 0, total: 2 });
    });

    it('calls updateMeta with newly-added count after addIfAbsent', async () => {
      // Arrange
      mockRedisPort.addIfAbsent.mockResolvedValue(true);
      mockRedisPort.updateMeta.mockResolvedValue(undefined);

      // Act
      await service.ingest({
        organizationId: 'org-2',
        source: 'relay',
        loads: [buildRelayRaw()],
      });

      // Assert
      expect(mockRedisPort.updateMeta).toHaveBeenCalledWith('org-2', 'relay', 1);
    });
  });

  describe('getFeed', () => {
    it('calls getAllLoads with orgId and undefined source when no source filter', async () => {
      // Arrange
      const loads = [buildStagedLoad()];
      mockRedisPort.getAllLoads.mockResolvedValue(loads);
      mockRedisPort.getMeta.mockResolvedValue(buildFeedMeta());

      // Act
      const result = await service.getFeed({ organizationId: 'org-1' });

      // Assert
      expect(mockRedisPort.getAllLoads).toHaveBeenCalledWith('org-1', undefined);
      expect(result.data).toEqual(loads);
    });

    it('passes source filter to getAllLoads when source is provided', async () => {
      // Arrange
      const loads = [buildStagedLoad()];
      mockRedisPort.getAllLoads.mockResolvedValue(loads);
      mockRedisPort.getMeta.mockResolvedValue(buildFeedMeta());

      // Act
      await service.getFeed({ organizationId: 'org-1', source: 'relay' });

      // Assert
      expect(mockRedisPort.getAllLoads).toHaveBeenCalledWith('org-1', 'relay');
    });

    it('returns empty meta when getMeta returns null', async () => {
      // Arrange
      mockRedisPort.getAllLoads.mockResolvedValue([]);
      mockRedisPort.getMeta.mockResolvedValue(null);

      // Act
      const result = await service.getFeed({ organizationId: 'org-1' });

      // Assert
      expect(result.meta).toEqual({
        total: 0,
        sources: {},
        lastUpdated: {},
      });
    });

    it('returns feed meta from redis when present', async () => {
      // Arrange
      const meta = buildFeedMeta();
      mockRedisPort.getAllLoads.mockResolvedValue([]);
      mockRedisPort.getMeta.mockResolvedValue(meta);

      // Act
      const result = await service.getFeed({ organizationId: 'org-1' });

      // Assert
      expect(result.meta).toEqual(meta);
    });
  });

  describe('getLoadDetail', () => {
    it('returns load when found', async () => {
      // Arrange
      const load = buildStagedLoad();
      mockRedisPort.getLoadById.mockResolvedValue(load);

      // Act
      const result = await service.getLoadDetail({ organizationId: 'org-1', id: 'test-uuid' });

      // Assert
      expect(result).toEqual(load);
      expect(mockRedisPort.getLoadById).toHaveBeenCalledWith('org-1', 'test-uuid');
    });

    it('throws NotFoundError when load is null', async () => {
      // Arrange
      mockRedisPort.getLoadById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getLoadDetail({ organizationId: 'org-1', id: 'missing-id' }),
      ).rejects.toThrow('missing-id not found');
    });
  });

  describe('clearSource', () => {
    it('calls clearSource on redis port with correct args', async () => {
      // Arrange
      mockRedisPort.clearSource.mockResolvedValue(undefined);

      // Act
      await service.clearSource({ organizationId: 'org-1', source: 'relay' });

      // Assert
      expect(mockRedisPort.clearSource).toHaveBeenCalledWith('org-1', 'relay');
    });

    it('logs after clearing source', async () => {
      // Arrange
      mockRedisPort.clearSource.mockResolvedValue(undefined);

      // Act
      await service.clearSource({ organizationId: 'org-1', source: 'dat' });

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Source cleared',
        expect.objectContaining({ organizationId: 'org-1', source: 'dat' }),
      );
    });
  });
});
