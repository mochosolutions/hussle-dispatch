import { EntityAdapter, createSlice, Slice, SliceCaseReducers, EntityState, PayloadAction, createEntityAdapter } from '@reduxjs/toolkit';


interface EntityModule<T, S = any, CaseReducers extends SliceCaseReducers<S> = SliceCaseReducers<S>> {
  adapter: EntityAdapter<T, string>;
  slice: Slice<S, CaseReducers>;
  actions: Slice<S, CaseReducers>['actions'];
  reducer: Slice<S, CaseReducers>['reducer'];
  selectors: ReturnType<EntityAdapter<T, string>['getSelectors']>;
}

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
      // Add more custom reducers if needed
    },
  });

  const selectors = adapter.getSelectors<any>((state: any) => state.entities[entityName]);

  return {
    adapter,
    slice,
    actions: slice.actions,
    reducer: slice.reducer,
    selectors,
  };
}