import { ReactNode } from 'react';
import { ProfileProps } from './Header/HeaderContent/Profile';
import { NavItemType } from '../../../types/menu';
export interface MainLayoutProps {
    menuItems?: NavItemType[];
    user?: ProfileProps['user'];
    onLogout?: () => void;
    logo?: ReactNode;
    logoIcon?: ReactNode;
    headerContent?: ReactNode;
    footerContent?: ReactNode;
}
declare const MainLayout: ({ menuItems, user, onLogout, logo, logoIcon, headerContent, footerContent, }: MainLayoutProps) => import("@emotion/react/jsx-runtime").JSX.Element;
export default MainLayout;
//# sourceMappingURL=index.d.ts.map