import { Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { LifecycleHooks, CrudApiClient, CrudActions, BulkActions, CrudMessages, NavigationConfig, ConfirmationConfig } from './types';
interface UpdateManySagaConfig<TUpdateInput = unknown> {
    entityName: string;
    entityNamePlural: string;
    apiClient: Pick<CrudApiClient<unknown, unknown, TUpdateInput>, 'updateMany'>;
    actions?: Pick<CrudActions<unknown>, 'fetchRequest'>;
    bulkActions: Pick<BulkActions<TUpdateInput>, 'updateManySuccess' | 'updateManyFailure'>;
    navigation?: Pick<NavigationConfig, 'afterUpdateMany'>;
    messages?: Pick<CrudMessages, 'updateManySuccess' | 'updateManyError'>;
    refetchAfterMutation?: boolean;
    hooks?: Pick<LifecycleHooks<unknown, unknown, TUpdateInput>, 'beforeUpdateMany' | 'afterUpdateMany' | 'onError'>;
    confirmation?: ConfirmationConfig<{
        ids: string[];
        data: TUpdateInput;
    }>;
}
/**
 * Creates a bulk update saga with lifecycle hooks and optional confirmation
 *
 * Uses all-or-nothing pattern matching the API (Prisma's updateMany).
 *
 * @template TUpdateInput - The input type for update
 * @param config - Configuration for the saga
 * @returns A generator function for bulk updating entities
 *
 * @example
 * ```typescript
 * const updateMany = createUpdateManySaga({
 *   entityName: 'Post',
 *   entityNamePlural: 'Posts',
 *   apiClient: { updateMany: blogApi.bulkUpdatePostStatus },
 *   bulkActions: postPageActions,
 *   confirmation: {
 *     title: 'Update Posts',
 *     message: ({ ids }) => `Update ${ids.length} posts?`,
 *     confirmActionType: 'CONFIRM_BULK_UPDATE_POSTS',
 *   },
 *   hooks: {
 *     afterUpdateMany: function* (result) {
 *       yield put(clearSelection());
 *     },
 *   },
 * });
 * ```
 */
export declare function createUpdateManySaga<TUpdateInput = unknown>(config: UpdateManySagaConfig<TUpdateInput>): (action: PayloadAction<{
    ids: string[];
    data: TUpdateInput;
}>) => Generator<Effect, void, unknown>;
export {};
//# sourceMappingURL=updateManySaga.d.ts.map