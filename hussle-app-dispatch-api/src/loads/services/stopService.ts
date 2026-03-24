import type { Stop } from '@prisma/client';
import { NotFoundError, ValidationError } from '@/shared/errors';
import type { LoadRepoPort } from '../types/loadTypes';
import type {
  CreateStopInput,
  ReorderStopsInput,
  StopRepoPort,
  UpdateStopInput,
} from '../types/stopTypes';

interface StopServiceDeps {
  stopRepository: StopRepoPort;
  loadRepository: LoadRepoPort;
}

export interface StopService {
  createStop(input: CreateStopInput): Promise<Stop>;
  updateStop(input: UpdateStopInput): Promise<Stop>;
  deleteStop(id: string, organizationId: string): Promise<void>;
  listStops(loadId: string, organizationId: string): Promise<Stop[]>;
  reorderStops(input: ReorderStopsInput): Promise<void>;
}

const findLoadOrThrow = async (
  loadId: string,
  organizationId: string,
  deps: StopServiceDeps,
): Promise<void> => {
  const load = await deps.loadRepository.findById(loadId, organizationId);
  if (load === null) {
    throw new NotFoundError('Load not found.');
  }
};

const validateReorderInput = (
  existingStops: Stop[],
  stopOrder: { id: string; sequence: number }[],
): void => {
  if (stopOrder.length !== existingStops.length) {
    throw new ValidationError(
      `Reorder must include all stops. Expected ${existingStops.length}, received ${stopOrder.length}.`,
    );
  }

  const sequences = stopOrder.map((entry) => entry.sequence);
  const uniqueSequences = new Set(sequences);

  if (uniqueSequences.size !== sequences.length) {
    throw new ValidationError('Duplicate sequences are not allowed.');
  }

  const existingIds = new Set(existingStops.map((stop) => stop.id));
  const missingIds = stopOrder.filter((entry) => !existingIds.has(entry.id));

  if (missingIds.length > 0) {
    throw new ValidationError('Reorder contains stop IDs that do not belong to this load.');
  }
};

export const createStopService = (deps: StopServiceDeps): StopService => ({
  createStop: async (input: CreateStopInput): Promise<Stop> => {
    await findLoadOrThrow(input.loadId, input.organizationId, deps);

    if (input.sequence === undefined) {
      const existingStops = await deps.stopRepository.findByLoadId(
        input.loadId,
        input.organizationId,
      );

      const maxSequence = existingStops.reduce(
        (max, stop) => Math.max(max, stop.sequence),
        0,
      );

      return deps.stopRepository.create({ ...input, sequence: maxSequence + 1 });
    }

    return deps.stopRepository.create(input);
  },

  updateStop: async (input: UpdateStopInput): Promise<Stop> => {
    return deps.stopRepository.update(input);
  },

  deleteStop: async (id: string, organizationId: string): Promise<void> => {
    await deps.stopRepository.delete(id, organizationId);
  },

  listStops: async (loadId: string, organizationId: string): Promise<Stop[]> => {
    await findLoadOrThrow(loadId, organizationId, deps);
    return deps.stopRepository.findByLoadId(loadId, organizationId);
  },

  reorderStops: async (input: ReorderStopsInput): Promise<void> => {
    await findLoadOrThrow(input.loadId, input.organizationId, deps);

    const existingStops = await deps.stopRepository.findByLoadId(
      input.loadId,
      input.organizationId,
    );

    validateReorderInput(existingStops, input.stopOrder);

    await deps.stopRepository.reorder(input);
  },
});
