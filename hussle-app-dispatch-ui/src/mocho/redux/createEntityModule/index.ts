import {
  EntityAdapter,
  createSlice,
  Slice,
  SliceCaseReducers,
  EntityState,
  PayloadAction,
  createEntityAdapter,
} from '@reduxjs/toolkit';

interface EntityModuleState extends EntityState<unknown, string> {
  loading: boolean;
  error: string | null;
}

interface EntityModule<
  T,
  S extends EntityModuleState = EntityModuleState,
  CaseReducers extends SliceCaseReducers<S> = SliceCaseReducers<S>
> {
  adapter: EntityAdapter<T, string>;
  slice: Slice<S, CaseReducers>;
  actions: Slice<S, CaseReducers>['actions'];
  reducer: Slice<S, CaseReducers>['reducer'];
  selectors: ReturnType<EntityAdapter<T, string>['getSelectors']>;
}

/**
 * Factory function to create a normalized entity Redux module.
 *
 * Creates an entity adapter with standard CRUD actions:
 * - addOne, addMany, setAll
 * - updateOne, updateMany
 * - removeOne, removeMany
 * - setLoading, setError
 *
 * Also provides memoized selectors:
 * - selectAll, selectById, selectIds, selectEntities
 *
 * @param entityName - Name of the entity (used as slice name and for state path)
 * @param selectId - Optional custom ID selector (defaults to entity.id)
 * @param sortComparer - Optional sort comparer for ordered storage
 *
 * @example
 * ```typescript
 * export const postsModule = createEntityModule<Post>('posts', (p) => p.id);
 * export const postsActions = postsModule.actions;
 * export const postsReducer = postsModule.reducer;
 * export const postsSelectors = postsModule.selectors;
 * ```
 */
export function createEntityModule<T extends { id: string }>(
  entityName: string,
  selectId?: (entity: T) => string,
  sortComparer?: (a: T, b: T) => number
): EntityModule<T> {
  const adapter = createEntityAdapter<T>({
    ...(selectId ? { selectId } : {}),
    sortComparer,
  });

  const initialState = adapter.getInitialState({
    loading: false,
    error: null as string | null,
  });

  const slice = createSlice({
    name: entityName,
    initialState,
    reducers: {
      addOne: (state, action) => adapter.addOne(state, action),
      addMany: (state, action) => adapter.addMany(state, action),
      setAll: (state, action) => adapter.setAll(state, action),
      updateOne: (state, action) => adapter.updateOne(state, action),
      updateMany: (state, action) => adapter.updateMany(state, action),
      removeOne: (state, action) => adapter.removeOne(state, action),
      removeMany: (state, action) => adapter.removeMany(state, action),
      setLoading(state, action: PayloadAction<boolean>) {
        state.loading = action.payload;
      },
      setError(state, action: PayloadAction<string | null>) {
        state.error = action.payload;
      },
    },
  });

  // Note: The state path 'entities[entityName]' should match your root reducer structure
  const selectors = adapter.getSelectors<{ entities: Record<string, EntityState<T, string>> }>(
    (state) => state.entities[entityName] || initialState
  );

  return {
    adapter,
    slice,
    actions: slice.actions,
    reducer: slice.reducer,
    selectors,
  } as unknown as EntityModule<T>;
}
