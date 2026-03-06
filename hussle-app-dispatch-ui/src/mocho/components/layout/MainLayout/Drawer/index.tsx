import { useMemo } from 'react';
import type { ReactNode } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Drawer, useMediaQuery } from '@mui/material';

// project import
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import MiniDrawerStyled from './MiniDrawerStyled';

import { DRAWER_WIDTH } from '../../../../config';
import useLayoutState from '../../../../hooks/useLayoutState';

// types
import type { NavItemType } from '../../../../types/menu';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

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

const MainDrawer = ({
  menuItems,
  logo,
  logoIcon,
  header,
  footer,
  window: windowProp,
  navStyles,
  paperStyles,
  mobilePaperStyles,
  headerStyles,
}: LayoutDrawerProps) => {
  const theme = useTheme();
  const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'));

  const { drawerOpen, onDrawerClose, disableMiniDrawer } = useLayoutState();

  // responsive drawer container
  const container = windowProp !== undefined ? () => windowProp().document.body : undefined;

  // header content
  const drawerContent = useMemo(() => <DrawerContent menuItems={menuItems} />, [menuItems]);
  const drawerHeader = useMemo(
    () =>
      header ?? (
        <DrawerHeader open={drawerOpen} logo={logo} logoIcon={logoIcon} styles={headerStyles} />
      ),
    [drawerOpen, header, logo, logoIcon, headerStyles],
  );

  // Desktop + disableMiniDrawer: plain permanent drawer, no mini-collapsed state
  if (disableMiniDrawer && !matchDownMD) {
    return (
      <Box
        component="nav"
        sx={{ flexShrink: { md: 0 }, zIndex: 1200, width: DRAWER_WIDTH, height: '100%' }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="permanent"
          PaperProps={{
            sx: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundImage: 'none',
              overflowX: 'hidden',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              ...(paperStyles ?? {}),
            },
          }}
        >
          {drawerHeader}
          <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>{drawerContent}</Box>
          {footer && (
            <Box sx={{ pl: '28px', py: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
              {footer}
            </Box>
          )}
        </Drawer>
      </Box>
    );
  }

  // Desktop: Wrap in Box with nav role
  if (!matchDownMD) {
    return (
      <Box
        component="nav"
        sx={{
          flexShrink: { md: 0 },
          zIndex: 1200,
          ...(navStyles ?? {}),
        }}
        aria-label="mailbox folders"
      >
        <MiniDrawerStyled
          variant="permanent"
          open={drawerOpen}
          PaperProps={paperStyles ? { sx: paperStyles } : undefined}
        >
          {drawerHeader}
          {drawerContent}
          {footer && (
            <Box
              sx={{
                pl: drawerOpen ? '28px' : 1.5,
                py: drawerOpen ? 1 : 1.25,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              {footer}
            </Box>
          )}
        </MiniDrawerStyled>
      </Box>
    );
  }

  // Mobile: Render Drawer directly without Box wrapper to avoid stacking context issues
  return (
    <Drawer
      container={container}
      variant="temporary"
      open={drawerOpen}
      onClose={onDrawerClose}
      ModalProps={{
        keepMounted: true,
        slotProps: {
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
        },
      }}
      sx={{
        display: { xs: 'block', lg: 'none' },
      }}
      PaperProps={{
        sx: {
          boxSizing: 'border-box',
          width: DRAWER_WIDTH,
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: 'inherit',
          ...(paperStyles ?? {}),
          ...(mobilePaperStyles ?? {}),
          overflowX: 'hidden',
        },
      }}
    >
      {drawerHeader}
      {drawerContent}
    </Drawer>
  );
};

export default MainDrawer;
