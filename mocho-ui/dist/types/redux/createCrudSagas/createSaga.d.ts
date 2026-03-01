import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, EntityActions, CrudMessages, NavigationConfig } from './types';
interface CreateSagaConfig<TEntity extends {
    id: string;
}, TCreateInput = Partial<TEntity>> {
    entityName: string;
    apiClient: Pick<CrudApiClient<TEntity, TCreateInput>, 'create'>;
    actions: Pick<CrudActions<TEntity>, 'fetchRequest' | 'createSuccess' | 'createFailure'>;
    entityActions: Pick<EntityActions<TEntity>, 'addOne'>;
    navigation?: Pick<NavigationConfig, 'afterCreate'>;
    messages?: Pick<CrudMessages, 'createSuccess' | 'createError'>;
    refetchAfterMutation?: boolean;
    hooks?: Pick<LifecycleHooks<TEntity, TCreateInput>, 'beforeCreate' | 'afterCreate' | 'onError'>;
}
/**
 * Creates a create saga with complete lifecycle hooks
 *
 * @template TEntity - The entity type
 * @template TCreateInput - The input type for create
 * @param config - Configuration for the saga
 * @returns A generator function for creating entities
 *
 * @example
 * ```typescript
 * const create = createCreateSaga({
 *   entityName: 'Post',
 *   apiClient: { create: blogApi.createPost },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   navigation: { afterCreate: '/posts' },
 *   hooks: {
 *     beforeCreate: function* (data) {
 *       // Validate or transform data
 *       console.log('Creating post:', data.title);
 *       return true;
 *     },
 *     afterCreate: function* (post) {
 *       // Trigger related actions
 *       yield put(trackAnalytics({ event: 'post_created', id: post.id }));
 *     },
 *   },
 * });
 * ```
 */
export declare function createCreateSaga<TEntity extends {
    id: string;
}, TCreateInput = Partial<TEntity>>(config: CreateSagaConfig<TEntity, TCreateInput>): (action: PayloadAction<{
    data: TCreateInput;
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=createSaga.d.ts.map