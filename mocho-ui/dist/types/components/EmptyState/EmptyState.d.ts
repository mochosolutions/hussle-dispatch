import { default as React } from 'react';
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
export declare function EmptyState({ icon, title, message, actionText, onAction, secondaryActionText, onSecondaryAction, minHeight, variant, entityName, compact, }: EmptyStateProps): JSX.Element;
export default EmptyState;
//# sourceMappingURL=EmptyState.d.ts.map