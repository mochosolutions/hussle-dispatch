import { ReactNode } from 'react';
import { NavItemType } from '../../../../types/menu';
export interface LayoutDrawerProps {
    menuItems?: NavItemType[];
    logo?: ReactNode;
    logoIcon?: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    window?: () => Window;
    navStyles?: Record<string, unknown>;
    paperStyles?: Record<string, unknown>;
    mobilePaperStyles?: Record<string, unknown>;
    headerStyles?: Record<string, unknown>;
}
declare const MainDrawer: ({ menuItems, logo, logoIcon, header, footer, window: windowProp, navStyles, paperStyles, mobilePaperStyles, headerStyles, }: LayoutDrawerProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default MainDrawer;
//# sourceMappingURL=index.d.ts.map