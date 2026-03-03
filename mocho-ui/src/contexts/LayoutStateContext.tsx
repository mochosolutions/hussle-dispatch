import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

import useConfig from '../hooks/useConfig';

export interface LayoutStateContextValue {
  drawerOpen: boolean;
  onDrawerToggle: () => void;
  onDrawerClose: () => void;
}

export const LayoutStateContext = createContext<LayoutStateContextValue | null>(null);

export interface LayoutStateProviderProps {
  children: ReactNode;
  defaultOpen?: boolean;
}

export const LayoutStateProvider = ({ children, defaultOpen }: LayoutStateProviderProps) => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const { miniDrawer } = useConfig();
  const mountRef = useRef(false);

  const [drawerOpen, setDrawerOpen] = useState(() => {
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
    if (!miniDrawer && defaultOpen === undefined) {
      setDrawerOpen(!matchDownXL);
    }
    mountRef.current = true;
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle responsive changes after mount
  useEffect(() => {
    if (mountRef.current && !miniDrawer && defaultOpen === undefined) {
      setDrawerOpen(!matchDownXL);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  const onDrawerToggle = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const onDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <LayoutStateContext.Provider value={{ drawerOpen, onDrawerToggle, onDrawerClose }}>
      {children}
    </LayoutStateContext.Provider>
  );
};
