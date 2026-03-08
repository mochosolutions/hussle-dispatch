import { ActionCreatorWithPayload, PayloadAction } from '@reduxjs/toolkit';
import { schema } from 'normalizr';
import { Effect, PutEffect } from 'redux-saga/effects';

// =============================================================================
// CRUD Operation Types
// =============================================================================

export type CrudOperation =
  | 'fetchAll'
  | 'fetchById'
  | 'create'
  | 'update'
  | 'delete'
  | 'updateMany'
  | 'deleteMany';

// =============================================================================
// Bulk Operation Result Types (matches API responses)
// =============================================================================

export interface BulkDeleteResult {
  deleted: number;
  postIds: string[];
}

export interface BulkUpdateResult {
  updated: number;
  postIds: string[];
}

// =============================================================================
// Delete Result Type (for cascade delete info)
// =============================================================================

export interface DeleteResult {
  deletedPosts?: number;
  deletedPostIds?: string[];
  affectedPosts?: number;
}

// =============================================================================
// Confirmation Dialog Configuration
// =============================================================================

/**
 * Configuration for confirmation dialogs
 * @template TData - The type of data passed to dynamic message/props functions
 */
export interface ConfirmationConfig<TData = unknown> {
  /** Dialog title */
  title: string;

  /** Dialog message (can be function for dynamic messages) */
  message: string | ((data: TData) => string);

  /** Action type to dispatch when user confirms */
  confirmActionType: string;

  /** Confirm button label (default: "Confirm") */
  confirmLabel?: string;

  /** Cancel button label (default: "Cancel") */
  cancelLabel?: string;

  /** Dialog severity (default: "warning") */
  severity?: 'error' | 'warning' | 'info';

  /** Optional: Use custom modal instead of generic confirmDialog */
  modalType?: string;

  /** Optional: Custom function to generate modal props */
  getModalProps?: (data: TData) => Record<string, unknown>;
}

// =============================================================================
// Lifecycle Hooks
// =============================================================================

/**
 * Lifecycle hooks for CRUD operations
 * All hooks use Generator types with proper Effect typing
 *
 * @template TEntity - The entity type (e.g., Post, Author)
 * @template TCreateInput - Input type for create operation
 * @template TUpdateInput - Input type for update operation
 */
export interface LifecycleHooks<
  TEntity,
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>
> {
  // ==========================================================================
  // Fetch All Hooks
  // ==========================================================================

  /** Called before fetching all entities. Return false to abort. */
  beforeFetchAll?: () => Generator<Effect, boolean, unknown>;

  /** Called after successfully fetching all entities */
  afterFetchAll?: (entities: TEntity[]) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Fetch By ID Hooks
  // ==========================================================================

  /** Called before fetching entity by ID. Return false to abort. */
  beforeFetchById?: (id: string) => Generator<Effect, boolean, unknown>;

  /** Called after successfully fetching entity by ID */
  afterFetchById?: (entity: TEntity) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Create Hooks
  // ==========================================================================

  /** Called before creating entity. Return false to abort. */
  beforeCreate?: (data: TCreateInput) => Generator<Effect, boolean, unknown>;

  /** Called after successfully creating entity */
  afterCreate?: (entity: TEntity) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Update Hooks
  // ==========================================================================

  /** Called before updating entity. Return false to abort. */
  beforeUpdate?: (id: string, data: TUpdateInput) => Generator<Effect, boolean, unknown>;

  /** Called after successfully updating entity */
  afterUpdate?: (entity: TEntity) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Delete Hooks
  // ==========================================================================

  /** Called before deleting entity. Return false to abort. */
  beforeDelete?: (id: string) => Generator<Effect, boolean, unknown>;

  /** Called after successfully deleting entity */
  afterDelete?: (id: string, deleteResult?: DeleteResult) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Bulk Operation Hooks
  // ==========================================================================

  /** Called before bulk update. Return false to abort. */
  beforeUpdateMany?: (
    ids: string[],
    data: TUpdateInput
  ) => Generator<Effect, boolean, unknown>;

  /** Called after successfully bulk updating entities */
  afterUpdateMany?: (result: BulkUpdateResult) => Generator<Effect, void, unknown>;

  /** Called before bulk delete. Return false to abort. */
  beforeDeleteMany?: (ids: string[]) => Generator<Effect, boolean, unknown>;

  /** Called after successfully bulk deleting entities */
  afterDeleteMany?: (result: BulkDeleteResult) => Generator<Effect, void, unknown>;

  // ==========================================================================
  // Error Hook
  // ==========================================================================

  /**
   * Called when an error occurs in any operation
   * @param operation - The operation that failed
   * @param error - The error that occurred
   * @param context - Optional context (e.g., entity ID for single operations)
   */
  onError?: (
    operation: CrudOperation,
    error: Error,
    context?: { id?: string; ids?: string[] }
  ) => Generator<Effect, void, unknown>;
}

