import { Effect } from 'redux-saga/effects';
import { LifecycleHooks, CrudApiClient, CrudActions, EntityActions, NormalizationConfig, CrudMessages } from './types';
interface FetchAllSagaConfig<TEntity extends {
    id: string;
}> {
    entityName: string;
    entityNamePlural: string;
    apiClient: Pick<CrudApiClient<TEntity>, 'getAll'>;
    actions: Pick<CrudActions<TEntity>, 'fetchSuccess' | 'fetchFailure'>;
    entityActions: Pick<EntityActions<TEntity>, 'addMany' | 'setAll'>;
    normalization?: NormalizationConfig;
    messages?: Pick<CrudMessages, 'fetchError'>;
    hooks?: Pick<LifecycleHooks<TEntity>, 'beforeFetchAll' | 'afterFetchAll' | 'onError'>;
}
/**
 * Creates a fetchAll saga with complete lifecycle hooks
 *
 * @template TEntity - The entity type
 * @param config - Configuration for the saga
 * @returns A generator function for fetching all entities
 *
 * @example
 * ```typescript
 * const fetchAll = createFetchAllSaga({
 *   entityName: 'Post',
 *   entityNamePlural: 'Posts',
 *   apiClient: { getAll: blogApi.getPosts },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   hooks: {
 *     beforeFetchAll: function* () {
 *       console.log('About to fetch posts');
 *       return true; // Continue with fetch
 *     },
 *     afterFetchAll: function* (posts) {
 *       console.log(`Fetched ${posts.length} posts`);
 *     },
 *   },
 * });
 * ```
 */
export declare function createFetchAllSaga<TEntity extends {
    id: string;
}>(config: FetchAllSagaConfig<TEntity>): () => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=fetchAllSaga.d.ts.map