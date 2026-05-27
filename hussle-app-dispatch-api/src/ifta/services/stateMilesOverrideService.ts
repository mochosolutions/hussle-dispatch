import type { LoadStateMiles } from '@prisma/client';
import type { Logger } from '@/shared/utils/logger';
import type { StateMilesRepoPort } from '../types/iftaTypes';

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface OverrideStateMilesInput {
  loadId: string;
  organizationId: string;
  stateMiles: { state: string; miles: number }[];
}

export interface GetStateMilesInput {
  loadId: string;
  organizationId: string;
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface StateMilesOverrideService {
  overrideStateMiles(input: OverrideStateMilesInput): Promise<void>;
  getStateMiles(input: GetStateMilesInput): Promise<LoadStateMiles[]>;
}

// ---------------------------------------------------------------------------
// Dependencies
// ---------------------------------------------------------------------------

interface StateMilesOverrideServiceDeps {
  stateMilesRepo: StateMilesRepoPort;
  logger: Logger;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export const createStateMilesOverrideService = (
  deps: StateMilesOverrideServiceDeps,
): StateMilesOverrideService => ({
  overrideStateMiles: async (input) => {
    const { loadId, stateMiles } = input;

    await deps.stateMilesRepo.deleteByLoadIdAndSource(loadId, 'MANUAL');

    await deps.stateMilesRepo.upsertMany(
      loadId,
      stateMiles.map((sm) => ({
        state: sm.state,
        miles: sm.miles,
        source: 'MANUAL' as const,
      })),
    );

    deps.logger.info('Manual state miles override', {
      loadId,
      stateCount: stateMiles.length,
    });
  },

  getStateMiles: async (input) => deps.stateMilesRepo.findByLoadId(input.loadId),
});
