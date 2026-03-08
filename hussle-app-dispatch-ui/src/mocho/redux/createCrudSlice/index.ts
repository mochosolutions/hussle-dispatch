import {
  createSlice,
  PayloadAction,
  SliceCaseReducers,
  ActionCreatorWithPayload,
} from '@reduxjs/toolkit';
import { setPending, setFulfilled, setRejected } from './sliceHelpers';
import { LoadingState } from '../types/loadingState';

// =============================================================================
// Payload Type Definitions
// =============================================================================

/** Payload for fetching all entities (optional filter/pagination parameters) */
export type FetchAllRequestPayload = Record<string, unknown>;

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

// =============================================================================
// State Types
// =============================================================================

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

// =============================================================================
// Generated Action Types
// =============================================================================

/**
 * Type-safe interface for generated CRUD actions
 */
export interface CrudSliceGeneratedActions<
  TCreateData = Record<string, unknown>,
  TUpdateData = Record<string, unknown>,
> {
  // Fetch all (operation-level)
  fetchAllRequest: ActionCreatorWithPayload<FetchAllRequestPayload>;
  fetchAllSuccess: ActionCreatorWithPayload<unknown>;
  fetchAllFailure: ActionCreatorWithPayload<FailurePayload>;

  // Fetch by ID (entity-level)
  fetchByIdRequest: ActionCreatorWithPayload<FetchByIdRequestPayload>;
  fetchByIdSuccess: ActionCreatorWithPayload<FetchByIdSuccessPayload>;
  fetchByIdFailure: ActionCreatorWithPayload<FailurePayload>;

  // Create (operation-level)
  createRequest: ActionCreatorWithPayload<CreateRequestPayload<TCreateData>>;
  createSuccess: ActionCreatorWithPayload<unknown>;
  createFailure: ActionCreatorWithPayload<FailurePayload>;

  // Update (entity-level)
  updateRequest: ActionCreatorWithPayload<UpdateRequestPayload<TUpdateData>>;
  updateSuccess: ActionCreatorWithPayload<UpdateSuccessPayload>;
  updateFailure: ActionCreatorWithPayload<FailurePayload>;

  // Delete (entity-level)
  deleteRequest: ActionCreatorWithPayload<DeleteRequestPayload>;
  deleteSuccess: ActionCreatorWithPayload<DeleteSuccessPayload>;
  deleteFailure: ActionCreatorWithPayload<FailurePayload>;
}

// =============================================================================
// Selector Helpers
// =============================================================================

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
export function createCrudSelectors<TRootState>(
  sliceSelector: (state: TRootState) => CrudPageState,
) {
  return {
    /**
     * Select loading state for an operation (e.g., 'getAll', 'create')
     */
    selectIsLoading:
      (operation: CrudOperation) =>
      (state: TRootState): boolean =>
        sliceSelector(state).loading[operation] === LoadingState.Pending,

    /**
     * Select loading state for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectIsEntityLoading:
      (operation: CrudOperation, entityId: string) =>
      (state: TRootState): boolean =>
        sliceSelector(state).loading[`${operation}:${entityId}`] === LoadingState.Pending,

    /**
     * Select error message for an operation
     */
    selectError:
      (operation: CrudOperation) =>
      (state: TRootState): string =>
        sliceSelector(state).errors[operation] || '',

    /**
     * Select error message for entity-specific operation
     * Uses composite key format: 'operation:entityId'
     */
    selectEntityError:
      (operation: CrudOperation, entityId: string) =>
      (state: TRootState): string =>
        sliceSelector(state).errors[`${operation}:${entityId}`] || '',

    /**
     * Select loading state value (returns the LoadingState string)
     */
    selectLoadingState:
      (operation: CrudOperation) =>
      (state: TRootState): string =>
        sliceSelector(state).loading[operation] || '',

    /**
     * Select loading state value for entity-specific operation
     */
    selectEntityLoadingState:
      (operation: CrudOperation, entityId: string) =>
      (state: TRootState): string =>
        sliceSelector(state).loading[`${operation}:${entityId}`] || '',
  };
}

// =============================================================================
// Configuration Types
// =============================================================================

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

