import { FunctionComponent, ReactNode } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Default icons - these can be overridden via config
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

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
export const ActionsCell: FunctionComponent<ActionsCellProps> = ({ data, config }) => {
  const navigate = useNavigate();

  const {
    getViewRoute,
    getEditRoute,
    onDelete,
    onCustomAction,
    customActionIcon,
    customActionTooltip = 'Action',
    showView = false,
    showEdit = true,
    showDelete = true,
    viewIcon = <VisibilityOutlinedIcon fontSize="small" />,
    editIcon = <EditOutlinedIcon fontSize="small" />,
    deleteIcon = <DeleteOutlinedIcon fontSize="small" />,
    viewTooltip = 'View',
    editTooltip = 'Edit',
    deleteTooltip = 'Delete',
    isEditDisabled,
    isDeleteDisabled,
    isViewDisabled,
    isExternalView = false,
  } = config;

  // Handle view action
  const handleView = () => {
    if (getViewRoute && data) {
      const route = getViewRoute(data);
      if (isExternalView) {
        window.open(route, '_blank', 'noopener,noreferrer');
      } else {
        navigate(route);
      }
    }
  };

  // Handle edit action
  const handleEdit = () => {
    if (getEditRoute && data) {
      const route = getEditRoute(data);
      navigate(route);
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete && data) {
      onDelete(data);
    }
  };

  // Handle custom action
  const handleCustomAction = () => {
    if (onCustomAction && data) {
      onCustomAction(data);
    }
  };

  // Check if actions are disabled
  const editDisabled = isEditDisabled ? isEditDisabled(data) : false;
  const deleteDisabled = isDeleteDisabled ? isDeleteDisabled(data) : false;
  const viewDisabled = isViewDisabled ? isViewDisabled(data) : false;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        gap: 0.5,
        p: 1,
      }}
    >
      {/* View Button */}
      {showView && getViewRoute && (
        <Tooltip title={viewTooltip} arrow>
          <span>
            <IconButton
              onClick={handleView}
              disabled={viewDisabled}
              size="small"
              aria-label={viewTooltip}
            >
              {viewIcon}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Edit Button */}
      {showEdit && getEditRoute && (
        <Tooltip title={editTooltip} arrow>
          <span>
            <IconButton
              onClick={handleEdit}
              disabled={editDisabled}
              size="small"
              aria-label={editTooltip}
            >
              {editIcon}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Delete Button */}
      {showDelete && onDelete && (
        <Tooltip title={deleteTooltip} arrow>
          <span>
            <IconButton
              onClick={handleDelete}
              disabled={deleteDisabled}
              size="small"
              color="error"
              aria-label={deleteTooltip}
            >
              {deleteIcon}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {/* Custom Action Button */}
      {onCustomAction && customActionIcon && (
        <Tooltip title={customActionTooltip} arrow>
          <span>
            <IconButton
              onClick={handleCustomAction}
              size="small"
              aria-label={customActionTooltip}
            >
              {customActionIcon}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  );
};

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
export function createActionsCell<T = unknown>(config: ActionsCellConfig<T>) {
  const ConfiguredActionsCell: FunctionComponent<{ data: T }> = (props) => {
    return <ActionsCell {...props} config={config as ActionsCellConfig<unknown>} />;
  };

  ConfiguredActionsCell.displayName = 'ConfiguredActionsCell';

  return ConfiguredActionsCell;
}

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
export function createStandardCrudActionsConfig<T extends { id: string; [key: string]: unknown }>(
  config: CreateStandardCrudActionsConfigInput<T>
): ActionsCellConfig<T> {
  const { basePath, viewOptions = {}, editOptions = {}, deleteOptions = {} } = config;

  // View defaults
  const showView = viewOptions.show ?? false;
  const isExternalView = viewOptions.isExternal ?? false;
  const getViewRoute = showView
    ? viewOptions.getRoute ?? ((data: T) => `${basePath}/${data.id}`)
    : undefined;

  // Edit defaults
  const showEdit = editOptions.show ?? true;
  const getEditRoute = showEdit
    ? editOptions.getRoute ?? ((data: T) => `${basePath}/edit/${data.id}`)
    : undefined;

  // Delete defaults
  const showDelete = deleteOptions.show ?? true;
  const onDelete = showDelete ? deleteOptions.onDelete : undefined;

  return {
    getViewRoute,
    getEditRoute,
    onDelete,
    showView,
    showEdit,
    showDelete,
    isExternalView,
  };
}
