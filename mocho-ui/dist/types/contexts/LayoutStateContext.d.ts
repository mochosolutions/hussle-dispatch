import { ReactNode } from 'react';
export interface LayoutStateContextValue {
    drawerOpen: boolean;
    onDrawerToggle: () => void;
    onDrawerClose: () => void;
}
export declare const LayoutStateContext: import('react').Context<LayoutStateContextValue | null>;
export interface LayoutStateProviderProps {
    children: ReactNode;
    defaultOpen?: boolean;
}
export declare const LayoutStateProvider: ({ children, defaultOpen }: LayoutStateProviderProps) => import("@emotion/react/jsx-runtime").JSX.Element;
//# sourceMappingURL=LayoutStateContext.d.ts.map