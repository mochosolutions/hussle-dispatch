import type { Logger } from '../../shared/utils/logger';
import type { LoadBoardRedisPort } from '../types/loadBoardPorts';
import type {
  IngestServiceInput,
  FeedServiceInput,
  FeedDetailInput,
  ClearSourceInput,
  FeedResponse,
  StagedLoad,
  FeedMeta,
} from '../types/loadBoardTypes';
import { createRelayMapper } from '../mappers/relayMapper';
import { createDatMapper } from '../mappers/datMapper';
import { NotFoundError } from '../../shared/errors/commonErrors';

interface LoadBoardServiceDeps {
  redisPort: LoadBoardRedisPort;
  logger: Logger;
}

export interface LoadBoardService {
  ingest(input: IngestServiceInput): Promise<{ count: number }>;
  getFeed(input: FeedServiceInput): Promise<FeedResponse>;
  getLoadDetail(input: FeedDetailInput): Promise<StagedLoad>;
  clearSource(input: ClearSourceInput): Promise<void>;
}

const emptyMeta = (): FeedMeta => ({
  total: 0,
  sources: {},
  lastUpdated: {},
});

export const createLoadBoardService = (deps: LoadBoardServiceDeps): LoadBoardService => ({
  ingest: async (input) => {
    const mapper = input.source === 'relay' ? createRelayMapper() : createDatMapper();
    const loads = mapper.mapLoads(input.loads);

    await deps.redisPort.snapshotReplace(input.organizationId, input.source, loads);
    await deps.redisPort.updateMeta(input.organizationId, input.source, loads.length);

    deps.logger.info('Loads ingested', {
      organizationId: input.organizationId,
      source: input.source,
      count: loads.length,
    });

    return { count: loads.length };
  },

  getFeed: async (input) => {
    const [loads, meta] = await Promise.all([
      deps.redisPort.getAllLoads(input.organizationId, input.source),
      deps.redisPort.getMeta(input.organizationId),
    ]);

    return {
      data: loads,
      meta: meta ?? emptyMeta(),
    };
  },

  getLoadDetail: async (input) => {
    const load = await deps.redisPort.getLoadById(input.organizationId, input.id);

    if (load === null) {
      throw new NotFoundError(`Load with id ${input.id} not found`);
    }

    return load;
  },

  clearSource: async (input) => {
    await deps.redisPort.clearSource(input.organizationId, input.source);

    deps.logger.info('Source cleared', {
      organizationId: input.organizationId,
      source: input.source,
    });
  },
});
