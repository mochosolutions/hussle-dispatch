import { default as React, ReactNode } from 'react';
import { DefaultConfigProps, CustomizationProps } from '../../types/config';
import { NavItemType } from '../../types/menu';
export interface MenuState {
    /** Whether the drawer is open */
    drawerOpen: boolean;
    /** Currently active menu item ID */
    selectedID: string | null;
    /** Currently open menu items (for collapsible menus) */
    openItem: string[];
    /** Menu items configuration */
    menuItems: NavItemType[];
}
export interface LayoutContextValue {
    menu: MenuState;
    openDrawer: (open: boolean) => void;
    activeID: (id: string | null) => void;
    activeItem: (items: string[]) => void;
    setMenuItems: (items: NavItemType[]) => void;
    config: CustomizationProps;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role?: string;
        organizationName?: string;
    };
    onLogout?: () => void;
    isLoading?: boolean;
    loadingMessage?: string;
    logo?: ReactNode;
    logoIcon?: ReactNode;
}
declare const LayoutContext: React.Context<LayoutContextValue | null>;
export interface LayoutProviderProps {
    children: ReactNode;
    /** Initial configuration override */
    initialConfig?: Partial<DefaultConfigProps>;
    /** Menu items to display */
    menuItems?: NavItemType[];
    /** User information */
    user?: LayoutContextValue['user'];
    /** Logout callback */
    onLogout?: () => void;
    /** Loading state (e.g., for switching organizations) */
    isLoading?: boolean;
    /** Loading message to display */
    loadingMessage?: string;
    /** Logo component */
    logo?: ReactNode;
    /** Logo icon for mini drawer */
    logoIcon?: ReactNode;
    /** Initial drawer state */
    initialDrawerOpen?: boolean;
}
export declare const LayoutProvider: React.FC<LayoutProviderProps>;
/**
 * Hook to access layout context
 */
export declare function useLayout(): LayoutContextValue;
/**
 * Hook to access menu state
 */
export declare function useMenu(): {
    openDrawer: (open: boolean) => void;
    activeID: (id: string | null) => void;
    activeItem: (items: string[]) => void;
    setMenuItems: (items: NavItemType[]) => void;
    /** Whether the drawer is open */
    drawerOpen: boolean;
    /** Currently active menu item ID */
    selectedID: string | null;
    /** Currently open menu items (for collapsible menus) */
    openItem: string[];
    /** Menu items configuration */
    menuItems: NavItemType[];
};
/**
 * Hook to access config
 */
export declare function useLayoutConfig(): CustomizationProps;
export default LayoutContext;
//# sourceMappingURL=LayoutContext.d.ts.map