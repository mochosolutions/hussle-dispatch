import { CrudApiClient } from '../../createCrudSagas/types';
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
export interface MockApiClient<TEntity extends {
    id: string;
}, TCreateInput = Partial<TEntity>, TUpdateInput = Partial<TEntity>> extends CrudApiClient<TEntity, TCreateInput, TUpdateInput> {
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
export declare function createMockApi<TEntity extends {
    id: string;
}, TCreateInput = Partial<TEntity>, TUpdateInput = Partial<TEntity>>(initialData: TEntity[], options?: MockApiOptions): MockApiClient<TEntity, TCreateInput, TUpdateInput>;
//# sourceMappingURL=mockApi.d.ts.map