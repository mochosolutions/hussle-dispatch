import { createHash } from 'crypto';
import type { Logger } from '../../shared/utils/logger';
import { calculateCompositeScore } from '../../shared/scoring/calculateCompositeScore';
import { calculateDriverFit } from '../../shared/scoring/calculateDriverFit';
import { calculateMinBookRate } from '../../shared/scoring/calculateMinBookRate';
import { ValidationError } from '../../shared/errors/commonErrors';
import { loadIntelPayloadSchema } from '../validators/loadIntelValidator';
import type { LoadIntelRedisPort, FleetQueryPort, MarketDataPort } from '../types/loadIntelPorts';
import type {
  LoadIntelPayload,
  LoadIntelRedis,
  TruckScore,
  IngestResult,
  IngestBatchResult,
  FleetUnit,
} from '../types/loadIntelTypes';

const INTEL_TTL_SECONDS = 86400; // 24 hours

interface LoadIntelServiceDeps {
  redisPort: LoadIntelRedisPort;
  fleetQuery: FleetQueryPort;
  marketData: MarketDataPort;
  logger: Logger;
}

/**
 * Generates a deterministic hash for dedup.
 * SHA256 of source + origin + dest + pickupDate + broker MC + rate, truncated to 12 chars.
 */
const generateLoadHash = (payload: LoadIntelPayload): string => {
  const parts = [
    payload.source,
    `${payload.origin.city}:${payload.origin.state}`,
    `${payload.dest.city}:${payload.dest.state}`,
    payload.pickupDate,
    payload.broker?.mc ?? '',
    String(payload.rate ?? ''),
  ];

  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 12);
};

/**
 * Scores a single fleet unit against a load intel payload.
 */
const scoreFleetUnit = async (
  unit: FleetUnit,
  payload: LoadIntelPayload,
  deps: {
    marketData: MarketDataPort;
  },
): Promise<TruckScore> => {
  const destMarketTier = await deps.marketData.getMarketTier(
    payload.dest.state,
    payload.dest.city,
  );

  const milesFromHome = await deps.marketData.getDistanceMiles(
    {
      state: unit.homeBaseState || unit.currentState,
      city: unit.homeBaseCity || unit.currentCity,
    },
    payload.dest,
  );

  const driverFitResult = calculateDriverFit({
    preferredLanes: unit.preferredLanes,
    noGoZones: unit.noGoZones,
    homeBase: `${unit.homeBaseState}:${unit.homeBaseCity}`,
    destination: `${payload.dest.state}:${payload.dest.city}`,
    maxDaysOut: unit.maxDaysOut,
    currentDaysOut: unit.currentDaysOut,
    milesFromHome,
  });

  const hasRate = payload.rate !== undefined && payload.rate > 0;
  const loadedMiles = payload.loadedMiles ?? 0;
  const rate = payload.rate ?? 0;
  const ratePerMile = hasRate && loadedMiles > 0 ? rate / loadedMiles : 0;

  const mode: 'full' | 'route' = hasRate ? 'full' : 'route';

  const compositeResult = hasRate
    ? calculateCompositeScore({
        mode: 'full',
        vehicleCpm: unit.vehicleCpm,
        ratePerMile,
        marketTier: destMarketTier,
        driverFitPoints: driverFitResult.points,
      })
    : calculateCompositeScore({
        mode: 'route',
        marketTier: destMarketTier,
        driverFitPoints: driverFitResult.points,
      });

  const minBookRate = hasRate && loadedMiles > 0
    ? calculateMinBookRate({
        vehicleCpm: unit.vehicleCpm,
        totalMiles: loadedMiles,
        feePercent: unit.dispatchFeePercent,
        profitMargin: unit.profitMargin,
      })
    : 0;

  return {
    vehicleId: unit.vehicleId,
    unitNumber: unit.unitNumber,
    driverName: unit.driverName,
    compositeScore: compositeResult.compositeScore,
    cpmScore: compositeResult.cpmPoints,
    marketScore: compositeResult.marketPoints,
    driverFitScore: compositeResult.driverFitPoints,
    minBookRate,
    mode,
  };
};

