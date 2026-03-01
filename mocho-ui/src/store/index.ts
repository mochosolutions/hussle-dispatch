import { useCallback } from 'react';
import { useLayout, useMenu } from '../components/layout/LayoutContext';
import type { MenuState } from '../components/layout/LayoutContext';

/**
 * Root state shape for selector compatibility
 */
export interface RootState {
  menu: MenuState;
}

/**
 * Custom useSelector hook that works with LayoutContext
 *
 * Provides selector-style access to layout state for compatibility
 * with existing layout components.
 */
export function useSelector<T>(selector: (state: RootState) => T): T {
  const { menu } = useLayout();
  const state: RootState = { menu };
  return selector(state);
}

/**
 * Action dispatcher type
 */
type MenuAction =
  | { type: 'menu/openDrawer'; payload: boolean }
  | { type: 'menu/activeID'; payload: string | null }
  | { type: 'menu/activeItem'; payload: string[] };

/**
 * Dispatch function for menu actions
 */
export function dispatch(action: MenuAction): void {
  // This is a placeholder - actual dispatch happens through context
  // The action creators below handle the actual dispatch
  console.warn('Direct dispatch called - use action creators instead');
}

/**
 * Custom useDispatch hook
 */
export function useDispatch() {
  const { openDrawer, activeID, activeItem } = useLayout();

  const dispatchFn = useCallback((action: MenuAction) => {
    switch (action.type) {
      case 'menu/openDrawer':
        openDrawer(action.payload);
        break;
      case 'menu/activeID':
        activeID(action.payload);
        break;
      case 'menu/activeItem':
        activeItem(action.payload);
        break;
    }
  }, [openDrawer, activeID, activeItem]);

  return dispatchFn;
}

// Re-export for convenience
export { useMenu, useLayout } from '../components/layout/LayoutContext';
export type { MenuState } from '../components/layout/LayoutContext';
