import type Redis from 'ioredis';
import type { LoadBoardRedisPort } from '../types/loadBoardPorts';
import type { FeedMeta, LoadSource, StagedLoad } from '../types/loadBoardTypes';

const DEFAULT_TTL = 300; // 5 minutes

const SOURCES: LoadSource[] = ['relay', 'dat'];

const setKey = (orgId: string, source: LoadSource): string =>
  `loadboard:loads:${orgId}:${source}`;

const loadKey = (orgId: string, source: LoadSource, sourceId: string): string =>
  `loadboard:load:${orgId}:${source}:${sourceId}`;

const metaKey = (orgId: string): string => `loadboard:meta:${orgId}`;

const calculateLoadTtl = (firstPickupTime: string | null): number => {
  const MIN_TTL = 300; // 5 minutes
  if (!firstPickupTime) return MIN_TTL;
  const pickupMs = new Date(firstPickupTime).getTime();
  const nowMs = Date.now();
  const ttlSeconds = Math.floor((pickupMs - nowMs) / 1000);
  return Math.max(ttlSeconds, MIN_TTL);
};

const parseLoad = (raw: string | null): StagedLoad | null => {
  if (raw === null || raw === undefined) return null;
  if (!raw || raw === 'null') return null;
  try {
    return JSON.parse(raw) as StagedLoad;
  } catch {
    return null;
  }
};

export const createLoadBoardRedisAdapter = (redis: Redis): LoadBoardRedisPort => ({
  snapshotReplace: async (
    orgId: string,
    source: LoadSource,
    loads: StagedLoad[],
  ): Promise<void> => {
    const sKey = setKey(orgId, source);

    // Get existing source IDs so we can delete stale load keys
    const oldSourceIds = await redis.smembers(sKey);

    const pipeline = redis.pipeline();

    // Delete the old set key
    pipeline.del(sKey);

    // Delete all old individual load keys
    oldSourceIds.forEach((srcId) => {
      pipeline.del(loadKey(orgId, source, srcId));
    });

    // Write new loads using plain SET with JSON.stringify
    loads.forEach((load) => {
      const lKey = loadKey(orgId, source, load.sourceId);
      const ttl = calculateLoadTtl(load.firstPickupTime);
      pipeline.set(lKey, JSON.stringify(load), 'EX', ttl);
      pipeline.sadd(sKey, load.sourceId);
    });

    // Set TTL on the set key itself
    pipeline.expire(sKey, DEFAULT_TTL);

    await pipeline.exec();
  },

  addIfAbsent: async (
    orgId: string,
    source: LoadSource,
    load: StagedLoad,
  ): Promise<boolean> => {
    const lKey = loadKey(orgId, source, load.sourceId);
    const ttl = calculateLoadTtl(load.firstPickupTime);

    // SET NX EX — only sets if the key does not already exist. Returns null
    // when the key existed; returns 'OK' when newly written.
    const result = await redis.set(lKey, JSON.stringify(load), 'EX', ttl, 'NX');

    if (result === null) {
      return false;
    }

    await redis.sadd(setKey(orgId, source), load.sourceId);
    await redis.expire(setKey(orgId, source), DEFAULT_TTL);
    return true;
  },

  getAllLoads: async (orgId: string, source?: LoadSource): Promise<StagedLoad[]> => {
    const sourcesToQuery = source !== undefined ? [source] : SOURCES;

    // Gather all sourceIds from each source's set
    const memberArrays = await Promise.all(
      sourcesToQuery.map((src) => redis.smembers(setKey(orgId, src))),
    );

    // Build load keys
    const loadKeys: string[] = [];
    sourcesToQuery.forEach((src, i) => {
      const members = memberArrays[i] ?? [];
      members.forEach((srcId) => {
        loadKeys.push(loadKey(orgId, src, srcId));
      });
    });

    if (loadKeys.length === 0) return [];

    // Fetch all load docs in a single MGET
    const results = await redis.mget(...loadKeys);

    const loads: StagedLoad[] = [];
    results.forEach((raw) => {
      const load = parseLoad(raw);
      if (load !== null) {
        loads.push(load);
      }
    });

    return loads;
  },

  getLoadById: async (orgId: string, id: string): Promise<StagedLoad | null> => {
    for (const source of SOURCES) {
      const lKey = loadKey(orgId, source, id);
      const raw = await redis.get(lKey);
      const load = parseLoad(raw);
      if (load !== null) return load;
    }

    return null;
  },

  clearSource: async (orgId: string, source: LoadSource): Promise<void> => {
    const sKey = setKey(orgId, source);
    const sourceIds = await redis.smembers(sKey);

    const pipeline = redis.pipeline();
    sourceIds.forEach((srcId) => {
      pipeline.del(loadKey(orgId, source, srcId));
    });
    pipeline.del(sKey);

    await pipeline.exec();
  },

  getMeta: async (orgId: string): Promise<FeedMeta | null> => {
    const mKey = metaKey(orgId);
    const hash = await redis.hgetall(mKey);

    if (!hash || Object.keys(hash).length === 0) return null;

    const sources: Record<string, number> = {};
    const lastUpdated: Record<string, string> = {};
    let total = 0;

    Object.entries(hash).forEach(([field, value]) => {
      if (field.startsWith('count:')) {
        const src = field.slice('count:'.length);
        const count = parseInt(value, 10);
        sources[src] = count;
        total += count;
      } else if (field.startsWith('lastUpdated:')) {
        const src = field.slice('lastUpdated:'.length);
        lastUpdated[src] = value;
      }
    });

    return { total, sources, lastUpdated };
  },

  updateMeta: async (orgId: string, source: LoadSource, count: number): Promise<void> => {
    const mKey = metaKey(orgId);
    await redis.hset(
      mKey,
      `lastUpdated:${source}`,
      new Date().toISOString(),
      `count:${source}`,
      String(count),
    );
    await redis.expire(mKey, DEFAULT_TTL);
  },
});

// Re-export helper for testing
export { parseLoad };
