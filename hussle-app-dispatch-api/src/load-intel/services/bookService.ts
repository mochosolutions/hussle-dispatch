import type { Logger } from '../../shared/utils/logger';
import { GoneError } from '../../shared/errors';
import type { LoadIntelRedisPort } from '../types/loadIntelPorts';
import type { LoadIntelRedis } from '../types/loadIntelTypes';
import type { BookLoadPrefill, BookChainPrefill } from '../types/bookTypes';

interface BookServiceDeps {
  redisPort: LoadIntelRedisPort;
  logger: Logger;
}

const toPrefill = (record: LoadIntelRedis): BookLoadPrefill => ({
  loadHash: record.loadHash,
  source: record.payload.source,
  origin: record.payload.origin,
  dest: record.payload.dest,
  pickupDate: record.payload.pickupDate,
  deliveryDate: record.payload.deliveryDate,
  equipmentType: record.payload.equipmentType,
  rate: record.payload.rate,
  loadedMiles: record.payload.loadedMiles,
  brokerName: record.payload.broker?.name,
  brokerMc: record.payload.broker?.mc,
  brokerPhone: record.payload.brokerPhone,
  weight: record.payload.weight,
});

/**
 * Read load from Redis and return pre-fill data for load creator.
 * Does NOT create a load — returns data for the creation form.
 * Returns 410 Gone if Redis key has expired.
 */
export const bookLoad = async (
  orgId: string,
  loadHash: string,
  deps: BookServiceDeps,
): Promise<BookLoadPrefill> => {
  const redisKey = `intel:${orgId}:${loadHash}`;
  const raw = await deps.redisPort.get(redisKey);

  if (raw === null) {
    throw new GoneError(`Load intel record ${loadHash} has expired or does not exist`);
  }

  const record = JSON.parse(raw) as LoadIntelRedis;

  deps.logger.info('Load intel book prefill returned', { orgId, loadHash });

  return toPrefill(record);
};

/**
 * Read outbound load and its chain from Redis, return pre-fill data.
 */
export const bookChain = async (
  orgId: string,
  loadHash: string,
  deps: BookServiceDeps,
): Promise<BookChainPrefill> => {
  // Get outbound
  const outboundKey = `intel:${orgId}:${loadHash}`;
  const outboundRaw = await deps.redisPort.get(outboundKey);

  if (outboundRaw === null) {
    throw new GoneError(`Outbound load intel record ${loadHash} has expired or does not exist`);
  }

  const outbound = JSON.parse(outboundRaw) as LoadIntelRedis;

  // Get chain data
  const chainKey = `intel:chain:${orgId}:${loadHash}`;
  const chainRaw = await deps.redisPort.get(chainKey);

  const backhaulPrefills: BookLoadPrefill[] = [];

  if (chainRaw !== null) {
    const chains = JSON.parse(chainRaw) as { steps: { loadHash: string }[] }[];
    const firstChain = chains[0];

    if (firstChain !== undefined) {
      // Get all non-outbound steps
      for (const step of firstChain.steps) {
        if (step.loadHash !== loadHash) {
          const stepKey = `intel:${orgId}:${step.loadHash}`;
          const stepRaw = await deps.redisPort.get(stepKey);

          if (stepRaw !== null) {
            const stepRecord = JSON.parse(stepRaw) as LoadIntelRedis;
            backhaulPrefills.push(toPrefill(stepRecord));
          }
        }
      }
    }
  }

  deps.logger.info('Load intel chain book prefill returned', {
    orgId,
    loadHash,
    backhaulCount: backhaulPrefills.length,
  });

  return {
    outbound: toPrefill(outbound),
    backhaul: backhaulPrefills,
  };
};
