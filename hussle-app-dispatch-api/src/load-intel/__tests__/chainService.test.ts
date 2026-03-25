import { assembleChain } from '../services/chainService';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { BackhaulGeoPort } from '../types/backhaulTypes';
import type { LoadIntelRedis } from '../types/loadIntelTypes';
import type { Logger } from '../../shared/utils/logger';

/**
 * Helper to build a LoadIntelRedis record with sensible defaults.
 */
const buildLoadIntelRecord = (
  overrides: Partial<{
    loadHash: string;
    orgId: string;
    bestScore: number;
    originCity: string;
    originState: string;
    destCity: string;
    destState: string;
    rate: number | undefined;
    loadedMiles: number | undefined;
    pickupDate: string;
  }> = {},
): LoadIntelRedis => ({
  loadHash: overrides.loadHash ?? 'hash-default',
  orgId: overrides.orgId ?? 'org-1',
  bestScore: overrides.bestScore ?? 75,
  createdAt: '2026-03-20T10:00:00Z',
  ttlSeconds: 86400,
  scores: [],
  payload: {
    source: 'DAT',
    origin: {
      city: overrides.originCity ?? 'Dallas',
      state: overrides.originState ?? 'TX',
    },
    dest: {
      city: overrides.destCity ?? 'Houston',
      state: overrides.destState ?? 'TX',
    },
    pickupDate: overrides.pickupDate ?? '2026-03-21',
    equipmentType: 'DRY_VAN',
    rate: overrides.rate,
    loadedMiles: overrides.loadedMiles,
  },
});

/**
 * Creates mock dependencies for chainService tests.
 */
