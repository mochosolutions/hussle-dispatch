#!/usr/bin/env ts-node
/**
 * Backfill Place rows for existing Stops that pre-date auto-place resolution.
 *
 * Iterates every Stop where `placeId IS NULL` and (`address` or `city` is set),
 * runs the same `resolveStopToPlace` pipeline used by the create/update load
 * paths, and persists `placeId` / `resolutionStatus` / facility name updates.
 *
 * Idempotency: the candidate filter excludes any Stop that already has a
 * `placeId`, so re-running the script after a successful run is a safe no-op.
 *
 * Usage:
 *   npx tsx src/scripts/backfillPlaces.ts                  # full run (live)
 *   npx tsx src/scripts/backfillPlaces.ts --dry-run        # log without writing
 *   npx tsx src/scripts/backfillPlaces.ts --org <orgId>    # scope to one org
 *
 * Required environment:
 *   DATABASE_URL                       Postgres connection string
 *   AWS_REGION                         AWS region for Location v2
 *   AWS_ACCESS_KEY_ID                  (optional — falls back to AWS SDK chain)
 *   AWS_SECRET_ACCESS_KEY              (optional — same as above)
 */
import 'dotenv/config';

import { prisma } from '../config/database';
import { createAwsLocationProvider } from '../shared/providers/awsLocationProvider';
import { placeRepositoryPrisma } from '../places/repositories/placeRepositoryPrisma';
import {
  createResolveStopToPlace,
  StopResolutionStatus,
  WarningCode,
} from '../places/services/resolveStopToPlace';
import type {
  ResolveStopInput,
  ResolveStopResult,
  WarningCodeValue,
} from '../places/services/resolveStopToPlace';
import { logger } from '../shared/utils/logger';

interface ScriptOptions {
  isDryRun: boolean;
  organizationId?: string;
}

interface OutcomeCounts {
  resolved: number;
  ambiguous: number;
  partial: number;
  notGeocoded: number;
  geocoderUnavailable: number;
  failed: number;
}

const BATCH_SIZE = 100;

class ScriptUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScriptUsageError';
  }
}

const writeErrorLine = (message: string): void => {
  process.stderr.write(`${message}\n`);
};

const getSingleFlagValue = (args: string[], flag: string): string | undefined => {
  const index = args.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new ScriptUsageError(`Missing value for ${flag}`);
  }
  return value;
};

const parseOptions = (args: string[]): ScriptOptions => ({
  isDryRun: args.includes('--dry-run'),
  organizationId: getSingleFlagValue(args, '--org'),
});

const printUsage = (): void => {
  writeErrorLine('Usage:');
  writeErrorLine('  npx tsx src/scripts/backfillPlaces.ts');
  writeErrorLine('  npx tsx src/scripts/backfillPlaces.ts --dry-run');
  writeErrorLine('  npx tsx src/scripts/backfillPlaces.ts --org <organizationId>');
};

const buildEmptyCounts = (): OutcomeCounts => ({
  resolved: 0,
  ambiguous: 0,
  partial: 0,
  notGeocoded: 0,
  geocoderUnavailable: 0,
  failed: 0,
});

const bucketForResult = (result: ResolveStopResult): keyof OutcomeCounts => {
  if (result.resolutionStatus === StopResolutionStatus.RESOLVED) {
    return 'resolved';
  }

  const code: WarningCodeValue | undefined = result.warning?.code;
  if (code === WarningCode.STOP_AMBIGUOUS_ADDRESS) {
    return 'ambiguous';
  }
  if (code === WarningCode.STOP_PARTIAL_ADDRESS) {
    return 'partial';
  }
  if (code === WarningCode.STOP_NOT_GEOCODED) {
    return 'notGeocoded';
  }
  if (code === WarningCode.GEOCODER_UNAVAILABLE) {
    return 'geocoderUnavailable';
  }
  return 'failed';
};

interface CandidateStop {
  id: string;
  loadId: string;
  sequence: number;
  facilityName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contactName: string | null;
  contactPhone: string | null;
  notes: string | null;
  load: { organizationId: string };
}

