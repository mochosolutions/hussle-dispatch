import type { Logger } from '../../shared/utils/logger';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { LoadIntelRedis } from '../types/loadIntelTypes';
import type {
  BackhaulGeoPort,
  BackhaulSearchInput,
  ChainStep,
  LoadChain,
} from '../types/backhaulTypes';
import type { ChainScoreInput } from '../../shared/scoring/calculateChainScore';
import { NotFoundError } from '../../shared/errors/commonErrors';
import { calculateChainScore } from '../../shared/scoring/calculateChainScore';
import { searchBackhaul } from './backhaulService';

const CHAIN_TTL_SECONDS = 86400; // 24 hours
const CHAIN_DEPTH_THRESHOLD_MILES = 500;

interface ChainServiceDeps {
  redisPort: LoadIntelRedisPort;
  geoPort: BackhaulGeoPort;
  logger: Logger;
  vehicleCpmPerDay?: number;
  homeBase?: string;
  preferredLanes?: string[];
}

/**
 * Converts a LoadIntelRedis record to a ChainStep.
 */
const toChainStep = (record: LoadIntelRedis): ChainStep => ({
  loadHash: record.loadHash,
  origin: record.payload.origin,
  dest: record.payload.dest,
  rate: record.payload.rate,
  loadedMiles: record.payload.loadedMiles,
  compositeScore: record.bestScore,
});

/**
 * Assembles chain options for a given outbound load.
 * Lazy evaluation: chains are computed on demand, not at ingestion time.
 *
 * - If distance from outbound destination to home < 500mi: 2-step chain (out + back)
 * - If >= 500mi: 3-step chain (out + intermediate + back)
 */
