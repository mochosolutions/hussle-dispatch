/**
 * CRUD Sagas Factory
 *
 * This module provides a factory function to generate standardized Redux-Saga
 * generators for CRUD operations with:
 * - Complete lifecycle hooks (before/after/error)
 * - Confirmation dialogs
 * - Data normalization
 * - Navigation
 * - Toast notifications
 * - Entity-level state tracking
 * - Bulk operations (updateMany, deleteMany)
 *
 * @example
 * ```typescript
 * import { createCrudSagas } from 'utils/redux/createCrudSagas';
 *
 * const authorSagas = createCrudSagas({
 *   entityName: 'Author',
 *   entityNamePlural: 'Authors',
 *   apiClient: blogApi,
 *   actions: authorActions,
 *   entityActions: authorsEntityActions,
 *   hooks: {
 *     afterDelete: function* (id, result) {
 *       if (result?.deletedPostIds?.length > 0) {
 *         yield put(postsActions.removeMany(result.deletedPostIds));
 *       }
 *     },
 *   },
 * });
 * ```
 */

// =============================================================================
// Types
// =============================================================================
export type {
  // Core types
  CrudOperation,
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
} from './types';

// =============================================================================
// Hooks
// =============================================================================
export { createConfirmationHook } from './createConfirmationHook';

// =============================================================================
// Individual Saga Factories (for advanced usage)
// =============================================================================
export { createFetchAllSaga } from './fetchAllSaga';
export { createFetchByIdSaga } from './fetchByIdSaga';
export { createCreateSaga } from './createSaga';
export { createUpdateSaga } from './updateSaga';
export { createDeleteSaga } from './deleteSaga';

// =============================================================================
// Bulk Saga Factories
// =============================================================================
export { createUpdateManySaga } from './updateManySaga';
export { createDeleteManySaga } from './deleteManySaga';

// =============================================================================
// Main Factory (recommended)
// =============================================================================
export { createCrudSagas } from './createCrudSagas';
