import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

// project import
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
import MainContent from './MainContent';
import LayoutShell from './LayoutShell';
import Profile from './Header/HeaderContent/Profile';

import { LayoutStateProvider } from '../../../contexts/LayoutStateContext';

import type { ProfileProps } from './Header/HeaderContent/Profile';
import type { NavItemType } from '../../../types/menu';

export interface MainLayoutProps {
  menuItems?: NavItemType[];
  user?: ProfileProps['user'];
  onLogout?: () => void;
  logo?: ReactNode;
  logoIcon?: ReactNode;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
}

const MainLayout = ({
  menuItems,
  user,
  onLogout,
  logo,
  logoIcon,
  headerContent,
  footerContent,
}: MainLayoutProps) => {
  const defaultHeaderContent = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto',
      }}
    >
      <Profile user={user} onLogout={onLogout} />
    </div>
  );

  return (
    <LayoutStateProvider>
      <LayoutShell>
        <Header>{headerContent ?? defaultHeaderContent}</Header>
        <Drawer menuItems={menuItems} logo={logo} logoIcon={logoIcon} />
        <MainContent>
          <Outlet />
          <Footer>{footerContent}</Footer>
        </MainContent>
      </LayoutShell>
    </LayoutStateProvider>
  );
};

export default MainLayout;
