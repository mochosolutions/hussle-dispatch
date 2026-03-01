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
export type { CrudOperation, CrudSagaConfig, CrudSagas, BulkDeleteResult, BulkUpdateResult, DeleteResult, ConfirmationConfig, LifecycleHooks, CrudApiClient, CrudActions, BulkActions, EntityActions, NormalizationConfig, CrudMessages, NavigationConfig, } from './types';
export { createConfirmationHook } from './createConfirmationHook';
export { createFetchAllSaga } from './fetchAllSaga';
export { createFetchByIdSaga } from './fetchByIdSaga';
export { createCreateSaga } from './createSaga';
export { createUpdateSaga } from './updateSaga';
export { createDeleteSaga } from './deleteSaga';
export { createUpdateManySaga } from './updateManySaga';
export { createDeleteManySaga } from './deleteManySaga';
export { createCrudSagas } from './createCrudSagas';
//# sourceMappingURL=index.d.ts.map