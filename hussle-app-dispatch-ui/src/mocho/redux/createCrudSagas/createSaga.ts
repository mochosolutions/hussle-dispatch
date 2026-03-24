import { call, put, Effect } from 'redux-saga/effects';
import { PayloadAction } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notistack';
import { getNavigate } from '../../utils/getNavigate';
import type {
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  EntityActions,
  CrudMessages,
  NavigationConfig,
} from './types';

interface CreateSagaConfig<
  TEntity extends { id: string },
  TCreateInput = Partial<TEntity>
> {
  entityName: string;
  apiClient: Pick<CrudApiClient<TEntity, TCreateInput>, 'create'>;
  actions: Pick<CrudActions<TEntity>, 'fetchRequest' | 'createSuccess' | 'createFailure'>;
  entityActions: Pick<EntityActions<TEntity>, 'addOne'>;
  navigation?: Pick<NavigationConfig, 'afterCreate'>;
  messages?: Pick<CrudMessages, 'createSuccess' | 'createError'>;
  refetchAfterMutation?: boolean;
  hooks?: Pick<
    LifecycleHooks<TEntity, TCreateInput>,
    'beforeCreate' | 'afterCreate' | 'onError'
  >;
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
export function createCreateSaga<
  TEntity extends { id: string },
  TCreateInput = Partial<TEntity>
>(config: CreateSagaConfig<TEntity, TCreateInput>) {
  const {
    entityName,
    apiClient,
    actions,
    entityActions,
    navigation,
    messages,
    refetchAfterMutation = false,
    hooks,
  } = config;

  return function* create(
    action: PayloadAction<{ data: TCreateInput }>
  ): Generator<Effect, void, unknown> {
    try {
      // Validate API client
      if (!apiClient.create) {
        throw new Error(`API client create method not provided for ${entityName}`);
      }

      const { data } = action.payload;

      // Execute beforeCreate hook
      if (hooks?.beforeCreate) {
        const shouldContinue = (yield* hooks.beforeCreate(data)) as boolean;
        if (!shouldContinue) {
          return;
        }
      }

      // Call API
      const entity = (yield call(apiClient.create, data)) as TEntity;

      // Add to entity store
      yield put(entityActions.addOne(entity));

      // Dispatch success action
      if (actions.createSuccess) {
        yield put(actions.createSuccess({ [entityName.toLowerCase()]: entity }));
      }

      // Show success message
      const successMessage = messages?.createSuccess || `${entityName} created successfully`;
      yield call(enqueueSnackbar, successMessage, { variant: 'success' });

      // Execute afterCreate hook
      if (hooks?.afterCreate) {
        yield* hooks.afterCreate(entity);
      }

      // Navigate if configured
      if (navigation?.afterCreate) {
        const navigate = (yield call(getNavigate)) as (path: string) => void;
        yield call(navigate, navigation.afterCreate);
      }

      // Refetch list if configured
      if (refetchAfterMutation && actions.fetchRequest) {
        yield put(actions.fetchRequest());
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.createError || `Failed to create ${entityName.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'create',
          error instanceof Error ? error : new Error(errorMessage)
        );
      }

      if (actions.createFailure) {
        yield put(actions.createFailure({ error: errorMessage }));
      }

      yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
    }
  };
}
