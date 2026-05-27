import { createCachedRouteCalculator } from '../routeCache';
import type { RouteCalculatorPort } from '../routeCalculatorPort';
import type { RouteResult } from '../types';
import type { Logger } from '@/shared/utils/logger';

const mockRouteResult: RouteResult = {
  totalDistanceKm: 500,
  legs: [
    {
      distanceKm: 500,
      durationSeconds: 18000,
      geometry: [[-77.0, 39.0], [-74.0, 40.0]],
    },
  ],
  stateMiles: [],
};

const createMocks = () => {
  const redis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const inner: RouteCalculatorPort = {
    calculateRoute: jest.fn(),
  };

  const logger: Logger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return { redis, inner, logger };
};

describe('createCachedRouteCalculator', () => {
  beforeEach(() => jest.clearAllMocks());

  const waypoints = [
    { lat: 39.0, lng: -77.0 },
    { lat: 40.0, lng: -74.0 },
  ];

  it('returns cached result on hit without calling inner calculator', async () => {
    const { redis, inner, logger } = createMocks();
    redis.get.mockResolvedValue(JSON.stringify(mockRouteResult));

    const calculator = createCachedRouteCalculator({
      inner,
      redis: redis as never,
      logger,
    });

    const result = await calculator.calculateRoute(waypoints);

    expect(result).toEqual(mockRouteResult);
    expect(inner.calculateRoute).not.toHaveBeenCalled();
    expect(redis.get).toHaveBeenCalledTimes(1);
  });

  it('calls inner calculator and stores result on cache miss', async () => {
    const { redis, inner, logger } = createMocks();
    redis.get.mockResolvedValue(null);
    (inner.calculateRoute as jest.Mock).mockResolvedValue(mockRouteResult);

    const ttlSeconds = 3600;
    const calculator = createCachedRouteCalculator({
      inner,
      redis: redis as never,
      logger,
      ttlSeconds,
    });

    const result = await calculator.calculateRoute(waypoints);

    expect(result).toEqual(mockRouteResult);
    expect(inner.calculateRoute).toHaveBeenCalledWith(waypoints);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^route:/),
      JSON.stringify(mockRouteResult),
      'EX',
      ttlSeconds,
    );
  });

  it('produces consistent cache key with coordinate rounding', async () => {
    const { redis, inner, logger } = createMocks();
    redis.get.mockResolvedValue(JSON.stringify(mockRouteResult));

    const calculator = createCachedRouteCalculator({
      inner,
      redis: redis as never,
      logger,
    });

    const preciseWaypoints = [
      { lat: 39.000001234, lng: -77.000009876 },
      { lat: 40.000001234, lng: -74.000009876 },
    ];

    await calculator.calculateRoute(preciseWaypoints);
    const firstCallKey = (redis.get as jest.Mock).mock.calls[0]?.[0] as string;

    redis.get.mockClear();
    redis.get.mockResolvedValue(JSON.stringify(mockRouteResult));

    await calculator.calculateRoute(preciseWaypoints);
    const secondCallKey = (redis.get as jest.Mock).mock.calls[0]?.[0] as string;

    expect(firstCallKey).toBe(secondCallKey);
    expect(firstCallKey).toMatch(/^route:[a-f0-9]{64}$/);
  });

  it('degrades gracefully when Redis get throws', async () => {
    const { redis, inner, logger } = createMocks();
    redis.get.mockRejectedValue(new Error('Redis connection lost'));
    (inner.calculateRoute as jest.Mock).mockResolvedValue(mockRouteResult);

    const calculator = createCachedRouteCalculator({
      inner,
      redis: redis as never,
      logger,
    });

    const result = await calculator.calculateRoute(waypoints);

    expect(result).toEqual(mockRouteResult);
    expect(inner.calculateRoute).toHaveBeenCalledWith(waypoints);
    expect(logger.warn).toHaveBeenCalledWith(
      'Route cache get failed, falling through to calculator',
      expect.objectContaining({ error: 'Redis connection lost' }),
    );
  });

  it('degrades gracefully when Redis set throws', async () => {
    const { redis, inner, logger } = createMocks();
    redis.get.mockResolvedValue(null);
    redis.set.mockRejectedValue(new Error('Redis write failed'));
    (inner.calculateRoute as jest.Mock).mockResolvedValue(mockRouteResult);

    const calculator = createCachedRouteCalculator({
      inner,
      redis: redis as never,
      logger,
    });

    const result = await calculator.calculateRoute(waypoints);

    expect(result).toEqual(mockRouteResult);
    expect(inner.calculateRoute).toHaveBeenCalledWith(waypoints);
    expect(logger.warn).toHaveBeenCalledWith(
      'Route cache set failed',
      expect.objectContaining({ error: 'Redis write failed' }),
    );
  });
});
