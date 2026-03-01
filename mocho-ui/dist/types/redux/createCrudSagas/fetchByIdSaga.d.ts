import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, EntityActions, CrudMessages } from './types';
interface FetchByIdSagaConfig<TEntity extends {
    id: string;
}> {
    entityName: string;
    apiClient: Pick<CrudApiClient<TEntity>, 'getById'>;
    actions: Pick<CrudActions<TEntity>, 'fetchByIdSuccess' | 'fetchByIdFailure'>;
    entityActions: Pick<EntityActions<TEntity>, 'addOne'>;
    messages?: Pick<CrudMessages, 'fetchError'>;
    hooks?: Pick<LifecycleHooks<TEntity>, 'beforeFetchById' | 'afterFetchById' | 'onError'>;
}
/**
 * Creates a fetchById saga with complete lifecycle hooks
 *
 * @template TEntity - The entity type
 * @param config - Configuration for the saga
 * @returns A generator function for fetching entity by ID
 *
 * @example
 * ```typescript
 * const fetchById = createFetchByIdSaga({
 *   entityName: 'Post',
 *   apiClient: { getById: blogApi.getPost },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   hooks: {
 *     beforeFetchById: function* (id) {
 *       console.log(`About to fetch post ${id}`);
 *       return true;
 *     },
 *     afterFetchById: function* (post) {
 *       // Load related data
 *       yield put(fetchCommentsRequest({ postId: post.id }));
 *     },
 *   },
 * });
 * ```
 */
export declare function createFetchByIdSaga<TEntity extends {
    id: string;
}>(config: FetchByIdSagaConfig<TEntity>): (action: PayloadAction<{
    id: string;
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=fetchByIdSaga.d.ts.map