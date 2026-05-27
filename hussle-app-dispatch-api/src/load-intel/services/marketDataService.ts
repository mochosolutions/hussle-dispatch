import type { Logger } from '../../shared/utils/logger';
import { NotFoundError } from '../../shared/errors/commonErrors';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { MarketSnapshot } from '../types/loadIntelTypes';
import { MARKET_RATIO_THRESHOLDS, MARKET_RATIO_POINTS } from '../types/loadIntelTypes';

const MARKET_DATA_TTL_SECONDS = 21600; // 6 hours

interface MarketDataServiceDeps {
  redisPort: LoadIntelRedisPort;
  logger: Logger;
}

/**
 * Calculates market tier and points from a load-to-truck ratio.
 */
export const calculateMarketTier = (
  loadToTruckRatio: number,
): { tier: string; tierPoints: number } => {
  if (loadToTruckRatio >= MARKET_RATIO_THRESHOLDS.HOT) {
    return { tier: 'Hot', tierPoints: MARKET_RATIO_POINTS.HOT };
  }

  if (loadToTruckRatio >= MARKET_RATIO_THRESHOLDS.BALANCED) {
    return { tier: 'Balanced', tierPoints: MARKET_RATIO_POINTS.BALANCED };
  }

  if (loadToTruckRatio >= MARKET_RATIO_THRESHOLDS.SOFT) {
    return { tier: 'Soft', tierPoints: MARKET_RATIO_POINTS.SOFT };
  }

  return { tier: 'Dead', tierPoints: MARKET_RATIO_POINTS.DEAD };
};

/**
 * Stores a market data snapshot in Redis with a 6-hour TTL.
 */
export const storeMarketSnapshot = async (
  input: { state: string; city: string; loadToTruckRatio: number },
  deps: MarketDataServiceDeps,
): Promise<MarketSnapshot> => {
  const { tier, tierPoints } = calculateMarketTier(input.loadToTruckRatio);

  const snapshot: MarketSnapshot = {
    state: input.state.toUpperCase(),
    city: input.city.toLowerCase(),
    loadToTruckRatio: input.loadToTruckRatio,
    tier,
    tierPoints,
    storedAt: new Date().toISOString(),
  };

  const redisKey = `market:${snapshot.state}:${snapshot.city}`;
  await deps.redisPort.setWithTtl(redisKey, JSON.stringify(snapshot), MARKET_DATA_TTL_SECONDS);

  deps.logger.info('Market snapshot stored', {
    state: snapshot.state,
    city: snapshot.city,
    tier,
    loadToTruckRatio: input.loadToTruckRatio,
  });

  return snapshot;
};

/**
 * Retrieves a market data snapshot for a given state and city.
 * Returns the stored snapshot or throws NotFoundError if no data exists.
 */
export const getMarketSnapshot = async (
  state: string,
  city: string,
  deps: MarketDataServiceDeps,
): Promise<MarketSnapshot> => {
  const normalizedState = state.toUpperCase();
  const normalizedCity = city.toLowerCase();
  const redisKey = `market:${normalizedState}:${normalizedCity}`;

  const raw = await deps.redisPort.get(redisKey);

  if (raw === null) {
    throw new NotFoundError(`No market data for ${normalizedState}:${normalizedCity}`);
  }

  return JSON.parse(raw) as MarketSnapshot;
};
