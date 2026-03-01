import { CSSProperties, ComponentType } from 'react';
import { OverrideIcon } from '../../types/root';
export interface BreadCrumbSxProps extends CSSProperties {
    mb?: string;
    bgcolor?: string;
}
export interface BreadcrumbItem {
    /** Display title */
    title: string;
    /** URL/path (optional) */
    url?: string;
    /** Icon component (optional) */
    icon?: OverrideIcon;
    /** Whether this is the active/current item */
    active?: boolean;
}
interface BreadcrumbsProps {
    /** Array of breadcrumb items */
    items: BreadcrumbItem[];
    /** Show breadcrumbs in a card */
    card?: boolean;
    /** Show divider after breadcrumbs */
    divider?: boolean;
    /** Show icon for home item only */
    icon?: boolean;
    /** Show icons for all items */
    icons?: boolean;
    /** Maximum number of breadcrumbs to show */
    maxItems?: number;
    /** Align breadcrumbs to the right */
    rightAlign?: boolean;
    /** Custom separator icon/element */
    separator?: OverrideIcon;
    /** Show page title */
    title?: boolean;
    /** Show title below breadcrumbs */
    titleBottom?: boolean;
    /** Custom styles */
    sx?: BreadCrumbSxProps;
    /** Custom Link component (e.g., from react-router, next/link) or HTML element type */
    LinkComponent?: ComponentType<any> | keyof JSX.IntrinsicElements;
    /** Home URL (default: '/') */
    homeUrl?: string;
}
declare const Breadcrumbs: ({ items, card, divider, icon, icons, maxItems, rightAlign, separator, title, titleBottom, sx, LinkComponent, homeUrl, ...others }: BreadcrumbsProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default Breadcrumbs;
//# sourceMappingURL=Breadcrumbs.d.ts.map