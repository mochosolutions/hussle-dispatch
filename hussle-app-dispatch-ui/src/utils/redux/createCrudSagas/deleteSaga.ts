import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from 'utils/getNavigate';
import { createConfirmationHook } from './createConfirmationHook';
import type {
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  EntityActions,
  CrudMessages,
  NavigationConfig,
  ConfirmationConfig,
  DeleteResult,
} from './types';

interface DeleteSagaConfig<TEntity extends { id: string }> {
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
export function createDeleteSaga<TEntity extends { id: string }>(
  config: DeleteSagaConfig<TEntity>
) {
  const {
    entityName,
    apiClient,
    actions,
    entityActions,
    navigation,
    messages,
    refetchAfterMutation = false,
    hooks,
    confirmation,
  } = config;

  return function* remove(
    action: PayloadAction<{ id: string }>
  ): Generator<Effect, void, unknown> {
    const { id } = action.payload;

    try {
      // Validate API client
      if (!apiClient.delete) {
        throw new Error(`API client delete method not provided for ${entityName}`);
      }

      // Execute beforeDelete hook (either from hooks or confirmation)
      // Confirmation takes precedence if both are provided
      if (confirmation) {
        const confirmHook = createConfirmationHook(confirmation);
        const shouldContinue = (yield* confirmHook(id)) as boolean;
        if (!shouldContinue) {
          // Deletion cancelled by user
          return;
        }
      } else if (hooks?.beforeDelete) {
        const shouldContinue = (yield* hooks.beforeDelete(id)) as boolean;
        if (!shouldContinue) {
          // Deletion cancelled by beforeDelete hook
          return;
        }
      }

      // Call API to delete (may return DeleteResult with cascade info)
      const deleteResult = (yield call(apiClient.delete, id)) as DeleteResult | undefined;

      // Remove from entity store
      yield put(entityActions.removeOne(id));

      // Dispatch success action with ID for entity-level state tracking
      if (actions.deleteSuccess) {
        yield put(actions.deleteSuccess({ id }));
      }

      // Show success message with cascade delete info if available
      let successMessage = messages?.deleteSuccess || `${entityName} deleted successfully`;

      if (
        deleteResult &&
        typeof deleteResult === 'object' &&
        'deletedPosts' in deleteResult
      ) {
        // Has cascade delete information
        const parts: string[] = [`${entityName} deleted successfully`];

        if (deleteResult.deletedPosts && deleteResult.deletedPosts > 0) {
          parts.push(
            `${deleteResult.deletedPosts} post${deleteResult.deletedPosts > 1 ? 's' : ''} deleted`
          );
        }
        if (deleteResult.affectedPosts && deleteResult.affectedPosts > 0) {
          parts.push(
            `${deleteResult.affectedPosts} post${deleteResult.affectedPosts > 1 ? 's' : ''} affected`
          );
        }

        successMessage = parts.join('. ');
      }

      yield call(enqueueSnackbar, successMessage, { variant: 'success' });

      // Execute afterDelete hook with deleteResult for cascade state synchronization
      if (hooks?.afterDelete) {
        yield* hooks.afterDelete(id, deleteResult || undefined);
      }

      // Navigate if configured
      if (navigation?.afterDelete) {
        const navigate = (yield call(getNavigate)) as (path: string) => void;
        yield call(navigate, navigation.afterDelete);
      }

      // Refetch list if configured
      if (refetchAfterMutation && actions.fetchRequest) {
        yield put(actions.fetchRequest());
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.deleteError || `Failed to delete ${entityName.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'delete',
          error instanceof Error ? error : new Error(errorMessage),
          { id }
        );
      }

      // Include ID in failure for entity-level error tracking
      if (actions.deleteFailure) {
        yield put(actions.deleteFailure({ error: errorMessage, id }));
      }

      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    }
  };
}
