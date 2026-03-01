import { FunctionComponent, ReactNode } from 'react';
/**
 * Configuration for action buttons
 */
export interface ActionsCellConfig<T = unknown> {
    /** Function to generate view route from row data (optional) */
    getViewRoute?: (data: T) => string;
    /** Function to generate edit route from row data (optional) */
    getEditRoute?: (data: T) => string;
    /** Callback for delete action (optional) */
    onDelete?: (data: T) => void;
    /** Callback for custom action (optional) */
    onCustomAction?: (data: T) => void;
    /** Icon for custom action (optional) */
    customActionIcon?: ReactNode;
    /** Tooltip for custom action (optional) */
    customActionTooltip?: string;
    /** Show view button (default: false) */
    showView?: boolean;
    /** Show edit button (default: true) */
    showEdit?: boolean;
    /** Show delete button (default: true) */
    showDelete?: boolean;
    /** Custom icon for view button */
    viewIcon?: ReactNode;
    /** Custom icon for edit button */
    editIcon?: ReactNode;
    /** Custom icon for delete button */
    deleteIcon?: ReactNode;
    /** Tooltip for view button (default: "View") */
    viewTooltip?: string;
    /** Tooltip for edit button (default: "Edit") */
    editTooltip?: string;
    /** Tooltip for delete button (default: "Delete") */
    deleteTooltip?: string;
    /** Function to determine if edit should be disabled for this row */
    isEditDisabled?: (data: T) => boolean;
    /** Function to determine if delete should be disabled for this row */
    isDeleteDisabled?: (data: T) => boolean;
    /** Function to determine if view should be disabled for this row */
    isViewDisabled?: (data: T) => boolean;
    /** Whether view opens external URL in new tab (default: false) */
    isExternalView?: boolean;
}
/**
 * Props for the ActionsCell component
 * Compatible with AG Grid's CustomCellRendererProps
 */
export interface ActionsCellProps<T = unknown> {
    /** Row data from AG Grid */
    data: T;
    /** Configuration for action buttons */
    config: ActionsCellConfig<T>;
}
/**
 * Generic ActionsCell component for AG Grid
 *
 * Renders configurable action buttons (View, Edit, Delete, Custom) in an AG Grid cell.
 * Supports navigation routing and custom callbacks.
 *
 * @example
 * ```tsx
 * // In your column definition
 * {
 *   headerName: 'Actions',
 *   field: 'actions',
 *   cellRenderer: ActionsCell,
 *   cellRendererParams: {
 *     config: {
 *       getEditRoute: (data) => `/authors/edit/${data.id}`,
 *       onDelete: (data) => dispatch(deleteAuthorRequest({ id: data.id })),
 *       showEdit: true,
 *       showDelete: true,
 *     }
 *   },
 *   sortable: false,
 *   filter: false,
 *   width: 150,
 * }
 * ```
 */
export declare const ActionsCell: FunctionComponent<ActionsCellProps>;
/**
 * Factory function to create a configured ActionsCell for specific entity
 *
 * @example
 * ```tsx
 * const AuthorActionsCell = createActionsCell<Author>({
 *   getEditRoute: (author) => `/authors/edit/${author.id}`,
 *   onDelete: (author) => dispatch(deleteAuthorRequest({ id: author.id })),
 * });
 *
 * // Use in column definition
 * {
 *   headerName: 'Actions',
 *   cellRenderer: AuthorActionsCell,
 * }
 * ```
 */
export declare function createActionsCell<T = unknown>(config: ActionsCellConfig<T>): FunctionComponent<{
    data: T;
}>;
/**
 * View action options
 */
export interface ViewActionOptions<T> {
    /** Show view button (default: false) */
    show?: boolean;
    /** Custom function to generate view route (default: basePath/id) */
    getRoute?: (data: T) => string;
    /** Whether view opens external URL in new tab (default: false) */
    isExternal?: boolean;
}
/**
 * Edit action options
 */
export interface EditActionOptions<T> {
    /** Show edit button (default: true) */
    show?: boolean;
    /** Custom function to generate edit route (default: basePath/edit/id) */
    getRoute?: (data: T) => string;
}
/**
 * Delete action options
 */
export interface DeleteActionOptions<T> {
    /** Show delete button (default: true) */
    show?: boolean;
    /** Delete callback */
    onDelete?: (data: T) => void;
}
/**
 * Input configuration for createStandardCrudActionsConfig
 */
export interface CreateStandardCrudActionsConfigInput<T> {
    /** Base route path for default patterns (e.g., '/blog') */
    basePath: string;
    /** View action options */
    viewOptions?: ViewActionOptions<T>;
    /** Edit action options */
    editOptions?: EditActionOptions<T>;
    /** Delete action options */
    deleteOptions?: DeleteActionOptions<T>;
}
/**
 * Helper to create standard CRUD actions cell configuration
 *
 * @example
 * ```tsx
 * const config = createStandardCrudActionsConfig<Post>({
 *   basePath: '/blog',
 *   viewOptions: {
 *     show: true,
 *     isExternal: true,
 *     getRoute: (post) => `http://localhost:3000/blog/${post.slug}`,
 *   },
 *   deleteOptions: {
 *     onDelete: (post) => dispatch(deletePostRequest({ id: post.id })),
 *   },
 * });
 * ```
 */
export declare function createStandardCrudActionsConfig<T extends {
    id: string;
    [key: string]: unknown;
}>(config: CreateStandardCrudActionsConfigInput<T>): ActionsCellConfig<T>;
//# sourceMappingURL=ActionsCell.d.ts.map