import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, EntityActions, CrudMessages, NavigationConfig, ConfirmationConfig } from './types';
interface UpdateSagaConfig<TEntity extends {
    id: string;
}, TUpdateInput = Partial<TEntity>> {
    entityName: string;
    apiClient: Pick<CrudApiClient<TEntity, unknown, TUpdateInput>, 'update'>;
    actions: Pick<CrudActions<TEntity>, 'fetchRequest' | 'updateSuccess' | 'updateFailure'>;
    entityActions: Pick<EntityActions<TEntity>, 'updateOne'>;
    navigation?: Pick<NavigationConfig, 'afterUpdate'>;
    messages?: Pick<CrudMessages, 'updateSuccess' | 'updateError'>;
    refetchAfterMutation?: boolean;
    hooks?: Pick<LifecycleHooks<TEntity, unknown, TUpdateInput>, 'beforeUpdate' | 'afterUpdate' | 'onError'>;
    confirmation?: ConfirmationConfig<{
        id: string;
        data: TUpdateInput;
    }>;
}
/**
 * Creates an update saga with complete lifecycle hooks and optional confirmation
 *
 * @template TEntity - The entity type
 * @template TUpdateInput - The input type for update
 * @param config - Configuration for the saga
 * @returns A generator function for updating entities
 *
 * @example
 * ```typescript
 * const update = createUpdateSaga({
 *   entityName: 'Post',
 *   apiClient: { update: blogApi.updatePost },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   navigation: { afterUpdate: '/posts' },
 *   confirmation: {
 *     title: 'Update Post',
 *     message: 'Are you sure you want to update this post?',
 *     confirmActionType: 'CONFIRM_UPDATE_POST',
 *   },
 *   hooks: {
 *     afterUpdate: function* (post) {
 *       yield put(invalidateCache({ type: 'posts' }));
 *     },
 *   },
 * });
 * ```
 */
export declare function createUpdateSaga<TEntity extends {
    id: string;
}, TUpdateInput = Partial<TEntity>>(config: UpdateSagaConfig<TEntity, TUpdateInput>): (action: PayloadAction<{
    id: string;
    data: TUpdateInput;
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=updateSaga.d.ts.map