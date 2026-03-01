import { SliceCaseReducers, ActionCreatorWithPayload } from '@reduxjs/toolkit';
/** Payload for fetching all entities (no parameters needed) */
export interface FetchAllRequestPayload {
}
/** Payload for fetching a single entity by ID */
export interface FetchByIdRequestPayload {
    id: string;
}
/** Payload for fetching by ID success (includes ID for state tracking) */
export interface FetchByIdSuccessPayload {
    id: string;
}
/** Payload for creating an entity */
export interface CreateRequestPayload<TData> {
    data: TData;
}
/** Payload for updating an entity */
export interface UpdateRequestPayload<TData> {
    id: string;
    data: TData;
}
/** Payload for update success (includes ID for state tracking) */
export interface UpdateSuccessPayload {
    id: string;
}
/** Payload for deleting an entity */
export interface DeleteRequestPayload {
    id: string;
}
/** Payload for delete success */
export interface DeleteSuccessPayload {
    id: string;
}
/** Payload for failure actions (optional ID for entity-level errors) */
export interface FailurePayload {
    error: string;
    id?: string;
}
/**
 * Standard CRUD operation keys for loading and error state tracking
 */
export type CrudOperation = 'getAll' | 'getById' | 'create' | 'update' | 'delete';
/**
 * State shape for CRUD page slices
 *
 * Loading and error states use composite keys for entity-level tracking:
 * - Operation-level: 'getAll', 'create'
 * - Entity-level: 'getById:123', 'update:456', 'delete:789'
 */
export interface CrudPageState {
    /** Search/filter query string */
    query: string;
    /**
     * Error messages keyed by operation or operation:entityId
     * Examples: 'getAll', 'getById:123', 'update:456'
     */
    errors: Record<string, string>;
    /**
     * Loading states keyed by operation or operation:entityId
     * Examples: 'getAll', 'getById:123', 'delete:789'
     */
    loading: Record<string, string>;
}
/**
 * Type-safe interface for generated CRUD actions
 */
export interface CrudSliceGeneratedActions<TCreateData = Record<string, unknown>, TUpdateData = Record<string, unknown>> {
    fetchAllRequest: ActionCreatorWithPayload<FetchAllRequestPayload | void>;
    fetchAllSuccess: ActionCreatorWithPayload<unknown>;
    fetchAllFailure: ActionCreatorWithPayload<FailurePayload>;
    fetchByIdRequest: ActionCreatorWithPayload<FetchByIdRequestPayload>;
    fetchByIdSuccess: ActionCreatorWithPayload<FetchByIdSuccessPayload>;
    fetchByIdFailure: ActionCreatorWithPayload<FailurePayload>;
    createRequest: ActionCreatorWithPayload<CreateRequestPayload<TCreateData>>;
    createSuccess: ActionCreatorWithPayload<unknown>;
    createFailure: ActionCreatorWithPayload<FailurePayload>;
    updateRequest: ActionCreatorWithPayload<UpdateRequestPayload<TUpdateData>>;
    updateSuccess: ActionCreatorWithPayload<UpdateSuccessPayload>;
    updateFailure: ActionCreatorWithPayload<FailurePayload>;
    deleteRequest: ActionCreatorWithPayload<DeleteRequestPayload>;
    deleteSuccess: ActionCreatorWithPayload<DeleteSuccessPayload>;
    deleteFailure: ActionCreatorWithPayload<FailurePayload>;
}
/**
 * Creates typed selectors for accessing CRUD loading and error states
 *
 * @param sliceSelector - Function to select the CRUD slice state from root state
 * @returns Object with selector functions for loading and error states
 *
 * @example
 * ```typescript
 * const categoryPageSelectors = createCrudSelectors(
 *   (state: RootState) => state.pages.categoryPage
 * );
 *
 * // Usage in component
 * const isLoading = useSelector(categoryPageSelectors.selectIsEntityLoading('getById', categoryId));
 * const error = useSelector(categoryPageSelectors.selectEntityError('getById', categoryId));
 * ```
 */
export declare function createCrudSelectors<TRootState>(sliceSelector: (state: TRootState) => CrudPageState): {
    /**
     * Select loading state for an operation (e.g., 'getAll', 'create')
     */
    selectIsLoading: (operation: CrudOperation) => (state: TRootState) => boolean;
    /**
     * Select loading state for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectIsEntityLoading: (operation: CrudOperation, entityId: string) => (state: TRootState) => boolean;
    /**
     * Select error message for an operation
     */
    selectError: (operation: CrudOperation) => (state: TRootState) => string;
    /**
     * Select error message for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectEntityError: (operation: CrudOperation, entityId: string) => (state: TRootState) => string;
    /**
     * Select loading state value (returns the LoadingState string)
     */
    selectLoadingState: (operation: CrudOperation) => (state: TRootState) => string;
    /**
     * Select loading state value for entity-specific operation
     */
    selectEntityLoadingState: (operation: CrudOperation, entityId: string) => (state: TRootState) => string;
};
/**
 * Configuration for CRUD slice generation
 */
export interface CrudSliceConfig {
    /** Name of the slice (e.g., 'blogPage', 'jobsPage') */
    name: string;
    /** Operations to generate reducers for (default: all CRUD operations) */
    operations?: CrudOperation[];
    /** Additional custom reducers to include in the slice */
    extraReducers?: SliceCaseReducers<CrudPageState>;
    /** Custom initial state to merge with default state */
    initialState?: Partial<CrudPageState>;
    /** Entity name for payload types (e.g., 'post', 'author') - lowercase singular */
    entityName?: string;
    /** Entity name plural for list payloads (e.g., 'posts', 'authors') - lowercase */
    entityNamePlural?: string;
}
/**
 * Factory function to create a CRUD Redux slice with typed actions
 *
 * Generates a slice with request/success/failure reducers for:
 * - Fetch all entities (getAll) - operation-level state
 * - Fetch single entity (getById) - entity-level state
 * - Create entity (create) - operation-level state
 * - Update entity (update) - entity-level state
 * - Delete entity (delete) - entity-level state
 *
 * Entity-level state uses composite keys like 'getById:123' for per-entity tracking.
 *
 * @example
 * ```typescript
 * const categoryPageSlice = createCrudSlice({
 *   name: 'categoryPage',
 *   entityName: 'category',
 *   entityNamePlural: 'categories',
 * });
 *
 * export const {
 *   fetchCategoriesRequest,
 *   fetchCategoriesSuccess,
 *   fetchCategoriesFailure,
 *   // ... etc
 * } = categoryPageSlice.actions;
 * ```
 */
export declare function createCrudSlice(config: CrudSliceConfig): import('@reduxjs/toolkit').Slice<CrudPageState, never, string, string, import('@reduxjs/toolkit').SliceSelectors<CrudPageState>>;
/**
 * Helper to create action names for external use
 * Useful for documentation or generating watcher functions
 */
export declare function getCrudActionNames(entityName: string, entityNamePlural: string): {
    fetchRequest: string;
    fetchSuccess: string;
    fetchFailure: string;
    fetchByIdRequest: string;
    fetchByIdSuccess: string;
    fetchByIdFailure: string;
    createRequest: string;
    createSuccess: string;
    createFailure: string;
    updateRequest: string;
    updateSuccess: string;
    updateFailure: string;
    deleteRequest: string;
    deleteSuccess: string;
    deleteFailure: string;
};
/**
 * Type helper to extract action creators from a CRUD slice
 */
export type CrudSliceActions = ReturnType<typeof createCrudSlice>['actions'];
//# sourceMappingURL=index.d.ts.map