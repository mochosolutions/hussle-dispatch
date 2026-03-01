import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, BulkActions, EntityActions, CrudMessages, NavigationConfig, ConfirmationConfig } from './types';
interface DeleteManySagaConfig<TEntity extends {
    id: string;
}> {
    entityName: string;
    entityNamePlural: string;
    apiClient: Pick<CrudApiClient<TEntity>, 'deleteMany'>;
    actions?: Pick<CrudActions<TEntity>, 'fetchRequest'>;
    bulkActions: Pick<BulkActions, 'deleteManySuccess' | 'deleteManyFailure'>;
    entityActions?: Pick<EntityActions<TEntity>, 'removeMany'>;
    navigation?: Pick<NavigationConfig, 'afterDeleteMany'>;
    messages?: Pick<CrudMessages, 'deleteManySuccess' | 'deleteManyError'>;
    refetchAfterMutation?: boolean;
    hooks?: Pick<LifecycleHooks<TEntity>, 'beforeDeleteMany' | 'afterDeleteMany' | 'onError'>;
    confirmation?: ConfirmationConfig<string[]>;
}
/**
 * Creates a bulk delete saga with lifecycle hooks and optional confirmation
 *
 * Uses all-or-nothing pattern matching the API (Prisma's deleteMany).
 *
 * @template TEntity - The entity type
 * @param config - Configuration for the saga
 * @returns A generator function for bulk deleting entities
 *
 * @example
 * ```typescript
 * const deleteMany = createDeleteManySaga({
 *   entityName: 'Post',
 *   entityNamePlural: 'Posts',
 *   apiClient: { deleteMany: blogApi.bulkDeletePosts },
 *   bulkActions: postPageActions,
 *   entityActions: postsEntityActions,
 *   confirmation: {
 *     title: 'Delete Posts',
 *     message: (ids) => `Delete ${ids.length} posts? This cannot be undone.`,
 *     confirmActionType: 'CONFIRM_BULK_DELETE_POSTS',
 *     severity: 'error',
 *   },
 *   hooks: {
 *     afterDeleteMany: function* (result) {
 *       yield put(clearSelection());
 *       yield put(invalidateCache({ type: 'posts' }));
 *     },
 *   },
 * });
 * ```
 */
export declare function createDeleteManySaga<TEntity extends {
    id: string;
}>(config: DeleteManySagaConfig<TEntity>): (action: PayloadAction<{
    ids: string[];
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=deleteManySaga.d.ts.map