const fetchBatch = async (
  organizationId: string | undefined,
  cursor: string | undefined,
): Promise<CandidateStop[]> => {
  const where = {
    placeId: null,
    OR: [{ address: { not: null } }, { city: { not: null } }],
    ...(organizationId !== undefined ? { load: { organizationId } } : {}),
  };

  const rows = await prisma.stop.findMany({
    where,
    include: { load: { select: { organizationId: true } } },
    orderBy: { id: 'asc' },
    take: BATCH_SIZE,
    ...(cursor !== undefined ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  return rows.map((row) => ({
    id: row.id,
    loadId: row.loadId,
    sequence: row.sequence,
    facilityName: row.facilityName,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    contactName: row.contactName,
    contactPhone: row.contactPhone,
    notes: row.notes,
    load: { organizationId: row.load.organizationId },
  }));
};

const buildResolveInput = (stop: CandidateStop): ResolveStopInput => ({
  placeId: null,
  facilityName: stop.facilityName,
  address: stop.address,
  city: stop.city,
  state: stop.state,
  zip: stop.zip,
  contactName: stop.contactName,
  contactPhone: stop.contactPhone,
  notes: stop.notes,
  sequence: stop.sequence,
});

const persistResult = async (
  stopId: string,
  result: ResolveStopResult,
): Promise<void> => {
  const data: {
    resolutionStatus: string;
    placeId?: string;
    facilityName?: string;
  } = {
    resolutionStatus: result.resolutionStatus,
  };

  if (result.placeId !== null) {
    data.placeId = result.placeId;
  }
  if (result.facilityNameToWrite !== undefined) {
    data.facilityName = result.facilityNameToWrite;
  }

  await prisma.stop.update({
    where: { id: stopId },
    data,
  });
};

const processStop = async (
  stop: CandidateStop,
  resolveStopToPlace: ReturnType<typeof createResolveStopToPlace>,
  options: ScriptOptions,
  counts: OutcomeCounts,
): Promise<void> => {
  const orgId = stop.load.organizationId;

  try {
    const input = buildResolveInput(stop);
    const result = await resolveStopToPlace(input, orgId);
    const bucket = bucketForResult(result);
    counts[bucket] += 1;

    logger.info('backfillPlaces: stop processed', {
      stopId: stop.id,
      orgId,
      outcome: bucket,
      placeId: result.placeId,
      reason: result.warning?.code ?? 'ok',
      resolutionStatus: result.resolutionStatus,
      dryRun: options.isDryRun,
    });

    if (!options.isDryRun) {
      await persistResult(stop.id, result);
    }
  } catch (error: unknown) {
    counts.failed += 1;
    const message = error instanceof Error ? error.message : String(error);
    logger.error('backfillPlaces: stop failed', {
      stopId: stop.id,
      orgId,
      outcome: 'failed',
      reason: message,
    });
  }
};

const run = async (options: ScriptOptions): Promise<void> => {
  const provider = createAwsLocationProvider();
  const placeRepo = placeRepositoryPrisma(prisma);
  const resolveStopToPlace = createResolveStopToPlace({
    placeRepo,
    geocodingProvider: provider,
    logger,
  });

  logger.info('backfillPlaces: starting', {
    dryRun: options.isDryRun,
    organizationId: options.organizationId ?? null,
    batchSize: BATCH_SIZE,
  });

  const counts = buildEmptyCounts();
  let totalProcessed = 0;
  let cursor: string | undefined;

  // Stream stops in batches to avoid loading the full backlog into memory.
  // The `placeId IS NULL` filter is the idempotency guarantee: any stop we
  // resolve in a prior run no longer matches.
  while (true) {
    const stops = await fetchBatch(options.organizationId, cursor);
    if (stops.length === 0) {
      break;
    }

    for (const stop of stops) {
      await processStop(stop, resolveStopToPlace, options, counts);
      totalProcessed += 1;
    }

    const lastStop = stops[stops.length - 1];
    if (lastStop === undefined) {
      break;
    }
    cursor = lastStop.id;

    logger.info('backfillPlaces: batch complete', {
      totalProcessed,
      counts,
    });
  }

  logger.info('backfillPlaces: finished', {
    dryRun: options.isDryRun,
    organizationId: options.organizationId ?? null,
    totalProcessed,
    counts,
  });
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const options = parseOptions(args);
  await run(options);
};

main()
  .catch((error: unknown) => {
    if (error instanceof ScriptUsageError) {
      writeErrorLine(`ERROR: ${error.message}`);
      printUsage();
    } else if (error instanceof Error) {
      writeErrorLine(`ERROR: ${error.message}`);
    } else {
      writeErrorLine('ERROR: backfillPlaces failed for an unknown reason.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