const createMockDeps = () => {
  const redisPort: jest.Mocked<LoadIntelRedisPort> = {
    exists: jest.fn().mockResolvedValue(false),
    setWithTtl: jest.fn().mockResolvedValue(undefined),
    zadd: jest.fn().mockResolvedValue(undefined),
    zrevrange: jest.fn().mockResolvedValue([]),
    zcard: jest.fn().mockResolvedValue(0),
    get: jest.fn().mockResolvedValue(null),
    sismember: jest.fn().mockResolvedValue(false),
    sadd: jest.fn().mockResolvedValue(undefined),
    zrem: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  const geoPort: jest.Mocked<BackhaulGeoPort> = {
    getCityCoords: jest.fn().mockResolvedValue({ lat: 32.78, lng: -96.8 }),
    getDistanceMiles: jest.fn().mockResolvedValue(200),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { redisPort, geoPort, logger };
};

describe('assembleChain', () => {
  const ORG_ID = 'org-1';
  const OUTBOUND_HASH = 'outbound-hash';
  const VEHICLE_ID = 'vehicle-1';
  const LIMIT = 10;

  /**
   * Sets up redis mock so that:
   * - Cache miss for chain key
   * - Outbound load found at intel key
   * - Feed returns backhaul hashes
   * - Each backhaul hash resolves to its LoadIntelRedis record
   */
  const setupRedisForChain = (
    deps: ReturnType<typeof createMockDeps>,
    outbound: LoadIntelRedis,
    backhauls: LoadIntelRedis[],
  ) => {
    const backhaulHashes = backhauls.map((b) => b.loadHash);

    deps.redisPort.get.mockImplementation(async (key: string) => {
      // Chain cache miss
      if (key.startsWith('intel:chain:')) {
        return null;
      }
      // Outbound load
      if (key === `intel:${ORG_ID}:${OUTBOUND_HASH}`) {
        return JSON.stringify(outbound);
      }
      // Backhaul loads
      for (const bh of backhauls) {
        if (key === `intel:${ORG_ID}:${bh.loadHash}`) {
          return JSON.stringify(bh);
        }
      }
      return null;
    });

    // Feed returns backhaul hashes for backhaul search
    deps.redisPort.zrevrange.mockResolvedValue(backhaulHashes);
    deps.redisPort.sismember.mockResolvedValue(false);
  };

  it('returns empty chains when no backhaul results found', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      rate: 2500,
      loadedMiles: 400,
      bestScore: 80,
    });

    deps.redisPort.get.mockImplementation(async (key: string) => {
      if (key.startsWith('intel:chain:')) return null;
      if (key === `intel:${ORG_ID}:${OUTBOUND_HASH}`) return JSON.stringify(outbound);
      return null;
    });
    deps.redisPort.zrevrange.mockResolvedValue([]);
    // geoPort.getCityCoords returns coords so backhaul search runs (but finds nothing)

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    expect(result).toEqual([]);
  });

  it('builds a 2-step chain when distance < 500mi', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      originCity: 'Dallas',
      originState: 'TX',
      destCity: 'Houston',
      destState: 'TX',
      rate: 2500,
      loadedMiles: 250,
      bestScore: 80,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      originCity: 'Houston',
      originState: 'TX',
      destCity: 'Dallas',
      destState: 'TX',
      rate: 2200,
      loadedMiles: 250,
      bestScore: 70,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul]);
    // Distance < 500 miles -> 2-step chain
    deps.geoPort.getDistanceMiles.mockResolvedValue(250);

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    expect(result).toHaveLength(1);
    const chain = result[0];
    if (chain === undefined) {
      throw new Error('Expected chain at index 0');
    }
    expect(chain.steps).toHaveLength(2);
    expect(chain.totalMiles).toBe(500);
    expect(chain.totalRate).toBe(4700);
  });

  // Will pass after T-12 wires calculateChainScore
  // Currently skipped because the current implementation uses a simple average
  // (Math.round((80 + 70) / 2) = 75) instead of calculateChainScore which
  // produces a structured result with sub-scores that would yield a different number.
  it('produces chainScoreResult fields from calculateChainScore for 2-step chain', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      originCity: 'Dallas',
      originState: 'TX',
      destCity: 'Houston',
      destState: 'TX',
      rate: 3000,
      loadedMiles: 250,
      bestScore: 80,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      originCity: 'Houston',
      originState: 'TX',
      destCity: 'Dallas',
      destState: 'TX',
      rate: 2500,
      loadedMiles: 250,
      bestScore: 70,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul]);
    deps.geoPort.getDistanceMiles.mockResolvedValue(250);

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert — after T-12, chainScore should come from calculateChainScore,
    // meaning the chain object should carry structured sub-score fields
    const chain = result[0];
    if (chain === undefined) {
      throw new Error('Expected chain at index 0');
    }
    // The chain should have a chainScoreResult with sub-score breakdowns
    expect(chain).toHaveProperty('chainScoreResult');
    // Cast through unknown to access the new field that T-12 will add
    const chainRecord = chain as unknown as Record<string, unknown>;
    const scoreResult = chainRecord['chainScoreResult'] as Record<string, unknown>;
    expect(scoreResult).toHaveProperty('chainProfitabilityPoints');
    expect(scoreResult).toHaveProperty('returnPositioningPoints');
    expect(scoreResult).toHaveProperty('timeEfficiencyPoints');
    expect(typeof scoreResult['chainProfitabilityPoints']).toBe('number');
    expect(typeof scoreResult['returnPositioningPoints']).toBe('number');
    expect(typeof scoreResult['timeEfficiencyPoints']).toBe('number');
  });

  // Will pass after T-12 wires calculateChainScore
  // This test verifies the chain score differs from the simple average.
  // With outbound bestScore=80, backhaul bestScore=70, the simple average is 75.
  // calculateChainScore with these rates/miles would produce a different value
  // based on profitability margin, positioning, and time efficiency.
  it('produces a chain score that differs from simple average of bestScores', async () => {
    // Arrange
    const deps = createMockDeps();

    // Set up loads where calculateChainScore would produce a score != simple average.
    // outbound rate=1200, miles=400; backhaul rate=800, miles=350
    // Simple average of bestScores: Math.round((85 + 65) / 2) = 75
    // calculateChainScore with these values will produce a different number
    // because it considers profitability margin, positioning, and DRU.
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      originCity: 'Dallas',
      originState: 'TX',
      destCity: 'Atlanta',
      destState: 'GA',
      rate: 1200,
      loadedMiles: 400,
      bestScore: 85,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      originCity: 'Atlanta',
      originState: 'GA',
      destCity: 'Dallas',
      destState: 'TX',
      rate: 800,
      loadedMiles: 350,
      bestScore: 65,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul]);
    deps.geoPort.getDistanceMiles.mockResolvedValue(200);

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    const chain = result[0];
    if (chain === undefined) {
      throw new Error('Expected chain at index 0');
    }
    // The simple average would be Math.round((85 + 65) / 2) = 75
    // calculateChainScore should produce a DIFFERENT value
    const simpleAverage = Math.round((85 + 65) / 2);
    expect(chain.chainScore).not.toBe(simpleAverage);
  });

  // Will pass after T-12 wires calculateChainScore
  // 3-step chain: distance >= 500mi triggers intermediate search.
  it('builds a 3-step chain using calculateChainScore when distance >= 500mi', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      originCity: 'Dallas',
      originState: 'TX',
      destCity: 'Los Angeles',
      destState: 'CA',
      rate: 4000,
      loadedMiles: 1400,
      bestScore: 90,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      originCity: 'Los Angeles',
      originState: 'CA',
      destCity: 'Phoenix',
      destState: 'AZ',
      rate: 1500,
      loadedMiles: 370,
      bestScore: 60,
      pickupDate: '2026-03-22',
    });

    const intermediate = buildLoadIntelRecord({
      loadHash: 'intermediate-hash-1',
      originCity: 'Phoenix',
      originState: 'AZ',
      destCity: 'Dallas',
      destState: 'TX',
      rate: 2000,
      loadedMiles: 1065,
      bestScore: 72,
      pickupDate: '2026-03-23',
    });

    // First call to zrevrange returns backhaul hashes, second returns intermediate hashes
    let zrevrangeCallCount = 0;
    deps.redisPort.zrevrange.mockImplementation(async () => {
      zrevrangeCallCount += 1;
      if (zrevrangeCallCount === 1) {
        return [backhaul.loadHash];
      }
      // Second call is for intermediate search
      return [intermediate.loadHash];
    });

    deps.redisPort.get.mockImplementation(async (key: string) => {
      if (key.startsWith('intel:chain:')) return null;
      if (key === `intel:${ORG_ID}:${OUTBOUND_HASH}`) return JSON.stringify(outbound);
      if (key === `intel:${ORG_ID}:${backhaul.loadHash}`) return JSON.stringify(backhaul);
      if (key === `intel:${ORG_ID}:${intermediate.loadHash}`) return JSON.stringify(intermediate);
      return null;
    });

    deps.redisPort.sismember.mockResolvedValue(false);

    // First getDistanceMiles call: outbound dest -> backhaul dest = 600mi (>= 500 threshold)
    deps.geoPort.getDistanceMiles.mockResolvedValue(600);
    // getCityCoords always returns valid coords
    deps.geoPort.getCityCoords.mockResolvedValue({ lat: 33.45, lng: -112.07 });

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    expect(result).toHaveLength(1);
    const chain = result[0];
    if (chain === undefined) {
      throw new Error('Expected chain at index 0');
    }
    expect(chain.steps).toHaveLength(3);
    expect(chain.totalMiles).toBe(1400 + 370 + 1065);
    expect(chain.totalRate).toBe(4000 + 1500 + 2000);

    // The simple average would be Math.round((90 + 60 + 72) / 3) = 74
    // calculateChainScore should produce a different value
    const simpleAverage = Math.round((90 + 60 + 72) / 3);
    expect(chain.chainScore).not.toBe(simpleAverage);
  });

  // Will pass after T-12 wires calculateChainScore
  // When loads have no rate data, calculateChainScore should handle gracefully.
  it('handles chain with no rate data gracefully', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      rate: undefined,
      loadedMiles: 300,
      bestScore: 50,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      rate: undefined,
      loadedMiles: 280,
      bestScore: 45,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul]);
    deps.geoPort.getDistanceMiles.mockResolvedValue(200);

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    const chain = result[0];
    if (chain === undefined) {
      throw new Error('Expected chain at index 0');
    }
    expect(chain.totalRate).toBe(0);
    // With zero revenue, calculateChainScore should produce 0 for profitability
    // and the overall chainScore should reflect zero-rate logic (likely 0 or very low)
    // The simple average would be Math.round((50 + 45) / 2) = 48
    // calculateChainScore with zero rates should produce a different (lower) value
    const simpleAverage = Math.round((50 + 45) / 2);
    expect(chain.chainScore).not.toBe(simpleAverage);
    // With zero revenue, profitability and time efficiency are 0.
    // However, return positioning still scores based on distance from home,
    // so the total score reflects positioning points only (up to 35).
    expect(chain.chainScore).toBeLessThan(simpleAverage);
  });

  it('caches assembled chains in redis with 24h TTL', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      rate: 2500,
      loadedMiles: 300,
      bestScore: 80,
    });

    const backhaul = buildLoadIntelRecord({
      loadHash: 'backhaul-hash-1',
      rate: 2000,
      loadedMiles: 280,
      bestScore: 70,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul]);
    deps.geoPort.getDistanceMiles.mockResolvedValue(200);

    // Act
    await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    expect(deps.redisPort.setWithTtl).toHaveBeenCalledWith(
      `intel:chain:${ORG_ID}:${OUTBOUND_HASH}`,
      expect.any(String),
      86400,
    );
  });

  it('returns cached chains when cache hit', async () => {
    // Arrange
    const deps = createMockDeps();
    const cachedChains = [
      {
        steps: [
          {
            loadHash: 'out-1',
            origin: { city: 'Dallas', state: 'TX' },
            dest: { city: 'Houston', state: 'TX' },
            rate: 2500,
            loadedMiles: 250,
            compositeScore: 80,
          },
          {
            loadHash: 'back-1',
            origin: { city: 'Houston', state: 'TX' },
            dest: { city: 'Dallas', state: 'TX' },
            rate: 2200,
            loadedMiles: 250,
            compositeScore: 70,
          },
        ],
        totalMiles: 500,
        totalRate: 4700,
        chainScore: 75,
      },
    ];

    deps.redisPort.get.mockImplementation(async (key: string) => {
      if (key === `intel:chain:${ORG_ID}:${OUTBOUND_HASH}`) {
        return JSON.stringify(cachedChains);
      }
      return null;
    });

    // Act
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, LIMIT, deps);

    // Assert
    expect(result).toEqual(cachedChains);
    // Should not have tried to fetch the outbound load
    expect(deps.redisPort.zrevrange).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when outbound load is missing', async () => {
    // Arrange
    const deps = createMockDeps();
    deps.redisPort.get.mockResolvedValue(null);

    // Act & Assert
    await expect(
      assembleChain(ORG_ID, 'nonexistent-hash', VEHICLE_ID, LIMIT, deps),
    ).rejects.toThrow('not found or expired');
  });

  it('respects the limit parameter', async () => {
    // Arrange
    const deps = createMockDeps();
    const outbound = buildLoadIntelRecord({
      loadHash: OUTBOUND_HASH,
      rate: 2500,
      loadedMiles: 300,
      bestScore: 80,
    });

    const backhaul1 = buildLoadIntelRecord({
      loadHash: 'backhaul-1',
      rate: 2000,
      loadedMiles: 280,
      bestScore: 70,
      pickupDate: '2026-03-22',
    });

    const backhaul2 = buildLoadIntelRecord({
      loadHash: 'backhaul-2',
      rate: 1800,
      loadedMiles: 260,
      bestScore: 65,
      pickupDate: '2026-03-22',
    });

    setupRedisForChain(deps, outbound, [backhaul1, backhaul2]);
    deps.geoPort.getDistanceMiles.mockResolvedValue(200);

    // Act — limit to 1
    const result = await assembleChain(ORG_ID, OUTBOUND_HASH, VEHICLE_ID, 1, deps);

    // Assert
    expect(result).toHaveLength(1);
  });
});
