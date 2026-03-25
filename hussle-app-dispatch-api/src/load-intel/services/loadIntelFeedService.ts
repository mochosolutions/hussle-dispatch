import type { Logger } from '../../shared/utils/logger';
import { NotFoundError } from '../../shared/errors/commonErrors';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type {
  LoadIntelRedis,
  FeedQueryParams,
} from '../types/loadIntelTypes';
import { SCORE_TIERS } from '../types/loadIntelTypes';
import type { BackhaulGeoPort } from '../types/backhaulTypes';
import { assembleChain } from './chainService';

interface FeedServiceDeps {
  redisPort: LoadIntelRedisPort;
  logger: Logger;
  geoPort?: BackhaulGeoPort;
}

interface FeedResult {
  data: LoadIntelRedis[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

/**
 * Checks whether a load intel record passes the query filters.
 */
const matchesFilters = (record: LoadIntelRedis, params: FeedQueryParams): boolean => {
  if (params.score !== undefined) {
    const best = record.bestScore;

    if (params.score === 'high' && best < SCORE_TIERS.HIGH_MIN) {
      return false;
    }
    if (params.score === 'medium' && (best < SCORE_TIERS.MEDIUM_MIN || best >= SCORE_TIERS.HIGH_MIN)) {
      return false;
    }
    if (params.score === 'low' && best >= SCORE_TIERS.MEDIUM_MIN) {
      return false;
    }
  }

  if (params.hasRate !== undefined) {
    const hasRate = record.payload.rate !== undefined && record.payload.rate > 0;

    if (params.hasRate !== hasRate) {
      return false;
    }
  }

  if (params.equipmentType !== undefined && record.payload.equipmentType !== params.equipmentType) {
    return false;
  }

  if (params.source !== undefined && record.payload.source !== params.source) {
    return false;
  }

  return true;
};

/**
 * Retrieves the load intel feed for an organization.
 * Reads from Redis sorted set, filters dismissed/expired, applies query filters.
 */
export const getFeed = async (
  orgId: string,
  params: FeedQueryParams,
  deps: FeedServiceDeps,
): Promise<FeedResult> => {
  const feedKey = `intel:feed:${orgId}`;
  const dismissedKey = `intel:dismissed:${orgId}`;

  // Fetch a larger window to account for dismissed/expired/filtered items
  const fetchMultiplier = 3;
  const fetchSize = params.limit * fetchMultiplier;
  const startOffset = (params.page - 1) * params.limit;

  // Fetch hashes from the sorted set (descending by score)
  const allHashes = await deps.redisPort.zrevrange(feedKey, 0, startOffset + fetchSize - 1);

  const matched: LoadIntelRedis[] = [];
  let expiredCount = 0;

  for (const hash of allHashes) {
    // Check if dismissed
    const isDismissed = await deps.redisPort.sismember(dismissedKey, hash);

    if (isDismissed) {
      continue;
    }

    // Fetch the full record
    const redisKey = `intel:${orgId}:${hash}`;
    const raw = await deps.redisPort.get(redisKey);

    if (raw === null) {
      // Record expired — clean up from sorted set
      expiredCount += 1;
      await deps.redisPort.zrem(feedKey, hash);
      continue;
    }

    const record = JSON.parse(raw) as LoadIntelRedis;

    if (matchesFilters(record, params)) {
      matched.push(record);
    }
  }

  // Calculate total excluding expired items
  const totalInSet = await deps.redisPort.zcard(feedKey);
  const adjustedTotal = totalInSet - expiredCount;

  // Paginate the matched results
  const pageData = matched.slice(startOffset, startOffset + params.limit);

  // Enrich with chain data when requested (best-effort)
  if (params.includeChains && deps.geoPort) {
    const chainDeps = {
      redisPort: deps.redisPort,
      geoPort: deps.geoPort,
      logger: deps.logger,
    };

    for (const item of pageData) {
      const topScore = item.scores[0];

      if (topScore === undefined) {
        continue;
      }

      try {
        const chains = await assembleChain(
          orgId,
          item.loadHash,
          topScore.vehicleId,
          3,
          chainDeps,
        );

        const firstChain = chains[0];

        if (firstChain !== undefined) {
          item.chains = chains;
          item.chainScore = firstChain.chainScore;
          item.chainCount = chains.length;
        }
      } catch (error: unknown) {
        deps.logger.warn('Chain enrichment failed for load', {
          loadHash: item.loadHash,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  deps.logger.info('Feed retrieved', {
    orgId,
    total: adjustedTotal,
    page: params.page,
    returned: pageData.length,
  });

  return {
    data: pageData,
    meta: {
      total: Math.max(0, adjustedTotal),
      page: params.page,
      limit: params.limit,
    },
  };
};

/**
 * Retrieves a single load intel record by hash.
 */
export const getLoadById = async (
  orgId: string,
  loadHash: string,
  deps: FeedServiceDeps,
): Promise<LoadIntelRedis> => {
  const redisKey = `intel:${orgId}:${loadHash}`;
  const raw = await deps.redisPort.get(redisKey);

  if (raw === null) {
    throw new NotFoundError(`Load intel record ${loadHash} not found`);
  }

  return JSON.parse(raw) as LoadIntelRedis;
};

/**
 * Dismisses a load intel record by adding its hash to the dismissed set.
 */
export const dismissLoad = async (
  orgId: string,
  loadHash: string,
  deps: FeedServiceDeps,
): Promise<void> => {
  const redisKey = `intel:${orgId}:${loadHash}`;
  const exists = await deps.redisPort.exists(redisKey);

  if (!exists) {
    throw new NotFoundError(`Load intel record ${loadHash} not found`);
  }

  const dismissedKey = `intel:dismissed:${orgId}`;
  await deps.redisPort.sadd(dismissedKey, loadHash);

  deps.logger.info('Load intel dismissed', { orgId, loadHash });
};
