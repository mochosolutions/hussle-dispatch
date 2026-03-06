import { PayloadAction } from '@reduxjs/toolkit';
import { createFetchAllSaga } from './fetchAllSaga';
import { createFetchByIdSaga } from './fetchByIdSaga';
import { createCreateSaga } from './createSaga';
import { createUpdateSaga } from './updateSaga';
import { createDeleteSaga } from './deleteSaga';
import { createUpdateManySaga } from './updateManySaga';
import { createDeleteManySaga } from './deleteManySaga';
import type { CrudSagaConfig, CrudSagas } from './types';

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
export function createCrudSagas<
  TEntity extends { id: string },
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>
>(config: CrudSagaConfig<TEntity, TCreateInput, TUpdateInput>): CrudSagas<TCreateInput, TUpdateInput> {
  const {
    entityName,
    entityNamePlural,
    apiClient,
    actions,
    entityActions,
    navigation,
    normalization,
    messages,
    refetchAfterMutation = false,
    hooks,
    confirmation,
    bulkActions,
  } = config;

  // Create individual sagas
  const fetchAll = createFetchAllSaga({
    entityName,
    entityNamePlural,
    apiClient: { getAll: apiClient.getAll },
    actions: {
      fetchSuccess: actions.fetchSuccess,
      fetchFailure: actions.fetchFailure,
    },
    entityActions: {
      addMany: entityActions.addMany,
      setAll: entityActions.setAll,
    },
    normalization,
    messages: { fetchError: messages?.fetchError },
    hooks: {
      beforeFetchAll: hooks?.beforeFetchAll,
      afterFetchAll: hooks?.afterFetchAll,
      onError: hooks?.onError,
    },
  });

  const fetchById = createFetchByIdSaga({
    entityName,
    apiClient: { getById: apiClient.getById },
    actions: {
      fetchByIdSuccess: actions.fetchByIdSuccess,
      fetchByIdFailure: actions.fetchByIdFailure,
    },
    entityActions: { addOne: entityActions.addOne },
    messages: { fetchError: messages?.fetchError },
    hooks: {
      beforeFetchById: hooks?.beforeFetchById,
      afterFetchById: hooks?.afterFetchById,
      onError: hooks?.onError,
    },
  });

  const create = createCreateSaga<TEntity, TCreateInput>({
    entityName,
    apiClient: { create: apiClient.create },
    actions: {
      fetchRequest: actions.fetchRequest,
      createSuccess: actions.createSuccess,
      createFailure: actions.createFailure,
    },
    entityActions: { addOne: entityActions.addOne },
    navigation: { afterCreate: navigation?.afterCreate },
    messages: {
      createSuccess: messages?.createSuccess,
      createError: messages?.createError,
    },
    refetchAfterMutation,
    hooks: {
      beforeCreate: hooks?.beforeCreate,
      afterCreate: hooks?.afterCreate,
      onError: hooks?.onError,
    },
  });

  const update = createUpdateSaga<TEntity, TUpdateInput>({
    entityName,
    apiClient: { update: apiClient.update },
    actions: {
      fetchRequest: actions.fetchRequest,
      updateSuccess: actions.updateSuccess,
      updateFailure: actions.updateFailure,
    },
    entityActions: { updateOne: entityActions.updateOne },
    navigation: { afterUpdate: navigation?.afterUpdate },
    messages: {
      updateSuccess: messages?.updateSuccess,
      updateError: messages?.updateError,
    },
    refetchAfterMutation,
    hooks: {
      beforeUpdate: hooks?.beforeUpdate,
      afterUpdate: hooks?.afterUpdate,
      onError: hooks?.onError,
    },
    confirmation: confirmation?.update,
  });

  const remove = createDeleteSaga({
    entityName,
    apiClient: { delete: apiClient.delete },
    actions: {
      fetchRequest: actions.fetchRequest,
      deleteSuccess: actions.deleteSuccess,
      deleteFailure: actions.deleteFailure,
    },
    entityActions: { removeOne: entityActions.removeOne },
    navigation: { afterDelete: navigation?.afterDelete },
    messages: {
      deleteSuccess: messages?.deleteSuccess,
      deleteError: messages?.deleteError,
    },
    refetchAfterMutation,
    hooks: {
      beforeDelete: hooks?.beforeDelete,
      afterDelete: hooks?.afterDelete,
      onError: hooks?.onError,
    },
    confirmation: confirmation?.delete,
  });

  // Build result object
  const result: CrudSagas<TCreateInput, TUpdateInput> = {
    fetchAll,
    fetchById,
    create,
    update,
    delete: remove, // 'delete' is a reserved keyword, use 'remove' internally
  };

  // Add bulk operations if bulkActions are configured
  if (bulkActions) {
    if (bulkActions.updateManySuccess || bulkActions.updateManyFailure) {
      result.updateMany = createUpdateManySaga<TUpdateInput>({
        entityName,
        entityNamePlural,
        apiClient: { updateMany: apiClient.updateMany },
        actions: { fetchRequest: actions.fetchRequest },
        bulkActions: {
          updateManySuccess: bulkActions.updateManySuccess,
          updateManyFailure: bulkActions.updateManyFailure,
        },
        navigation: { afterUpdateMany: navigation?.afterUpdateMany },
        messages: {
          updateManySuccess: messages?.updateManySuccess,
          updateManyError: messages?.updateManyError,
        },
        refetchAfterMutation,
        hooks: {
          beforeUpdateMany: hooks?.beforeUpdateMany,
          afterUpdateMany: hooks?.afterUpdateMany,
          onError: hooks?.onError,
        },
        confirmation: confirmation?.updateMany,
      });
    }

    if (bulkActions.deleteManySuccess || bulkActions.deleteManyFailure) {
      result.deleteMany = createDeleteManySaga({
        entityName,
        entityNamePlural,
        apiClient: { deleteMany: apiClient.deleteMany },
        actions: { fetchRequest: actions.fetchRequest },
        bulkActions: {
          deleteManySuccess: bulkActions.deleteManySuccess,
          deleteManyFailure: bulkActions.deleteManyFailure,
        },
        entityActions: { removeMany: entityActions.removeMany },
        navigation: { afterDeleteMany: navigation?.afterDeleteMany },
        messages: {
          deleteManySuccess: messages?.deleteManySuccess,
          deleteManyError: messages?.deleteManyError,
        },
        refetchAfterMutation,
        hooks: {
          beforeDeleteMany: hooks?.beforeDeleteMany,
          afterDeleteMany: hooks?.afterDeleteMany,
          onError: hooks?.onError,
        },
        confirmation: confirmation?.deleteMany,
      });
    }
  }

  return result;
}