// =============================================================================
// Factory Function
// =============================================================================

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
export function createCrudSlice(config: CrudSliceConfig) {
  const {
    name,
    operations = ['getAll', 'getById', 'create', 'update', 'delete'],
    extraReducers = {},
    initialState: customInitialState = {},
    entityName = 'entity',
    entityNamePlural = 'entities',
  } = config;

  // Default initial state (empty maps, no pre-seeded keys)
  const initialState: CrudPageState = {
    query: '',
    errors: {},
    loading: {},
    ...customInitialState,
  };

  // Generate reducers for each operation
  const reducers: SliceCaseReducers<CrudPageState> = {};

  // ============================================================================
  // Fetch All (getAll) - Operation-level state
  // ============================================================================
  if (operations.includes('getAll')) {
    reducers.fetchAllRequest = (state, _action: PayloadAction<FetchAllRequestPayload>) => {
      setPending(state, { key: 'getAll' });
    };

    reducers.fetchAllSuccess = (state, _action: PayloadAction<unknown>) => {
      setFulfilled(state, { loadingKey: 'getAll', errorKey: 'getAll' });
    };

    reducers.fetchAllFailure = (state, action: PayloadAction<FailurePayload>) => {
      setRejected(state, {
        loadingKey: 'getAll',
        errorKey: 'getAll',
        failureMessage: action.payload.error || `Failed to fetch ${entityNamePlural}`,
      });
    };
  }

  // ============================================================================
  // Fetch By ID (getById) - Entity-level state
  // ============================================================================
  if (operations.includes('getById')) {
    reducers.fetchByIdRequest = (state, action: PayloadAction<FetchByIdRequestPayload>) => {
      const key = `getById:${action.payload.id}`;
      setPending(state, { key });
    };

    reducers.fetchByIdSuccess = (state, action: PayloadAction<FetchByIdSuccessPayload>) => {
      const key = `getById:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    };

    reducers.fetchByIdFailure = (state, action: PayloadAction<FailurePayload>) => {
      const key = action.payload.id ? `getById:${action.payload.id}` : 'getById';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to fetch ${entityName} details`,
      });
    };
  }

  // ============================================================================
  // Create - Operation-level state
  // ============================================================================
  if (operations.includes('create')) {
    reducers.createRequest = (state, _action: PayloadAction<CreateRequestPayload<unknown>>) => {
      setPending(state, { key: 'create' });
    };

    reducers.createSuccess = (state, _action: PayloadAction<unknown>) => {
      setFulfilled(state, { loadingKey: 'create', errorKey: 'create' });
    };

    reducers.createFailure = (state, action: PayloadAction<FailurePayload>) => {
      setRejected(state, {
        loadingKey: 'create',
        errorKey: 'create',
        failureMessage: action.payload.error || `Failed to create ${entityName}`,
      });
    };
  }

  // ============================================================================
  // Update - Entity-level state
  // ============================================================================
  if (operations.includes('update')) {
    reducers.updateRequest = (state, action: PayloadAction<UpdateRequestPayload<unknown>>) => {
      const key = `update:${action.payload.id}`;
      setPending(state, { key });
    };

    reducers.updateSuccess = (state, action: PayloadAction<UpdateSuccessPayload>) => {
      const key = `update:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    };

    reducers.updateFailure = (state, action: PayloadAction<FailurePayload>) => {
      const key = action.payload.id ? `update:${action.payload.id}` : 'update';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to update ${entityName}`,
      });
    };
  }

  // ============================================================================
  // Delete - Entity-level state
  // ============================================================================
  if (operations.includes('delete')) {
    reducers.deleteRequest = (state, action: PayloadAction<DeleteRequestPayload>) => {
      const key = `delete:${action.payload.id}`;
      setPending(state, { key });
    };

    reducers.deleteSuccess = (state, action: PayloadAction<DeleteSuccessPayload>) => {
      const key = `delete:${action.payload.id}`;
      setFulfilled(state, { loadingKey: key, errorKey: key });
    };

    reducers.deleteFailure = (state, action: PayloadAction<FailurePayload>) => {
      const key = action.payload.id ? `delete:${action.payload.id}` : 'delete';
      setRejected(state, {
        loadingKey: key,
        errorKey: key,
        failureMessage: action.payload.error || `Failed to delete ${entityName}`,
      });
    };
  }

  // Merge with extra reducers if provided
  const allReducers = {
    ...reducers,
    ...extraReducers,
  };

  const slice = createSlice({
    name,
    initialState,
    reducers: allReducers as never,
  });

  return slice as Omit<typeof slice, 'actions'> & { actions: CrudSliceGeneratedActions };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Helper function to capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Helper to create action names for external use
 * Useful for documentation or generating watcher functions
 */
export function getCrudActionNames(entityName: string, entityNamePlural: string) {
  const capitalizedSingular = capitalize(entityName);
  const capitalizedPlural = capitalize(entityNamePlural);

  return {
    // Fetch all
    fetchRequest: `fetch${capitalizedPlural}Request`,
    fetchSuccess: `fetch${capitalizedPlural}Success`,
    fetchFailure: `fetch${capitalizedPlural}Failure`,

    // Fetch by ID
    fetchByIdRequest: `fetch${capitalizedSingular}DetailsRequest`,
    fetchByIdSuccess: `fetch${capitalizedSingular}DetailsSuccess`,
    fetchByIdFailure: `fetch${capitalizedSingular}DetailsFailure`,

    // Create
    createRequest: `create${capitalizedSingular}Request`,
    createSuccess: `create${capitalizedSingular}Success`,
    createFailure: `create${capitalizedSingular}Failure`,

    // Update
    updateRequest: `update${capitalizedSingular}Request`,
    updateSuccess: `update${capitalizedSingular}Success`,
    updateFailure: `update${capitalizedSingular}Failure`,

    // Delete
    deleteRequest: `delete${capitalizedSingular}Request`,
    deleteSuccess: `delete${capitalizedSingular}Success`,
    deleteFailure: `delete${capitalizedSingular}Failure`,
  };
}

/**
 * Type helper to extract action creators from a CRUD slice
 */
export type CrudSliceActions = ReturnType<typeof createCrudSlice>['actions'];
