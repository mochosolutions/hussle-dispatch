import { ReactNode } from 'react';
import { ChipProps } from '@mui/material';
import { GenericCardProps } from './root';
export type NavItemType = {
    breadcrumbs?: boolean;
    caption?: ReactNode | string;
    children?: NavItemType[];
    elements?: NavItemType[];
    chip?: ChipProps;
    color?: 'primary' | 'secondary' | 'default' | undefined;
    disabled?: boolean;
    external?: boolean;
    icon?: GenericCardProps['iconPrimary'] | string;
    id?: string;
    search?: string;
    target?: boolean;
    title?: ReactNode | string;
    type?: string;
    url?: string | undefined;
};
export type LinkTarget = '_blank' | '_self' | '_parent' | '_top';
export type MenuProps = {
    openItem: string[];
    openComponent: string;
    selectedID: string | null;
    drawerOpen: boolean;
    componentDrawerOpen: boolean;
    menu: NavItemType;
    error: null;
};
//# sourceMappingURL=menu.d.ts.map