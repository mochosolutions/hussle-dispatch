import { createLoadBoardRedisAdapter } from '../adapters/loadBoardRedisAdapter';
import type { StagedLoad } from '../types/loadBoardTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildLoad = (overrides: Partial<StagedLoad> = {}): StagedLoad => ({
  id: overrides.id ?? 'load-1',
  source: overrides.source ?? 'relay',
  sourceId: overrides.sourceId ?? 'src-1',
  payout: overrides.payout ?? 1500,
  ratePerMile: overrides.ratePerMile ?? 2.5,
  totalMiles: overrides.totalMiles ?? 600,
  deadheadMiles: overrides.deadheadMiles ?? 50,
  loadedMiles: overrides.loadedMiles ?? 550,
  equipmentType: overrides.equipmentType ?? 'DRY_VAN',
  equipmentTypeRaw: overrides.equipmentTypeRaw ?? 'Van',
  commodity: overrides.commodity ?? 'Electronics',
  isTeamDriver: overrides.isTeamDriver ?? false,
  workType: overrides.workType ?? null,
  loadType: overrides.loadType ?? null,
  totalDuration: overrides.totalDuration ?? 480,
  firstPickupTime: overrides.firstPickupTime ?? null,
  lastDeliveryTime: overrides.lastDeliveryTime ?? null,
  originCity: overrides.originCity ?? 'Dallas',
  originState: overrides.originState ?? 'TX',
  originLat: overrides.originLat ?? 32.78,
  originLng: overrides.originLng ?? -96.8,
  destCity: overrides.destCity ?? 'Houston',
  destState: overrides.destState ?? 'TX',
  destLat: overrides.destLat ?? 29.76,
  destLng: overrides.destLng ?? -95.37,
  stopCount: overrides.stopCount ?? 1,
  costBreakdown: overrides.costBreakdown ?? null,
  tags: overrides.tags ?? null,
  rawData: overrides.rawData ?? {},
  ingestedAt: overrides.ingestedAt ?? '2026-04-10T00:00:00Z',
});

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

const createMockPipeline = () => {
  const pipelineInstance = {
    set: jest.fn().mockReturnThis(),
    sadd: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  };
  return pipelineInstance;
};

