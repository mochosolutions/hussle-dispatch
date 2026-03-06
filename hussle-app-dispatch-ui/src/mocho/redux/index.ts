// Entity module factory
export { createEntityModule } from './createEntityModule';

// CRUD slice factory and selectors
export {
  createCrudSlice,
  createCrudSelectors,
  getCrudActionNames,
  type CrudSliceConfig,
  type CrudPageState,
  type CrudOperation,
  type CrudSliceGeneratedActions,
  type CrudSliceActions,
  type FetchAllRequestPayload,
  type FetchByIdRequestPayload,
  type FetchByIdSuccessPayload,
  type CreateRequestPayload,
  type UpdateRequestPayload,
  type UpdateSuccessPayload,
  type DeleteRequestPayload,
  type DeleteSuccessPayload,
  type FailurePayload,
} from './createCrudSlice';

// Slice helpers
export {
  setPending,
  setFulfilled,
  setRejected,
  ensureMaps,
  type HasLoadingAndErrors,
} from './createCrudSlice/sliceHelpers';

// Types
export { LoadingState } from './types/loadingState';
