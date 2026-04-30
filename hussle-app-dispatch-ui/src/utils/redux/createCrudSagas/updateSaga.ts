import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
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
} from './types';

interface UpdateSagaConfig<
  TEntity extends { id: string },
  TUpdateInput = Partial<TEntity>
> {
  entityName: string;
  apiClient: Pick<CrudApiClient<TEntity, unknown, TUpdateInput>, 'update'>;
  actions: Pick<CrudActions<TEntity>, 'fetchRequest' | 'updateSuccess' | 'updateFailure'>;
  entityActions: Pick<EntityActions<TEntity>, 'updateOne'>;
  navigation?: Pick<NavigationConfig, 'afterUpdate'>;
  messages?: Pick<CrudMessages, 'updateSuccess' | 'updateError'>;
  refetchAfterMutation?: boolean;
  hooks?: Pick<
    LifecycleHooks<TEntity, unknown, TUpdateInput>,
    'beforeUpdate' | 'afterUpdate' | 'onError'
  >;
  confirmation?: ConfirmationConfig<{ id: string; data: TUpdateInput }>;
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
export function createUpdateSaga<
  TEntity extends { id: string },
  TUpdateInput = Partial<TEntity>
>(config: UpdateSagaConfig<TEntity, TUpdateInput>) {
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

  return function* update(
    action: PayloadAction<{ id: string; data: TUpdateInput }>
  ): Generator<Effect, void, unknown> {
    const { id, data } = action.payload;

    try {
      // Validate API client
      if (!apiClient.update) {
        throw new Error(`API client update method not provided for ${entityName}`);
      }

      // Execute beforeUpdate hook (either from hooks or confirmation)
      // Confirmation takes precedence if both are provided
      if (confirmation) {
        const confirmHook = createConfirmationHook(confirmation);
        const shouldContinue = (yield* confirmHook({ id, data })) as boolean;
        if (!shouldContinue) {
          // Update cancelled by user
          return;
        }
      } else if (hooks?.beforeUpdate) {
        const shouldContinue = (yield* hooks.beforeUpdate(id, data)) as boolean;
        if (!shouldContinue) {
          // Update cancelled by beforeUpdate hook
          return;
        }
      }

      // Call API to update
      const entity = (yield call(apiClient.update, id, data)) as TEntity;

      // Update in entity store
      yield put(entityActions.updateOne({ id: entity.id, changes: entity }));

      // Dispatch success action with ID for entity-level state tracking
      if (actions.updateSuccess) {
        yield put(actions.updateSuccess({ id, [entityName.toLowerCase()]: entity }));
      }

      // Show success message
      const successMessage = messages?.updateSuccess || `${entityName} updated successfully`;
      yield put(notify({ message: successMessage, variant: 'success' }));

      // Execute afterUpdate hook
      if (hooks?.afterUpdate) {
        yield* hooks.afterUpdate(entity);
      }

      // Navigate if configured
      if (navigation?.afterUpdate) {
        const navigate = (yield call(getNavigate)) as (path: string) => void;
        yield call(navigate, navigation.afterUpdate);
      }

      // Refetch list if configured
      if (refetchAfterMutation && actions.fetchRequest) {
        yield put(actions.fetchRequest());
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.updateError || `Failed to update ${entityName.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'update',
          error instanceof Error ? error : new Error(errorMessage),
          { id }
        );
      }

      // Include ID in failure for entity-level error tracking
      if (actions.updateFailure) {
        yield put(actions.updateFailure({ error: errorMessage, id }));
      }

      yield put(notify({ message: errorMessage, variant: 'error' }));
    }
  };
}