const createMockRedis = () => {
  const mockPipeline = createMockPipeline();

  const redis = {
    smembers: jest.fn().mockResolvedValue([]),
    pipeline: jest.fn().mockReturnValue(mockPipeline),
    get: jest.fn().mockResolvedValue(null),
    mget: jest.fn().mockResolvedValue([]),
    hset: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    expire: jest.fn().mockResolvedValue(1),
  };

  return { redis, mockPipeline };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('loadBoardRedisAdapter', () => {
  describe('snapshotReplace', () => {
    it('calls pipeline with SET, SADD, and EXPIRE for each load', async () => {
      const { redis, mockPipeline } = createMockRedis();
      redis.smembers.mockResolvedValue([]);

      const adapter = createLoadBoardRedisAdapter(redis as never);
      const load = buildLoad({ sourceId: 'src-1' });

      await adapter.snapshotReplace('org-1', 'relay', [load]);

      expect(redis.smembers).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.set).toHaveBeenCalledWith(
        'loadboard:load:org-1:relay:src-1',
        JSON.stringify(load),
        'EX',
        expect.any(Number),
      );
      expect(mockPipeline.sadd).toHaveBeenCalledWith('loadboard:loads:org-1:relay', 'src-1');
      expect(mockPipeline.expire).toHaveBeenCalledWith('loadboard:loads:org-1:relay', 300);
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('clears old data without adding new loads when loads array is empty', async () => {
      const { redis, mockPipeline } = createMockRedis();
      redis.smembers.mockResolvedValue(['old-src-1', 'old-src-2']);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      await adapter.snapshotReplace('org-1', 'relay', []);

      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:load:org-1:relay:old-src-1');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:load:org-1:relay:old-src-2');
      expect(mockPipeline.set).not.toHaveBeenCalled();
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('getAllLoads', () => {
    it('fetches from both relay and dat sets when no source is provided', async () => {
      const { redis } = createMockRedis();
      redis.smembers
        .mockResolvedValueOnce(['src-relay-1'])
        .mockResolvedValueOnce(['src-dat-1']);

      const relayLoad = buildLoad({ source: 'relay', sourceId: 'src-relay-1' });
      const datLoad = buildLoad({ source: 'dat', sourceId: 'src-dat-1' });

      redis.mget.mockResolvedValue([JSON.stringify(relayLoad), JSON.stringify(datLoad)]);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getAllLoads('org-1');

      expect(redis.smembers).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(redis.smembers).toHaveBeenCalledWith('loadboard:loads:org-1:dat');
      expect(result).toHaveLength(2);
    });

    it('fetches only the specified source when source filter is provided', async () => {
      const { redis } = createMockRedis();
      redis.smembers.mockResolvedValue(['src-relay-1']);

      const relayLoad = buildLoad({ source: 'relay', sourceId: 'src-relay-1' });
      redis.mget.mockResolvedValue([JSON.stringify(relayLoad)]);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getAllLoads('org-1', 'relay');

      expect(redis.smembers).toHaveBeenCalledTimes(1);
      expect(redis.smembers).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(result).toHaveLength(1);
      expect(result.at(0)?.source).toBe('relay');
    });

    it('handles expired or null entries gracefully', async () => {
      const { redis } = createMockRedis();
      redis.smembers
        .mockResolvedValueOnce(['src-1', 'src-2'])
        .mockResolvedValueOnce([]);

      const validLoad = buildLoad({ sourceId: 'src-1' });
      redis.mget.mockResolvedValue([JSON.stringify(validLoad), null]);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getAllLoads('org-1');

      expect(result).toHaveLength(1);
      expect(result.at(0)?.sourceId).toBe('src-1');
    });

    it('returns empty array when no loads exist', async () => {
      const { redis } = createMockRedis();
      redis.smembers.mockResolvedValue([]);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getAllLoads('org-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getLoadById', () => {
    it('returns parsed load when found in relay source', async () => {
      const { redis } = createMockRedis();
      const load = buildLoad({ source: 'relay', sourceId: 'src-1' });

      redis.get.mockResolvedValueOnce(JSON.stringify(load));

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getLoadById('org-1', 'src-1');

      expect(result).not.toBeNull();
      expect(result?.sourceId).toBe('src-1');
      expect(redis.get).toHaveBeenCalledWith('loadboard:load:org-1:relay:src-1');
    });

    it('falls through to dat source when relay key is missing', async () => {
      const { redis } = createMockRedis();
      const load = buildLoad({ source: 'dat', sourceId: 'src-dat-1' });

      redis.get
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(load));

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getLoadById('org-1', 'src-dat-1');

      expect(result).not.toBeNull();
      expect(result?.source).toBe('dat');
    });

    it('returns null when not found in any source', async () => {
      const { redis } = createMockRedis();
      redis.get.mockResolvedValue(null);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getLoadById('org-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('clearSource', () => {
    it('deletes set key and all individual load keys', async () => {
      const { redis, mockPipeline } = createMockRedis();
      redis.smembers.mockResolvedValue(['src-1', 'src-2', 'src-3']);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      await adapter.clearSource('org-1', 'relay');

      expect(redis.smembers).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:load:org-1:relay:src-1');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:load:org-1:relay:src-2');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:load:org-1:relay:src-3');
      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.exec).toHaveBeenCalled();
    });

    it('still executes pipeline when no keys exist', async () => {
      const { redis, mockPipeline } = createMockRedis();
      redis.smembers.mockResolvedValue([]);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      await adapter.clearSource('org-1', 'relay');

      expect(mockPipeline.del).toHaveBeenCalledWith('loadboard:loads:org-1:relay');
      expect(mockPipeline.exec).toHaveBeenCalled();
    });
  });

  describe('updateMeta', () => {
    it('sets correct hash fields and TTL', async () => {
      const { redis } = createMockRedis();
      const adapter = createLoadBoardRedisAdapter(redis as never);

      await adapter.updateMeta('org-1', 'relay', 42);

      expect(redis.hset).toHaveBeenCalledWith(
        'loadboard:meta:org-1',
        'lastUpdated:relay',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
        'count:relay',
        '42',
      );
      expect(redis.expire).toHaveBeenCalledWith('loadboard:meta:org-1', 300);
    });
  });

  describe('getMeta', () => {
    it('returns parsed FeedMeta when data exists', async () => {
      const { redis } = createMockRedis();
      redis.hgetall.mockResolvedValue({
        'count:relay': '10',
        'count:dat': '5',
        'lastUpdated:relay': '2026-04-10T12:00:00Z',
        'lastUpdated:dat': '2026-04-10T11:00:00Z',
      });

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getMeta('org-1');

      expect(result).not.toBeNull();
      expect(result?.total).toBe(15);
      expect(result?.sources['relay']).toBe(10);
      expect(result?.sources['dat']).toBe(5);
      expect(result?.lastUpdated['relay']).toBe('2026-04-10T12:00:00Z');
      expect(result?.lastUpdated['dat']).toBe('2026-04-10T11:00:00Z');
    });

    it('returns null when no data exists', async () => {
      const { redis } = createMockRedis();
      redis.hgetall.mockResolvedValue({});

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getMeta('org-1');

      expect(result).toBeNull();
    });

    it('returns null when hgetall returns null', async () => {
      const { redis } = createMockRedis();
      redis.hgetall.mockResolvedValue(null);

      const adapter = createLoadBoardRedisAdapter(redis as never);

      const result = await adapter.getMeta('org-1');

      expect(result).toBeNull();
    });
  });
});
