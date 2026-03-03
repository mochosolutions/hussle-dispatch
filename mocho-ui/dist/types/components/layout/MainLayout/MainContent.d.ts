import { ReactNode } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
export interface MainContentProps {
    children: ReactNode;
    drawerWidth?: number;
    miniDrawerWidth?: number;
    mobileBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
    container?: boolean;
    contentPadding?: number | string | {
        xs?: number | string;
        sm?: number | string;
        md?: number | string;
        lg?: number | string;
        xl?: number | string;
    };
    containerMaxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
    showToolbarSpacer?: boolean;
    sx?: SxProps<Theme>;
}
declare const MainContent: ({ children, drawerWidth, miniDrawerWidth, mobileBreakpoint, container: containerProp, contentPadding, containerMaxWidth, showToolbarSpacer, sx: sxProp, }: MainContentProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default MainContent;
//# sourceMappingURL=MainContent.d.ts.map