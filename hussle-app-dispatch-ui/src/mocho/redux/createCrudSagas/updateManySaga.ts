import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from '../../utils/getNavigate';
import { createConfirmationHook } from './createConfirmationHook';
import type {
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  BulkActions,
  CrudMessages,
  NavigationConfig,
  ConfirmationConfig,
  BulkUpdateResult,
} from './types';

interface UpdateManySagaConfig<TUpdateInput = unknown> {
  entityName: string;
  entityNamePlural: string;
  apiClient: Pick<CrudApiClient<unknown, unknown, TUpdateInput>, 'updateMany'>;
  actions?: Pick<CrudActions<unknown>, 'fetchRequest'>;
  bulkActions: Pick<BulkActions<TUpdateInput>, 'updateManySuccess' | 'updateManyFailure'>;
  navigation?: Pick<NavigationConfig, 'afterUpdateMany'>;
  messages?: Pick<CrudMessages, 'updateManySuccess' | 'updateManyError'>;
  refetchAfterMutation?: boolean;
  hooks?: Pick<
    LifecycleHooks<unknown, unknown, TUpdateInput>,
    'beforeUpdateMany' | 'afterUpdateMany' | 'onError'
  >;
  confirmation?: ConfirmationConfig<{ ids: string[]; data: TUpdateInput }>;
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
export function createUpdateManySaga<TUpdateInput = unknown>(
  config: UpdateManySagaConfig<TUpdateInput>
) {
  const {
    entityName,
    entityNamePlural,
    apiClient,
    actions,
    bulkActions,
    navigation,
    messages,
    refetchAfterMutation = false,
    hooks,
    confirmation,
  } = config;

  return function* updateMany(
    action: PayloadAction<{ ids: string[]; data: TUpdateInput }>
  ): Generator<Effect, void, unknown> {
    const { ids, data } = action.payload;

    try {
      // Validate API client
      if (!apiClient.updateMany) {
        throw new Error(`API client updateMany method not provided for ${entityName}`);
      }

      // Validate input
      if (!ids || ids.length === 0) {
        console.log(`No ${entityNamePlural.toLowerCase()} to update`);
        return;
      }

      // Execute beforeUpdateMany hook (either from hooks or confirmation)
      if (confirmation) {
        const confirmHook = createConfirmationHook(confirmation);
        const shouldContinue = (yield* confirmHook({ ids, data })) as boolean;
        if (!shouldContinue) {
          console.log(`Bulk ${entityName.toLowerCase()} update cancelled by user`);
          return;
        }
      } else if (hooks?.beforeUpdateMany) {
        const shouldContinue = (yield* hooks.beforeUpdateMany(ids, data)) as boolean;
        if (!shouldContinue) {
          console.log(
            `Bulk ${entityName.toLowerCase()} update cancelled by beforeUpdateMany hook`
          );
          return;
        }
      }

      // Call API to bulk update
      const result = (yield call(apiClient.updateMany, ids, data)) as BulkUpdateResult;

      // Dispatch success action
      if (bulkActions.updateManySuccess) {
        yield put(bulkActions.updateManySuccess(result));
      }

      // Show success message
      const successMessage =
        messages?.updateManySuccess ||
        `Successfully updated ${result.updated} ${result.updated === 1 ? entityName.toLowerCase() : entityNamePlural.toLowerCase()}`;
      yield call(enqueueSnackbar, successMessage, { variant: 'success' });

      // Execute afterUpdateMany hook
      if (hooks?.afterUpdateMany) {
        yield* hooks.afterUpdateMany(result);
      }

      // Navigate if configured
      if (navigation?.afterUpdateMany) {
        const navigate = (yield call(getNavigate)) as (path: string) => void;
        yield call(navigate, navigation.afterUpdateMany);
      }

      // Refetch list if configured
      if (refetchAfterMutation && actions?.fetchRequest) {
        yield put(actions.fetchRequest());
      }
    } catch (error: unknown) {
      console.error(`bulkUpdate${entityNamePlural}Saga error:`, error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.updateManyError ||
            `Failed to update ${entityNamePlural.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'updateMany',
          error instanceof Error ? error : new Error(errorMessage),
          { ids }
        );
      }

      if (bulkActions.updateManyFailure) {
        yield put(bulkActions.updateManyFailure({ error: errorMessage }));
      }

      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    }
  };
}
