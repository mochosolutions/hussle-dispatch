import { MenuState } from '../components/layout/LayoutContext';
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
export declare function useSelector<T>(selector: (state: RootState) => T): T;
/**
 * Action dispatcher type
 */
type MenuAction = {
    type: 'menu/openDrawer';
    payload: boolean;
} | {
    type: 'menu/activeID';
    payload: string | null;
} | {
    type: 'menu/activeItem';
    payload: string[];
};
/**
 * Dispatch function for menu actions
 */
export declare function dispatch(action: MenuAction): void;
/**
 * Custom useDispatch hook
 */
export declare function useDispatch(): (action: MenuAction) => void;
export { useMenu, useLayout } from '../components/layout/LayoutContext';
export type { MenuState } from '../components/layout/LayoutContext';
//# sourceMappingURL=index.d.ts.map