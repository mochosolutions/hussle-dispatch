import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createConfirmationHook } from './createConfirmationHook';
import type {
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  BulkActions,
  EntityActions,
  CrudMessages,
  NavigationConfig,
  ConfirmationConfig,
  BulkDeleteResult,
} from './types';

interface DeleteManySagaConfig<TEntity extends { id: string }> {
  entityName: string;
  entityNamePlural: string;
  apiClient: Pick<CrudApiClient<TEntity>, 'deleteMany'>;
  actions?: Pick<CrudActions<TEntity>, 'fetchRequest'>;
  bulkActions: Pick<BulkActions, 'deleteManySuccess' | 'deleteManyFailure'>;
  entityActions?: Pick<EntityActions<TEntity>, 'removeMany'>;
  navigation?: Pick<NavigationConfig, 'afterDeleteMany'>;
  messages?: Pick<CrudMessages, 'deleteManySuccess' | 'deleteManyError'>;
  refetchAfterMutation?: boolean;
  hooks?: Pick<
    LifecycleHooks<TEntity>,
    'beforeDeleteMany' | 'afterDeleteMany' | 'onError'
  >;
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
export function createDeleteManySaga<TEntity extends { id: string }>(
  config: DeleteManySagaConfig<TEntity>
) {
  const {
    entityName,
    entityNamePlural,
    apiClient,
    actions,
    bulkActions,
    entityActions,
    navigation,
    messages,
    refetchAfterMutation = false,
    hooks,
    confirmation,
  } = config;

  return function* deleteMany(
    action: PayloadAction<{ ids: string[] }>
  ): Generator<Effect, void, unknown> {
    const { ids } = action.payload;

    try {
      // Validate API client
      if (!apiClient.deleteMany) {
        throw new Error(`API client deleteMany method not provided for ${entityName}`);
      }

      // Validate input
      if (!ids || ids.length === 0) {
        // No items to delete
        return;
      }

      // Execute beforeDeleteMany hook (either from hooks or confirmation)
      if (confirmation) {
        const confirmHook = createConfirmationHook(confirmation);
        const shouldContinue = (yield* confirmHook(ids)) as boolean;
        if (!shouldContinue) {
          // Bulk deletion cancelled by user
          return;
        }
      } else if (hooks?.beforeDeleteMany) {
        const shouldContinue = (yield* hooks.beforeDeleteMany(ids)) as boolean;
        if (!shouldContinue) {
          // Bulk deletion cancelled by beforeDeleteMany hook
          return;
        }
      }

      // Call API to bulk delete
      const result = (yield call(apiClient.deleteMany, ids)) as BulkDeleteResult;

      // Remove from entity store if entityActions provided
      if (entityActions?.removeMany) {
        yield put(entityActions.removeMany(result.postIds));
      }

      // Dispatch success action
      if (bulkActions.deleteManySuccess) {
        yield put(bulkActions.deleteManySuccess(result));
      }

      // Show success message
      const successMessage =
        messages?.deleteManySuccess ||
        `Successfully deleted ${result.deleted} ${result.deleted === 1 ? entityName.toLowerCase() : entityNamePlural.toLowerCase()}`;
      yield call(enqueueSnackbar, successMessage, { variant: 'success' });

      // Execute afterDeleteMany hook
      if (hooks?.afterDeleteMany) {
        yield* hooks.afterDeleteMany(result);
      }

      // Navigate if configured
      if (navigation?.afterDeleteMany) {
        const navigate = (yield call(getNavigate)) as (path: string) => void;
        yield call(navigate, navigation.afterDeleteMany);
      }

      // Refetch list if configured
      if (refetchAfterMutation && actions?.fetchRequest) {
        yield put(actions.fetchRequest());
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.deleteManyError ||
            `Failed to delete ${entityNamePlural.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'deleteMany',
          error instanceof Error ? error : new Error(errorMessage),
          { ids }
        );
      }

      if (bulkActions.deleteManyFailure) {
        yield put(bulkActions.deleteManyFailure({ error: errorMessage }));
      }

      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    }
  };
}
