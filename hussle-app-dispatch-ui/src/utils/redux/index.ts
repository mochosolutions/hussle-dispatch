/**
 * Redux Utilities
 *
 * Factory functions and helpers for generating Redux boilerplate.
 *
 * @module redux
 */

// CRUD Sagas
export {
  // Main factory (recommended)
  createCrudSagas,
  // Individual saga factories (for advanced usage)
  createFetchAllSaga,
  createFetchByIdSaga,
  createCreateSaga,
  createUpdateSaga,
  createDeleteSaga,
  createUpdateManySaga,
  createDeleteManySaga,
  // Hooks
  createConfirmationHook,
} from './createCrudSagas';

export type {
  // Core types
  CrudOperation as SagaCrudOperation, // Aliased to avoid conflict with createCrudSlice's CrudOperation
  CrudSagaConfig,
  CrudSagas,
  // Result types
  BulkDeleteResult,
  BulkUpdateResult,
  DeleteResult,
  // Config types
  ConfirmationConfig,
  LifecycleHooks,
  CrudApiClient,
  CrudActions,
  BulkActions,
  EntityActions,
  NormalizationConfig,
  CrudMessages,
  NavigationConfig,
} from './createCrudSagas';

export { createCrudSlice, getCrudActionNames } from 'mocho/redux';
export type {
  CrudSliceConfig,
  CrudSliceActions,
  CrudPageState,
  CrudOperation,
} from 'mocho/redux';
