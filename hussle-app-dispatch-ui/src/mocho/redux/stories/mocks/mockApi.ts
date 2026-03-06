/**
 * Mock API client factory for Storybook stories
 *
 * Creates a simulated API client that mimics real CRUD operations
 * with configurable delays and error simulation.
 */

import type { CrudApiClient, BulkDeleteResult, BulkUpdateResult } from '../../createCrudSagas/types';

/**
 * Options for configuring mock API behavior
 */
export interface MockApiOptions {
  /** Simulated network latency in milliseconds (default: 0) */
  delay?: number;
  /** When true, all API calls will throw an error */
  shouldFail?: boolean;
  /** Custom error message when shouldFail is true */
  errorMessage?: string;
}

/**
 * Extended API client with utility methods for testing
 */
export interface MockApiClient<TEntity extends { id: string }, TCreateInput = Partial<TEntity>, TUpdateInput = Partial<TEntity>>
  extends CrudApiClient<TEntity, TCreateInput, TUpdateInput> {
  /** Update mock options at runtime */
  setOptions: (options: Partial<MockApiOptions>) => void;
  /** Reset data to initial state */
  reset: () => void;
  /** Get current data state */
  getData: () => TEntity[];
}

/**
 * Creates a mock API client for testing CRUD operations in Storybook
 *
 * @param initialData - Initial array of entities
 * @param options - Configuration options
 * @returns Mock API client with CRUD methods
 *
 * @example
 * ```typescript
 * const api = createMockApi<DemoTask>(mockTasks, {
 *   delay: 500,       // Simulate 500ms network delay
 *   shouldFail: false // Toggle to simulate errors
 * });
 *
 * // Use in sagas or stories
 * const tasks = await api.getAll();
 * ```
 */
export function createMockApi<
  TEntity extends { id: string },
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>
>(
  initialData: TEntity[],
  options: MockApiOptions = {}
): MockApiClient<TEntity, TCreateInput, TUpdateInput> {
  // Internal mutable state
  let data: TEntity[] = [...initialData];
  let currentOptions: MockApiOptions = { ...options };

  /**
   * Helper to simulate network delay
   */
  const delay = async (): Promise<void> => {
    if (currentOptions.delay && currentOptions.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, currentOptions.delay));
    }
  };

  /**
   * Helper to check if should throw error
   */
  const maybeThrowError = (): void => {
    if (currentOptions.shouldFail) {
      throw new Error(currentOptions.errorMessage || 'API Error');
    }
  };

  /**
   * Generate a unique ID for new entities
   */
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };

  /**
   * Get current timestamp
   */
  const getTimestamp = (): string => {
    return new Date().toISOString();
  };

  return {
    /**
     * Fetch all entities
     */
    getAll: async (): Promise<TEntity[]> => {
      await delay();
      maybeThrowError();
      return [...data];
    },

    /**
     * Fetch entity by ID
     */
    getById: async (id: string): Promise<TEntity> => {
      await delay();
      maybeThrowError();
      const entity = data.find((e) => e.id === id);
      if (!entity) {
        throw new Error('Entity not found');
      }
      return { ...entity };
    },

    /**
     * Create a new entity
     */
    create: async (input: TCreateInput): Promise<TEntity> => {
      await delay();
      maybeThrowError();

      const now = getTimestamp();
      const newEntity = {
        ...input,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      } as unknown as TEntity;

      data.push(newEntity);
      return { ...newEntity };
    },

    /**
     * Update an existing entity
     */
    update: async (id: string, input: TUpdateInput): Promise<TEntity> => {
      await delay();
      maybeThrowError();

      const index = data.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new Error('Entity not found');
      }

      const updated = {
        ...data[index],
        ...input,
        id, // Ensure ID is not overwritten
        updatedAt: getTimestamp(),
      };

      data[index] = updated;
      return { ...updated };
    },

    /**
     * Delete an entity by ID
     */
    delete: async (id: string): Promise<void> => {
      await delay();
      maybeThrowError();

      const index = data.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new Error('Entity not found');
      }

      data.splice(index, 1);
    },

    /**
     * Delete multiple entities
     */
    deleteMany: async (ids: string[]): Promise<BulkDeleteResult> => {
      await delay();
      maybeThrowError();

      const deletedIds: string[] = [];
      ids.forEach((id) => {
        const index = data.findIndex((e) => e.id === id);
        if (index !== -1) {
          data.splice(index, 1);
          deletedIds.push(id);
        }
      });

      return {
        deleted: deletedIds.length,
        postIds: deletedIds,
      };
    },

    /**
     * Update multiple entities
     */
    updateMany: async (ids: string[], input: TUpdateInput): Promise<BulkUpdateResult> => {
      await delay();
      maybeThrowError();

      const updatedIds: string[] = [];
      const now = getTimestamp();

      ids.forEach((id) => {
        const index = data.findIndex((e) => e.id === id);
        if (index !== -1) {
          data[index] = {
            ...data[index],
            ...input,
            id,
            updatedAt: now,
          };
          updatedIds.push(id);
        }
      });

      return {
        updated: updatedIds.length,
        postIds: updatedIds,
      };
    },

    /**
     * Update mock options at runtime
     */
    setOptions: (newOptions: Partial<MockApiOptions>): void => {
      currentOptions = { ...currentOptions, ...newOptions };
    },

    /**
     * Reset data to initial state
     */
    reset: (): void => {
      data = [...initialData];
    },

    /**
     * Get current data state (for debugging/inspection)
     */
    getData: (): TEntity[] => {
      return [...data];
    },
  };
}
