import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import type {
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  EntityActions,
  CrudMessages,
} from './types';

interface FetchByIdSagaConfig<TEntity extends { id: string }> {
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
export function createFetchByIdSaga<TEntity extends { id: string }>(
  config: FetchByIdSagaConfig<TEntity>
) {
  const { entityName, apiClient, actions, entityActions, messages, hooks } = config;

  return function* fetchById(
    action: PayloadAction<{ id: string }>
  ): Generator<Effect, void, unknown> {
    const { id } = action.payload;

    try {
      // Validate API client
      if (!apiClient.getById) {
        throw new Error(`API client getById method not provided for ${entityName}`);
      }

      // Execute beforeFetchById hook
      if (hooks?.beforeFetchById) {
        const shouldContinue = (yield* hooks.beforeFetchById(id)) as boolean;
        if (!shouldContinue) {
          // Fetch by ID cancelled by beforeFetchById hook
          return;
        }
      }

      // Call API
      const entity = (yield call(apiClient.getById, id)) as TEntity;

      // Add to entity store
      yield put(entityActions.addOne(entity));

      // Dispatch success action with ID for entity-level state tracking
      if (actions.fetchByIdSuccess) {
        yield put(actions.fetchByIdSuccess({ id, [entityName.toLowerCase()]: entity }));
      }

      // Execute afterFetchById hook
      if (hooks?.afterFetchById) {
        yield* hooks.afterFetchById(entity);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.fetchError || `Failed to fetch ${entityName.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'fetchById',
          error instanceof Error ? error : new Error(errorMessage),
          { id }
        );
      }

      // Include ID in failure for entity-level error tracking
      if (actions.fetchByIdFailure) {
        yield put(actions.fetchByIdFailure({ error: errorMessage, id }));
      }
    }
  };
}
