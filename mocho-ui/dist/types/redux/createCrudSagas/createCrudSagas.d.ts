import { CrudSagaConfig, CrudSagas } from './types';
/**
 * Factory function to create CRUD sagas for an entity
 *
 * Generates standardized sagas for:
 * - Fetch all entities
 * - Fetch single entity by ID
 * - Create entity
 * - Update entity
 * - Delete entity
 * - Bulk update entities (optional)
 * - Bulk delete entities (optional)
 *
 * Each saga includes:
 * - API call handling
 * - Redux state updates
 * - Toast notifications
 * - Navigation (optional)
 * - Error handling
 * - Data normalization (optional)
 * - Lifecycle hooks (before/after/error)
 * - Confirmation dialogs (optional)
 *
 * @template TEntity - The entity type (e.g., Post, Author, Category)
 * @template TCreateInput - Input type for create operation
 * @template TUpdateInput - Input type for update operation
 * @param config - Configuration for the CRUD sagas
 * @returns Object containing all CRUD saga generators
 *
 * @example
 * ```typescript
 * const authorSagas = createCrudSagas({
 *   entityName: 'Author',
 *   entityNamePlural: 'Authors',
 *   apiClient: blogApi,
 *   actions: authorActions,
 *   entityActions: authorsEntityActions,
 *   navigation: { afterCreate: '/authors', afterUpdate: '/authors' },
 *   confirmation: {
 *     delete: {
 *       title: 'Delete Author',
 *       message: 'This will also delete all posts by this author.',
 *       confirmActionType: 'CONFIRM_DELETE_AUTHOR',
 *       severity: 'error',
 *     },
 *   },
 *   hooks: {
 *     afterDelete: function* (id, result) {
 *       if (result?.deletedPostIds?.length > 0) {
 *         yield put(postsActions.removeMany(result.deletedPostIds));
 *       }
 *     },
 *   },
 * });
 *
 * // Use in saga watcher
 * yield takeLatest(authorActions.fetchRequest.type, authorSagas.fetchAll);
 * yield takeLatest(authorActions.createRequest.type, authorSagas.create);
 * yield takeLatest(authorActions.deleteRequest.type, authorSagas.delete);
 * ```
 */
export declare function createCrudSagas<TEntity extends {
    id: string;
}, TCreateInput = Partial<TEntity>, TUpdateInput = Partial<TEntity>>(config: CrudSagaConfig<TEntity, TCreateInput, TUpdateInput>): CrudSagas<TCreateInput, TUpdateInput>;
//# sourceMappingURL=createCrudSagas.d.ts.map