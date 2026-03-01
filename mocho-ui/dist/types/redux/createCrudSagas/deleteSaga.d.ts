import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, EntityActions, CrudMessages, NavigationConfig, ConfirmationConfig } from './types';
interface DeleteSagaConfig<TEntity extends {
    id: string;
}> {
    entityName: string;
    apiClient: Pick<CrudApiClient<TEntity>, 'delete'>;
    actions: Pick<CrudActions<TEntity>, 'fetchRequest' | 'deleteSuccess' | 'deleteFailure'>;
    entityActions: Pick<EntityActions<TEntity>, 'removeOne'>;
    navigation?: Pick<NavigationConfig, 'afterDelete'>;
    messages?: Pick<CrudMessages, 'deleteSuccess' | 'deleteError'>;
    refetchAfterMutation?: boolean;
    hooks?: Pick<LifecycleHooks<TEntity>, 'beforeDelete' | 'afterDelete' | 'onError'>;
    confirmation?: ConfirmationConfig<string>;
}
/**
 * Creates a delete saga with complete lifecycle hooks and optional confirmation
 *
 * @template TEntity - The entity type
 * @param config - Configuration for the saga
 * @returns A generator function for deleting entities
 *
 * @example
 * ```typescript
 * const deleteSaga = createDeleteSaga({
 *   entityName: 'Post',
 *   apiClient: { delete: blogApi.deletePost },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   navigation: { afterDelete: '/posts' },
 *   confirmation: {
 *     title: 'Delete Post',
 *     message: (id) => `Are you sure you want to delete post ${id}?`,
 *     confirmActionType: 'CONFIRM_DELETE_POST',
 *     severity: 'error',
 *   },
 *   hooks: {
 *     afterDelete: function* (id, result) {
 *       // Handle cascade deletions
 *       if (result?.deletedPostIds?.length > 0) {
 *         yield put(postsActions.removeMany(result.deletedPostIds));
 *       }
 *     },
 *   },
 * });
 * ```
 */
export declare function createDeleteSaga<TEntity extends {
    id: string;
}>(config: DeleteSagaConfig<TEntity>): (action: PayloadAction<{
    id: string;
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=deleteSaga.d.ts.map