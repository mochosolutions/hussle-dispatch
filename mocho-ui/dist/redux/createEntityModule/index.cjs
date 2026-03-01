"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const toolkit = require("@reduxjs/toolkit");
function createEntityModule(entityName, selectId, sortComparer) {
  const adapter = toolkit.createEntityAdapter({
    ...selectId ? {
      selectId
    } : {},
    sortComparer
  });
  const initialState = adapter.getInitialState({
    loading: false,
    error: null
  });
  const slice = toolkit.createSlice({
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
      setLoading(state, action) {
        state.loading = action.payload;
      },
      setError(state, action) {
        state.error = action.payload;
      }
    }
  });
  const selectors = adapter.getSelectors((state) => state.entities[entityName] || initialState);
  return {
    adapter,
    slice,
    actions: slice.actions,
    reducer: slice.reducer,
    selectors
  };
}
exports.createEntityModule = createEntityModule;
//# sourceMappingURL=index.cjs.map
