import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import useConfig from '../hooks/useConfig';

export interface LayoutStateContextValue {
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onDrawerClose: () => void;
  disableMiniDrawer?: boolean;
}

export const LayoutStateContext = createContext<LayoutStateContextValue | null>(null);

export interface LayoutStateProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
  disableMiniDrawer?: boolean;
  drawerOpen?: boolean;
  onDrawerToggle?: () => void;
  onDrawerClose?: () => void;
}

export const LayoutStateProvider = (props: LayoutStateProviderProps) => {
  const {
    children,
    defaultOpen,
    disableMiniDrawer,
    drawerOpen: drawerOpenProp,
    onDrawerToggle: onDrawerToggleProp,
    onDrawerClose: onDrawerCloseProp,
  } = props;

  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const matchDownLg = useMediaQuery(theme.breakpoints.down('lg'));
  const { miniDrawer } = useConfig();
  const mountRef = useRef(false);

  const isControlled = drawerOpenProp !== undefined;

  const [internalDrawerOpen, setInternalDrawerOpen] = useState(() => {
    if (defaultOpen !== undefined) {
      return defaultOpen;
    }
    if (miniDrawer) {
      return false;
    }
    // Cannot read breakpoint on first render in SSR; default to closed
    return false;
  });

  // Initialize drawer state on mount based on viewport
  useEffect(() => {
    if (!isControlled && !disableMiniDrawer && !miniDrawer && defaultOpen === undefined) {
      setInternalDrawerOpen(!matchDownXL);
    }
    mountRef.current = true;
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle responsive changes after mount
  useEffect(() => {
    if (
      mountRef.current &&
      !isControlled &&
      !disableMiniDrawer &&
      !miniDrawer &&
      defaultOpen === undefined
    ) {
      setInternalDrawerOpen(!matchDownXL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  const handleInternalToggle = useCallback(() => {
    setInternalDrawerOpen((prev) => !prev);
  }, []);

  const handleInternalClose = useCallback(() => {
    setInternalDrawerOpen(false);
  }, []);

  let drawerOpen: boolean;
  let onDrawerToggle: () => void;
  let onDrawerClose: () => void;

  if (isControlled) {
    drawerOpen = drawerOpenProp;
    onDrawerToggle = onDrawerToggleProp ?? (() => {});
    onDrawerClose = onDrawerCloseProp ?? (() => {});
  } else if (disableMiniDrawer && !matchDownLg) {
    // Desktop + disableMiniDrawer: always open, no toggle
    drawerOpen = true;
    onDrawerToggle = () => {};
    onDrawerClose = () => {};
  } else {
    // Uncontrolled (includes mobile with disableMiniDrawer — normal toggle behaviour)
    drawerOpen = internalDrawerOpen;
    onDrawerToggle = handleInternalToggle;
    onDrawerClose = handleInternalClose;
  }

  return (
    <LayoutStateContext.Provider value={{ drawerOpen, onDrawerToggle, onDrawerClose, disableMiniDrawer }}>
      {children}
    </LayoutStateContext.Provider>
  );
};