// =============================================================================
// API Client Interface
// =============================================================================

/**
 * API client with CRUD methods
 *
 * Uses flexible types to accept various API client implementations.
 *
 * @template TEntity - The entity type
 * @template TCreateInput - Input type for create (defaults to any for flexibility)
 * @template TUpdateInput - Input type for update (defaults to any for flexibility)
 */
export interface CrudApiClient<
  TEntity,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TCreateInput = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TUpdateInput = any
> {
  getAll?: () => Promise<TEntity[] | { docs: TEntity[] }>;
  getById?: (id: string) => Promise<TEntity>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create?: (data: any) => Promise<TEntity>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update?: (id: string, data: any) => Promise<TEntity>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete?: (id: string) => Promise<DeleteResult | undefined | any>;
  // Bulk operations
  deleteMany?: (ids: string[]) => Promise<BulkDeleteResult>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMany?: (ids: string[], data: any) => Promise<BulkUpdateResult>;
}

// =============================================================================
// Redux Actions Interface
// =============================================================================

/**
 * Redux actions for CRUD operations
 *
 * Uses flexible payload types to maintain compatibility with createCrudSlice
 * and other action creator factories.
 *
 * @template TEntity - The entity type
 */
export interface CrudActions<TEntity> {
  // Fetch all actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchRequest?: () => PayloadAction<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchSuccess?: ActionCreatorWithPayload<any>;
  fetchFailure?: ActionCreatorWithPayload<{ error: string }>;

