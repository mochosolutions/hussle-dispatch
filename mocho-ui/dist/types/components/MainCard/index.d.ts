import { CSSProperties, ReactNode } from 'react';
import { CardProps, CardHeaderProps, CardContentProps } from '@mui/material';
export interface MainCardProps {
    border?: boolean;
    boxShadow?: boolean;
    children?: ReactNode | string;
    subheader?: ReactNode | string;
    style?: CSSProperties;
    content?: boolean;
    contentSX?: CardContentProps['sx'];
    darkTitle?: boolean;
    divider?: boolean;
    sx?: CardProps['sx'];
    secondary?: CardHeaderProps['action'];
    shadow?: string;
    elevation?: number;
    title?: ReactNode | string;
    modal?: boolean;
    [key: string]: unknown;
}
/**
 * MainCard - A styled card wrapper component
 *
 * Provides consistent styling for card-based content areas in admin dashboards.
 * Supports title, subtitle, actions, and various styling options.
 *
 * @example
 * ```tsx
 * <MainCard title="Blog Posts" elevation={0} border>
 *   <DataGrid {...props} />
 * </MainCard>
 *
 * <MainCard
 *   title="Edit Post"
 *   secondary={<Button>Save</Button>}
 * >
 *   <BlogPostForm />
 * </MainCard>
 * ```
 */
declare const MainCard: import('react').ForwardRefExoticComponent<Omit<MainCardProps, "ref"> & import('react').RefAttributes<HTMLDivElement>>;
export default MainCard;
//# sourceMappingURL=index.d.ts.map