/**
 * Validates a LoadIntelPayload against the Yup schema.
 * Throws ValidationError with details on failure.
 */
const validatePayload = async (payload: unknown): Promise<LoadIntelPayload> => {
  try {
    const validated = await loadIntelPayloadSchema.validate(payload, {
      abortEarly: false,
      stripUnknown: true,
    });
    return validated as LoadIntelPayload;
  } catch (error: unknown) {
    if (isYupValidationError(error)) {
      throw new ValidationError('Invalid load intel payload', error.errors);
    }
    throw error;
  }
};

const isYupValidationError = (
  error: unknown,
): error is { errors: string[]; name: string } =>
  typeof error === 'object' &&
  error !== null &&
  'name' in error &&
  (error as { name: string }).name === 'ValidationError' &&
  'errors' in error &&
  Array.isArray((error as { errors: unknown }).errors);

/**
 * Ingests a single load intel payload.
 * Validates, deduplicates via Redis, scores against all active fleet units,
 * and stores the result with a 24h TTL.
 */
export const ingest = async (
  orgId: string,
  rawPayload: unknown,
  deps: LoadIntelServiceDeps,
): Promise<IngestResult> => {
  const payload = await validatePayload(rawPayload);
  const loadHash = generateLoadHash(payload);
  const redisKey = `intel:${orgId}:${loadHash}`;

  // Dedup check
  const alreadyExists = await deps.redisPort.exists(redisKey);

  if (alreadyExists) {
    deps.logger.info('Load intel duplicate skipped', { orgId, loadHash });
    return { loadHash, scores: [], isNew: false };
  }

  // Get active fleet units for scoring
  const fleetUnits = await deps.fleetQuery.getActiveFleetUnits(orgId);

  // Score each fleet unit
  const scores: TruckScore[] = [];

  for (const unit of fleetUnits) {
    const score = await scoreFleetUnit(unit, payload, {
      marketData: deps.marketData,
    });
    scores.push(score);
  }

  // Sort by composite score descending
  scores.sort((a, b) => b.compositeScore - a.compositeScore);

  const bestScore = scores.length > 0 ? (scores[0]?.compositeScore ?? 0) : 0;

  // Build Redis record
  const record: LoadIntelRedis = {
    payload,
    loadHash,
    orgId,
    scores,
    bestScore,
    createdAt: new Date().toISOString(),
    ttlSeconds: INTEL_TTL_SECONDS,
  };

  // Store in Redis with TTL
  await deps.redisPort.setWithTtl(redisKey, JSON.stringify(record), INTEL_TTL_SECONDS);

  // Add to sorted set feed (score = bestScore for ranking)
  const feedKey = `intel:feed:${orgId}`;
  await deps.redisPort.zadd(feedKey, bestScore, loadHash);

  deps.logger.info('Load intel ingested', {
    orgId,
    loadHash,
    truckCount: scores.length,
    bestScore,
  });

  return { loadHash, scores, isNew: true };
};

/**
 * Ingests a batch of load intel payloads.
 * Processes each payload independently; failures don't block others.
 */
export const ingestBatch = async (
  orgId: string,
  payloads: unknown[],
  deps: LoadIntelServiceDeps,
): Promise<IngestBatchResult> => {
  let ingested = 0;
  let duplicates = 0;
  let invalid = 0;
  const results: IngestResult[] = [];

  for (const payload of payloads) {
    try {
      const result = await ingest(orgId, payload, deps);

      if (result.isNew) {
        ingested += 1;
      } else {
        duplicates += 1;
      }

      results.push(result);
    } catch (error: unknown) {
      invalid += 1;

      if (error instanceof ValidationError) {
        deps.logger.warn('Load intel validation failed in batch', {
          orgId,
          error: error.message,
        });
      } else {
        deps.logger.error('Load intel ingestion failed in batch', {
          orgId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  deps.logger.info('Load intel batch complete', {
    orgId,
    total: payloads.length,
    ingested,
    duplicates,
    invalid,
  });

  return {
    total: payloads.length,
    ingested,
    duplicates,
    invalid,
    results,
  };
};