  // Fetch by ID actions (include id for entity-level state tracking)
  fetchByIdRequest?: ActionCreatorWithPayload<{ id: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchByIdSuccess?: ActionCreatorWithPayload<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchByIdFailure?: ActionCreatorWithPayload<any>;

  // Create actions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createRequest?: ActionCreatorWithPayload<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createSuccess?: ActionCreatorWithPayload<any>;
  createFailure?: ActionCreatorWithPayload<{ error: string }>;

  // Update actions (include id for entity-level state tracking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateRequest?: ActionCreatorWithPayload<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSuccess?: ActionCreatorWithPayload<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateFailure?: ActionCreatorWithPayload<any>;

  // Delete actions (include id for entity-level state tracking)
  deleteRequest?: ActionCreatorWithPayload<{ id: string }>;
  deleteSuccess?: ActionCreatorWithPayload<{ id: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteFailure?: ActionCreatorWithPayload<any>;
}

/**
 * Redux actions for bulk operations
 * @template TUpdateInput - Input type for bulk update
 */
export interface BulkActions<TUpdateInput = unknown> {
  // Bulk delete
  deleteManyRequest?: ActionCreatorWithPayload<{ ids: string[] }>;
  deleteManySuccess?: ActionCreatorWithPayload<BulkDeleteResult>;
  deleteManyFailure?: ActionCreatorWithPayload<{ error: string }>;

  // Bulk update
  updateManyRequest?: ActionCreatorWithPayload<{ ids: string[]; data: TUpdateInput }>;
  updateManySuccess?: ActionCreatorWithPayload<BulkUpdateResult>;
  updateManyFailure?: ActionCreatorWithPayload<{ error: string }>;
}

// =============================================================================
// Entity Actions Interface
// =============================================================================

/**
 * Entity adapter actions (from createEntityModule or Redux Toolkit)
 *
 * Uses flexible types to accept entity adapter action creators from various sources,
 * including CaseReducerActions from createSlice.
 *
 * @template TEntity - The entity type (unused, kept for semantic clarity)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export type EntityActions<TEntity = any> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addOne: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addMany: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAll: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateOne: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeOne: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeMany?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Allow additional actions from entity adapters
};

// =============================================================================
// Normalization Configuration
// =============================================================================

/**
 * Configuration for data normalization
 */
export interface NormalizationConfig {
  /** Normalizr schema for the entity */
  schema: schema.Entity;

  /** Handler for normalized related entities */
  handleRelatedEntities?: (
    normalizedData: Record<string, Record<string, unknown>>
  ) => Generator<PutEffect, void, unknown>;
}

// =============================================================================
// Custom Messages Configuration
// =============================================================================

export interface CrudMessages {
  createSuccess?: string;
  updateSuccess?: string;
  deleteSuccess?: string;
  fetchError?: string;
  createError?: string;
  updateError?: string;
  deleteError?: string;
  deleteManySuccess?: string;
  deleteManyError?: string;
  updateManySuccess?: string;
  updateManyError?: string;
}

// =============================================================================
// Navigation Configuration
// =============================================================================

export interface NavigationConfig {
  /** Route to navigate to after create success */
  afterCreate?: string;

  /** Route to navigate to after update success */
  afterUpdate?: string;

  /** Route to navigate to after delete success */
  afterDelete?: string;

  /** Route to navigate to after bulk delete success */
  afterDeleteMany?: string;

  /** Route to navigate to after bulk update success */
  afterUpdateMany?: string;
}

// =============================================================================
// Main CRUD Saga Configuration
// =============================================================================

/**
 * Configuration for CRUD saga generation
 *
 * @template TEntity - The entity type (e.g., Post, Author, Category)
 * @template TCreateInput - Input type for create operation
 * @template TUpdateInput - Input type for update operation
 */
export interface CrudSagaConfig<
  TEntity extends { id: string },
  TCreateInput = Partial<TEntity>,
  TUpdateInput = Partial<TEntity>
> {
  /** Display name for the entity (e.g., "Post", "Author") */
  entityName: string;

  /** Plural display name (e.g., "Posts", "Authors") */
  entityNamePlural: string;

  /** API client with CRUD methods */
  apiClient: CrudApiClient<TEntity, TCreateInput, TUpdateInput>;

  /** Redux actions for this entity */
  actions: CrudActions<TEntity>;

  /** Entity adapter actions (from createEntityModule or Redux Toolkit) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  entityActions: EntityActions<TEntity> | any;

  /** Navigation configuration */
  navigation?: NavigationConfig;

  /** Normalization configuration (optional, for complex entities with relations) */
  normalization?: NormalizationConfig;

  /** Custom success/error messages (optional) */
  messages?: CrudMessages;

  /** Whether to refetch list after create/update/delete (default: false) */
  refetchAfterMutation?: boolean;

  /** Lifecycle hooks for custom logic at various points in CRUD operations */
  hooks?: LifecycleHooks<TEntity, TCreateInput, TUpdateInput>;

  /** Confirmation dialog configuration for operations */
  confirmation?: {
    delete?: ConfirmationConfig<string>; // TData is entity ID
    update?: ConfirmationConfig<{ id: string; data: TUpdateInput }>;
    deleteMany?: ConfirmationConfig<string[]>; // TData is array of IDs
    updateMany?: ConfirmationConfig<{ ids: string[]; data: TUpdateInput }>;
  };

  /** Bulk actions (optional, for bulk operations) */
  bulkActions?: BulkActions<TUpdateInput>;
}

// =============================================================================
// Return Type for createCrudSagas
// =============================================================================

/**
 * Return type for the createCrudSagas factory
 *
 * @template TCreateInput - Input type for create operation
 * @template TUpdateInput - Input type for update operation
 */
export interface CrudSagas<TCreateInput = unknown, TUpdateInput = unknown> {
  fetchAll: () => Generator<Effect, void, unknown>;
  fetchById: (action: PayloadAction<{ id: string }>) => Generator<Effect, void, unknown>;
  create: (action: PayloadAction<{ data: TCreateInput }>) => Generator<Effect, void, unknown>;
  update: (
    action: PayloadAction<{ id: string; data: TUpdateInput }>
  ) => Generator<Effect, void, unknown>;
  delete: (action: PayloadAction<{ id: string }>) => Generator<Effect, void, unknown>;
  updateMany?: (
    action: PayloadAction<{ ids: string[]; data: TUpdateInput }>
  ) => Generator<Effect, void, unknown>;
  deleteMany?: (action: PayloadAction<{ ids: string[] }>) => Generator<Effect, void, unknown>;
}