export const assembleChain = async (
  orgId: string,
  loadHash: string,
  vehicleId: string,
  limit: number,
  deps: ChainServiceDeps,
): Promise<LoadChain[]> => {
  // Check cache first
  const cacheKey = `intel:chain:${orgId}:${loadHash}`;
  const cached = await deps.redisPort.get(cacheKey);

  if (cached !== null) {
    const parsed = JSON.parse(cached) as LoadChain[];
    return parsed.slice(0, limit);
  }

  // Get outbound load
  const outboundKey = `intel:${orgId}:${loadHash}`;
  const outboundRaw = await deps.redisPort.get(outboundKey);

  if (outboundRaw === null) {
    throw new NotFoundError(`Load intel record ${loadHash} not found or expired`);
  }

  const outbound = JSON.parse(outboundRaw) as LoadIntelRedis;
  const outboundStep = toChainStep(outbound);

  // Determine distance from outbound destination to home base
  const destCity = outbound.payload.dest.city;
  const destState = outbound.payload.dest.state;

  // Search for backhaul from outbound destination
  const backhaulInput: BackhaulSearchInput = {
    fromCity: destCity,
    fromState: destState,
    radius: 50,
    earliestPickup: outbound.payload.pickupDate,
  };

  const backhaulResults = await searchBackhaul(orgId, backhaulInput, deps);

  // Estimate distance from dest to home (approx — if we have vehicle info)
  // Use first backhaul's destination as proxy for "heading home" direction
  const chains: LoadChain[] = [];

  for (const backhaul of backhaulResults.data) {
    const backhaulStep = toChainStep(backhaul);

    const distFromHome = await deps.geoPort.getDistanceMiles(
      outbound.payload.dest,
      backhaul.payload.dest,
    );

    if (distFromHome < CHAIN_DEPTH_THRESHOLD_MILES) {
      // 2-step chain: outbound + backhaul
      const totalMiles = (outbound.payload.loadedMiles ?? 0) + (backhaul.payload.loadedMiles ?? 0);
      const totalRate = (outbound.payload.rate ?? 0) + (backhaul.payload.rate ?? 0);
      const scoreInput: ChainScoreInput = {
        outboundRate: outbound.payload.rate ?? 0,
        outboundMiles: outbound.payload.loadedMiles ?? 0,
        returnRate: backhaul.payload.rate ?? 0,
        returnMiles: backhaul.payload.loadedMiles ?? 0,
        totalTripDays: 2,
        milesFromHomeAfterReturn: distFromHome,
        homeBase: deps.homeBase ?? '',
        returnDropState: backhaul.payload.dest.state,
        preferredLanes: deps.preferredLanes ?? [],
        vehicleCpmPerDay: deps.vehicleCpmPerDay ?? 0,
      };
      const chainScoreResult = calculateChainScore(scoreInput);

      chains.push({
        steps: [outboundStep, backhaulStep],
        totalMiles,
        totalRate,
        chainScore: chainScoreResult.chainScore,
        chainScoreResult,
      });
    } else {
      // 3-step chain: outbound + intermediate + backhaul
      // Search for intermediate load from backhaul destination toward home
      const intermediateInput: BackhaulSearchInput = {
        fromCity: backhaul.payload.dest.city,
        fromState: backhaul.payload.dest.state,
        radius: 75,
        earliestPickup: backhaul.payload.pickupDate,
      };

      const intermediateResults = await searchBackhaul(orgId, intermediateInput, deps);
      const intermediate = intermediateResults.data[0];

      if (intermediate !== undefined) {
        const intermediateStep = toChainStep(intermediate);
        const totalMiles =
          (outbound.payload.loadedMiles ?? 0) +
          (backhaul.payload.loadedMiles ?? 0) +
          (intermediate.payload.loadedMiles ?? 0);
        const totalRate =
          (outbound.payload.rate ?? 0) +
          (backhaul.payload.rate ?? 0) +
          (intermediate.payload.rate ?? 0);
        const threeStepScoreInput: ChainScoreInput = {
          outboundRate: outbound.payload.rate ?? 0,
          outboundMiles: (outbound.payload.loadedMiles ?? 0) + (backhaul.payload.loadedMiles ?? 0),
          returnRate: (backhaul.payload.rate ?? 0) + (intermediate.payload.rate ?? 0),
          returnMiles: (backhaul.payload.loadedMiles ?? 0) + (intermediate.payload.loadedMiles ?? 0),
          totalTripDays: 3,
          milesFromHomeAfterReturn: distFromHome,
          homeBase: deps.homeBase ?? '',
          returnDropState: intermediate.payload.dest.state,
          preferredLanes: deps.preferredLanes ?? [],
          vehicleCpmPerDay: deps.vehicleCpmPerDay ?? 0,
        };
        const threeStepResult = calculateChainScore(threeStepScoreInput);

        chains.push({
          steps: [outboundStep, intermediateStep, backhaulStep],
          totalMiles,
          totalRate,
          chainScore: threeStepResult.chainScore,
          chainScoreResult: threeStepResult,
        });
      } else {
        // Fall back to 2-step if no intermediate found
        const totalMiles =
          (outbound.payload.loadedMiles ?? 0) + (backhaul.payload.loadedMiles ?? 0);
        const totalRate = (outbound.payload.rate ?? 0) + (backhaul.payload.rate ?? 0);
        const fallbackScoreInput: ChainScoreInput = {
          outboundRate: outbound.payload.rate ?? 0,
          outboundMiles: outbound.payload.loadedMiles ?? 0,
          returnRate: backhaul.payload.rate ?? 0,
          returnMiles: backhaul.payload.loadedMiles ?? 0,
          totalTripDays: 2,
          milesFromHomeAfterReturn: distFromHome,
          homeBase: deps.homeBase ?? '',
          returnDropState: backhaul.payload.dest.state,
          preferredLanes: deps.preferredLanes ?? [],
          vehicleCpmPerDay: deps.vehicleCpmPerDay ?? 0,
        };
        const fallbackResult = calculateChainScore(fallbackScoreInput);

        chains.push({
          steps: [outboundStep, backhaulStep],
          totalMiles,
          totalRate,
          chainScore: fallbackResult.chainScore,
          chainScoreResult: fallbackResult,
        });
      }
    }

    if (chains.length >= limit) {
      break;
    }
  }

  // Sort chains by chainScore descending
  chains.sort((a, b) => b.chainScore - a.chainScore);

  // Cache result with 24h TTL
  await deps.redisPort.setWithTtl(cacheKey, JSON.stringify(chains), CHAIN_TTL_SECONDS);

  deps.logger.info('Chain assembly complete', {
    orgId,
    loadHash,
    vehicleId,
    chainsBuilt: chains.length,
  });

  return chains.slice(0, limit);
};
