import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import type { DefaultConfigProps, CustomizationProps, I18n, PresetColor, FontFamily } from '../../types/config';
import { ThemeMode, ThemeDirection, MenuOrientation } from '../../types/config';
import type { NavItemType } from '../../types/menu';
import defaultConfigValue from '../../config';

// ==============================|| MENU STATE ||============================== //

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

const initialMenuState: MenuState = {
  drawerOpen: true,
  selectedID: null,
  openItem: [],
  menuItems: [],
};

// Menu action types
type MenuAction =
  | { type: 'OPEN_DRAWER'; payload: boolean }
  | { type: 'ACTIVE_ID'; payload: string | null }
  | { type: 'ACTIVE_ITEM'; payload: string[] }
  | { type: 'SET_MENU_ITEMS'; payload: NavItemType[] };

function menuReducer(state: MenuState, action: MenuAction): MenuState {
  switch (action.type) {
    case 'OPEN_DRAWER':
      return { ...state, drawerOpen: action.payload };
    case 'ACTIVE_ID':
      return { ...state, selectedID: action.payload };
    case 'ACTIVE_ITEM':
      return { ...state, openItem: action.payload };
    case 'SET_MENU_ITEMS':
      return { ...state, menuItems: action.payload };
    default:
      return state;
  }
}

// ==============================|| CONFIG CONTEXT ||============================== //

export interface LayoutContextValue {
  // Menu state
  menu: MenuState;

  // Menu actions
  openDrawer: (open: boolean) => void;
  activeID: (id: string | null) => void;
  activeItem: (items: string[]) => void;
  setMenuItems: (items: NavItemType[]) => void;

  // Config state and actions
  config: CustomizationProps;

  // User info (optional)
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    organizationName?: string;
  };

  // Auth callbacks (optional)
  onLogout?: () => void;

  // Loading state (optional - e.g., for switching organizations)
  isLoading?: boolean;
  loadingMessage?: string;

  // Logo (optional)
  logo?: ReactNode;
  logoIcon?: ReactNode;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

// ==============================|| LAYOUT PROVIDER ||============================== //

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

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  initialConfig,
  menuItems = [],
  user,
  onLogout,
  isLoading,
  loadingMessage,
  logo,
  logoIcon,
  initialDrawerOpen = true,
}) => {
  // Menu state
  const [menu, dispatchMenu] = useReducer(menuReducer, {
    ...initialMenuState,
    drawerOpen: initialDrawerOpen,
    menuItems,
  });

  // Config state
  const mergedConfig = useMemo(() => ({
    ...defaultConfigValue,
    ...initialConfig,
  }), [initialConfig]);

  const [config, setConfig] = React.useState<DefaultConfigProps>(mergedConfig);

  // Menu actions
  const openDrawer = useCallback((open: boolean) => {
    dispatchMenu({ type: 'OPEN_DRAWER', payload: open });
  }, []);

  const activeID = useCallback((id: string | null) => {
    dispatchMenu({ type: 'ACTIVE_ID', payload: id });
  }, []);

  const activeItem = useCallback((items: string[]) => {
    dispatchMenu({ type: 'ACTIVE_ITEM', payload: items });
  }, []);

  const setMenuItems = useCallback((items: NavItemType[]) => {
    dispatchMenu({ type: 'SET_MENU_ITEMS', payload: items });
  }, []);

  // Config actions
  const onChangeContainer = useCallback(() => {
    setConfig((prev) => ({ ...prev, container: !prev.container }));
  }, []);

  const onChangeLocalization = useCallback((lang: I18n) => {
    setConfig((prev) => ({ ...prev, i18n: lang }));
  }, []);

  const onChangeMode = useCallback((mode: ThemeMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  }, []);

  const onChangePresetColor = useCallback((theme: PresetColor) => {
    setConfig((prev) => ({ ...prev, presetColor: theme }));
  }, []);

  const onChangeDirection = useCallback((direction: ThemeDirection) => {
    setConfig((prev) => ({ ...prev, themeDirection: direction }));
  }, []);

  const onChangeMiniDrawer = useCallback((miniDrawer: boolean) => {
    setConfig((prev) => ({ ...prev, miniDrawer }));
  }, []);

  const onChangeMenuOrientation = useCallback((menuOrientation: MenuOrientation) => {
    setConfig((prev) => ({ ...prev, menuOrientation }));
  }, []);

  const onChangeFontFamily = useCallback((fontFamily: FontFamily) => {
    setConfig((prev) => ({ ...prev, fontFamily }));
  }, []);

  // Build customization props
  const customizationProps: CustomizationProps = useMemo(() => ({
    ...config,
    onChangeContainer,
    onChangeLocalization,
    onChangeMode,
    onChangePresetColor,
    onChangeDirection,
    onChangeMiniDrawer,
    onChangeMenuOrientation,
    onChangeFontFamily,
  }), [
    config,
    onChangeContainer,
    onChangeLocalization,
    onChangeMode,
    onChangePresetColor,
    onChangeDirection,
    onChangeMiniDrawer,
    onChangeMenuOrientation,
    onChangeFontFamily,
  ]);

  const value = useMemo<LayoutContextValue>(() => ({
    menu,
    openDrawer,
    activeID,
    activeItem,
    setMenuItems,
    config: customizationProps,
    user,
    onLogout,
    isLoading,
    loadingMessage,
    logo,
    logoIcon,
  }), [
    menu,
    openDrawer,
    activeID,
    activeItem,
    setMenuItems,
    customizationProps,
    user,
    onLogout,
    isLoading,
    loadingMessage,
    logo,
    logoIcon,
  ]);

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

// ==============================|| HOOKS ||============================== //

/**
 * Hook to access layout context
 */
export function useLayout(): LayoutContextValue {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

/**
 * Hook to access menu state
 */
export function useMenu() {
  const { menu, openDrawer, activeID, activeItem, setMenuItems } = useLayout();
  return { ...menu, openDrawer, activeID, activeItem, setMenuItems };
}

/**
 * Hook to access config
 */
export function useLayoutConfig(): CustomizationProps {
  const { config } = useLayout();
  return config;
}

export default LayoutContext;
