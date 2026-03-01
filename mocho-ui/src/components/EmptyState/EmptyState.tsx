import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import {
  Inbox,
  Add,
  SearchOff,
  FilterAltOff,
  ErrorOutline,
  HourglassEmpty,
} from '@mui/icons-material';

/**
 * Empty State Props
 */
export interface EmptyStateProps {
  /**
   * Icon to display
   * Can be a MUI icon component or an emoji string
   */
  icon?: React.ReactNode | string;

  /**
   * Title/heading for empty state
   */
  title?: string;

  /**
   * Description message
   */
  message?: string;

  /**
   * Primary action button text
   */
  actionText?: string;

  /**
   * Callback when primary action button is clicked
   */
  onAction?: () => void;

  /**
   * Secondary action button text
   */
  secondaryActionText?: string;

  /**
   * Callback when secondary action button is clicked
   */
  onSecondaryAction?: () => void;

  /**
   * Minimum height for the container
   * @default 300
   */
  minHeight?: number | string;

  /**
   * Empty state variant (predefined types)
   * - 'no-data': No items exist (show create CTA)
   * - 'no-results': Filtered to no results (show clear filter CTA)
   * - 'error': Error occurred
   * - 'loading': Loading state
   * - 'custom': Use custom props
   */
  variant?: 'no-data' | 'no-results' | 'error' | 'loading' | 'custom';

  /**
   * Entity name (e.g., "Authors", "Categories")
   * Used for auto-generating messages
   */
  entityName?: string;

  /**
   * Show as compact size
   * @default false
   */
  compact?: boolean;
}

/**
 * Enhanced Empty State Component
 * Displays user-friendly empty states with icons, messages, and call-to-action buttons
 *
 * @example
 * // No data variant
 * <EmptyState
 *   variant="no-data"
 *   entityName="Authors"
 *   onAction={handleCreate}
 * />
 *
 * // Custom variant
 * <EmptyState
 *   icon="📝"
 *   title="No blog posts yet"
 *   message="Get started by creating your first blog post."
 *   actionText="Create Post"
 *   onAction={handleCreate}
 * />
 */
export function EmptyState({
  icon,
  title,
  message,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  minHeight = 300,
  variant = 'custom',
  entityName,
  compact = false,
}: EmptyStateProps): JSX.Element {
  // Get variant-specific defaults
  const variantConfig = getVariantConfig(variant, entityName);

  // Use provided props or fall back to variant defaults
  const displayIcon = icon !== undefined ? icon : variantConfig.icon;
  const displayTitle = title || variantConfig.title;
  const displayMessage = message || variantConfig.message;
  const displayActionText = actionText || variantConfig.actionText;
  const displaySecondaryActionText = secondaryActionText || variantConfig.secondaryActionText;

  // Render icon
  const iconElement = typeof displayIcon === 'string' ? (
    <Typography variant="h1" sx={{ fontSize: compact ? '3rem' : '4rem', mb: 2 }}>
      {displayIcon}
    </Typography>
  ) : (
    <Box
      sx={{
        color: 'text.secondary',
        mb: 2,
        '& .MuiSvgIcon-root': {
          fontSize: compact ? '3rem' : '4rem',
        },
      }}
    >
      {displayIcon}
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: compact ? 2 : 3,
        textAlign: 'center',
      }}
      role="status"
      aria-live="polite"
    >
      {displayIcon && iconElement}

      {displayTitle && (
        <Typography
          variant={compact ? 'h6' : 'h5'}
          sx={{
            fontWeight: 600,
            mb: 1,
            color: 'text.primary',
          }}
        >
          {displayTitle}
        </Typography>
      )}

      {displayMessage && (
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 500,
            mb: 3,
          }}
        >
          {displayMessage}
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
        {displayActionText && onAction && (
          <Button
            variant="contained"
            color="primary"
            onClick={onAction}
            startIcon={variant === 'no-data' ? <Add /> : undefined}
            size={compact ? 'medium' : 'large'}
          >
            {displayActionText}
          </Button>
        )}

        {displaySecondaryActionText && onSecondaryAction && (
          <Button
            variant="outlined"
            color="inherit"
            onClick={onSecondaryAction}
            size={compact ? 'medium' : 'large'}
          >
            {displaySecondaryActionText}
          </Button>
        )}
      </Box>
    </Box>
  );
}

/**
 * Get configuration for predefined variants
 */
function getVariantConfig(variant: EmptyStateProps['variant'], entityName?: string) {
  const entity = entityName || 'Items';
  const entityLower = entity.toLowerCase();

  switch (variant) {
    case 'no-data':
      return {
        icon: <Inbox />,
        title: `No ${entity} Yet`,
        message: `Get started by creating your first ${entityLower.replace(/s$/, '')}.`,
        actionText: `Create ${entity.replace(/s$/, '')}`,
        secondaryActionText: undefined,
      };

    case 'no-results':
      return {
        icon: <SearchOff />,
        title: 'No Results Found',
        message: `No ${entityLower} match your current filters. Try adjusting your search or clearing filters.`,
        actionText: 'Clear Filters',
        secondaryActionText: undefined,
      };

    case 'error':
      return {
        icon: <ErrorOutline />,
        title: 'Unable to Load Data',
        message: 'An error occurred while loading the data. Please try again.',
        actionText: 'Retry',
        secondaryActionText: 'Go Back',
      };

    case 'loading':
      return {
        icon: <HourglassEmpty />,
        title: 'Loading...',
        message: 'Please wait while we load the data.',
        actionText: undefined,
        secondaryActionText: undefined,
      };

    case 'custom':
    default:
      return {
        icon: <Inbox />,
        title: 'No Data',
        message: undefined,
        actionText: undefined,
        secondaryActionText: undefined,
      };
  }
}

export default EmptyState;
