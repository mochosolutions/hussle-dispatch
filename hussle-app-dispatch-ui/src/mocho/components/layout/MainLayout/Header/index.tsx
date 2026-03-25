import type { ReactNode } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { AppBar, Box, Toolbar, useMediaQuery } from '@mui/material';
import type { AppBarProps } from '@mui/material';

// project import
import AppBarStyled from './AppBarStyled';
import Logo from '../../../Logo';
import Profile from './HeaderContent/Profile';
import IconButton from '../../../extended/IconButton';

import useConfig from '../../../../hooks/useConfig';
import useLayoutState from '../../../../hooks/useLayoutState';

// assets
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

// types
import { MenuOrientation, ThemeMode } from '../../../../types/config';

// ==============================|| MAIN LAYOUT - HEADER ||============================== //

export interface LayoutHeaderProps {
  children?: ReactNode;
}

const Header = ({ children }: LayoutHeaderProps) => {
  const theme = useTheme();
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));
  const { menuOrientation } = useConfig();

  const { drawerOpen, onDrawerToggle, disableMiniDrawer } = useLayoutState();

  if (disableMiniDrawer && !downLG) return null;

  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  const headerContent = children ?? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto',
      }}
    >
      <Profile />
    </div>
  );

  const iconBackColorOpen = theme.palette.mode === ThemeMode.DARK ? 'grey.200' : 'grey.300';
  const iconBackColor = theme.palette.mode === ThemeMode.DARK ? 'background.default' : 'grey.100';

  // common header
  const mainHeader: ReactNode = (
    <Toolbar>
      {disableMiniDrawer && !downLG ? <Logo sx={{ height: 35, width: 'auto', mr: 1 }} /> : null}
      {!isHorizontal ? (
        <IconButton
          aria-label="open drawer"
          onClick={onDrawerToggle}
          edge="start"
          color="secondary"
          variant="light"
          sx={{
            color: downLG ? 'common.white' : 'text.primary',
            bgcolor: downLG ? 'transparent' : (drawerOpen ? iconBackColorOpen : iconBackColor),
            ml: { xs: 0, lg: -2 },
          }}
        >
          {!drawerOpen ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </IconButton>
      ) : null}
      {headerContent}
      {downLG ? (
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <Logo sx={{ height: 28, width: 'auto' }} />
        </Box>
      ) : null}
    </Toolbar>
  );

  let appBarWidth: string | { xs: string; lg: string };
  if (isHorizontal) {
    appBarWidth = '100%';
  } else if (drawerOpen) {
    appBarWidth = 'calc(100% - 260px)';
  } else {
    appBarWidth = { xs: '100%', lg: 'calc(100% - 60px)' };
  }

  // app-bar params
  const appBar: AppBarProps = {
    position: 'fixed',
    color: 'inherit',
    elevation: 0,
    sx: {
      borderBottom: `1px solid ${theme.palette.divider}`,
      zIndex: downLG ? 1100 : 1200,
      width: appBarWidth,
      ...(downLG && {
        bgcolor: 'primary.dark',
        color: 'common.white',
        borderBottom: 'none',
        '& .MuiIconButton-root': { color: 'common.white' },
      }),
    },
  };

  return (
    <>
      {!downLG ? (
        <AppBarStyled open={drawerOpen} {...appBar}>
          {mainHeader}
        </AppBarStyled>
      ) : (
        <AppBar {...appBar}>{mainHeader}</AppBar>
      )}
    </>
  );
};

export default Header;
