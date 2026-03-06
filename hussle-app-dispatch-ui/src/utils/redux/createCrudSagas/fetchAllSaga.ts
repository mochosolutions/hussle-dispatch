import { call, put, Effect } from 'redux-saga/effects';
import { normalize } from 'normalizr';
import type {
  CrudSagaConfig,
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  EntityActions,
  NormalizationConfig,
  CrudMessages,
} from './types';

interface FetchAllSagaConfig<TEntity extends { id: string }> {
  entityName: string;
  entityNamePlural: string;
  apiClient: Pick<CrudApiClient<TEntity>, 'getAll'>;
  actions: Pick<CrudActions<TEntity>, 'fetchSuccess' | 'fetchFailure'>;
  entityActions: Pick<EntityActions<TEntity>, 'addMany' | 'setAll'>;
  normalization?: NormalizationConfig;
  messages?: Pick<CrudMessages, 'fetchError'>;
  hooks?: Pick<LifecycleHooks<TEntity>, 'beforeFetchAll' | 'afterFetchAll' | 'onError'>;
}

/**
 * Creates a fetchAll saga with complete lifecycle hooks
 *
 * @template TEntity - The entity type
 * @param config - Configuration for the saga
 * @returns A generator function for fetching all entities
 *
 * @example
 * ```typescript
 * const fetchAll = createFetchAllSaga({
 *   entityName: 'Post',
 *   entityNamePlural: 'Posts',
 *   apiClient: { getAll: blogApi.getPosts },
 *   actions: postActions,
 *   entityActions: postsEntityActions,
 *   hooks: {
 *     beforeFetchAll: function* () {
 *       console.log('About to fetch posts');
 *       return true; // Continue with fetch
 *     },
 *     afterFetchAll: function* (posts) {
 *       console.log(`Fetched ${posts.length} posts`);
 *     },
 *   },
 * });
 * ```
 */
export function createFetchAllSaga<TEntity extends { id: string }>(
  config: FetchAllSagaConfig<TEntity>
) {
  const {
    entityName,
    entityNamePlural,
    apiClient,
    actions,
    entityActions,
    normalization,
    messages,
    hooks,
  } = config;

  return function* fetchAll(): Generator<Effect, void, unknown> {
    try {
      // Validate API client
      if (!apiClient.getAll) {
        throw new Error(`API client getAll method not provided for ${entityName}`);
      }

      // Execute beforeFetchAll hook
      if (hooks?.beforeFetchAll) {
        const shouldContinue = (yield* hooks.beforeFetchAll()) as boolean;
        if (!shouldContinue) {
          console.log(`${entityNamePlural} fetch cancelled by beforeFetchAll hook`);
          return;
        }
      }

      // Call API
      const response = (yield call(apiClient.getAll)) as TEntity[] | { docs: TEntity[] };

      // Handle response format - could be array or { docs: [] }
      const entities = Array.isArray(response) ? response : response.docs;

      // Handle normalization if configured
      if (normalization) {
        const normalized = normalize(entities, [normalization.schema]);

        // Extract entities from normalized data
        const entityKey = normalization.schema.key;
        const normalizedEntities = normalized.entities[entityKey] || {};
        const entitiesArray = Object.values(normalizedEntities) as TEntity[];

        // Add to entity store
        yield put(entityActions.addMany(entitiesArray));

        // Handle related entities if handler provided
        if (normalization.handleRelatedEntities) {
          // Cast the normalizr entities type to match our interface
          const normalizedData = normalized.entities as Record<string, Record<string, unknown>>;
          yield* normalization.handleRelatedEntities(normalizedData);
        }

        // Dispatch success action
        if (actions.fetchSuccess) {
          yield put(
            actions.fetchSuccess({ [entityNamePlural.toLowerCase()]: entitiesArray })
          );
        }

        // Execute afterFetchAll hook with normalized data
        if (hooks?.afterFetchAll) {
          yield* hooks.afterFetchAll(entitiesArray);
        }
      } else {
        // No normalization - direct store update
        yield put(entityActions.setAll(entities));

        if (actions.fetchSuccess) {
          yield put(actions.fetchSuccess({ [entityNamePlural.toLowerCase()]: entities }));
        }

        // Execute afterFetchAll hook
        if (hooks?.afterFetchAll) {
          yield* hooks.afterFetchAll(entities);
        }
      }
    } catch (error: unknown) {
      console.error(`fetch${entityNamePlural}Saga error:`, error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : messages?.fetchError || `Failed to fetch ${entityNamePlural.toLowerCase()}`;

      // Execute onError hook
      if (hooks?.onError) {
        yield* hooks.onError(
          'fetchAll',
          error instanceof Error ? error : new Error(errorMessage)
        );
      }

      if (actions.fetchFailure) {
        yield put(actions.fetchFailure({ error: errorMessage }));
      }
    }
  };
}
