import type { ReactNode } from 'react';

// material-ui
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { Box, Container, Toolbar, useMediaQuery } from '@mui/material';

// project import
import useConfig from '../../../hooks/useConfig';
import useLayoutState from '../../../hooks/useLayoutState';
import { DRAWER_WIDTH, MINI_DRAWER_WIDTH } from '../../../config';
import { MenuOrientation } from '../../../types/config';

// ==============================|| MAIN LAYOUT - CONTENT ||============================== //

export interface MainContentProps {
  children: ReactNode;
  drawerWidth?: number;
  miniDrawerWidth?: number;
  mobileBreakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  container?: boolean;
  contentPadding?:
    | number
    | string
    | {
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

const MainContent = ({
  children,
  drawerWidth = DRAWER_WIDTH,
  miniDrawerWidth = MINI_DRAWER_WIDTH,
  mobileBreakpoint = 'lg',
  container: containerProp,
  contentPadding = { xs: 2, sm: 3 },
  containerMaxWidth = 'xl',
  showToolbarSpacer = true,
  sx: sxProp,
}: MainContentProps) => {
  const theme = useTheme();
  const { container: configContainer, menuOrientation } = useConfig();
  const downBreakpoint = useMediaQuery(theme.breakpoints.down(mobileBreakpoint));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { drawerOpen, disableMiniDrawer } = useLayoutState();

  const skipSpacer = disableMiniDrawer && !downBreakpoint;

  const useContainer = containerProp ?? configContainer;
  const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  // When disableMiniDrawer is active on desktop, the nav Box placeholder already reserves
  // DRAWER_WIDTH in the flex layout — let flexGrow:1 fill the remainder naturally.
  // Setting an explicit width here would double-count the drawer width and cause overflow.
  let mainWidth: string | undefined;
  if (disableMiniDrawer && !downBreakpoint) {
    mainWidth = undefined;
  } else if (downBreakpoint) {
    mainWidth = '100%';
  } else if (drawerOpen) {
    mainWidth = `calc(100% - ${drawerWidth}px)`;
  } else {
    mainWidth = `calc(100% - ${miniDrawerWidth}px)`;
  }

  return (
    <Box
      component="main"
      sx={{
        background: theme.palette.background.default,
        width: mainWidth,
        minWidth: 0,
        flexGrow: 1,
        overflowY: 'auto',
        p: contentPadding,
        ...(downBreakpoint &&
          drawerOpen && {
            pointerEvents: 'none',
          }),
        transition: theme.transitions.create(['width', 'pointer-events'], {
          easing: theme.transitions.easing.sharp,
          duration: drawerOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
        ...((sxProp ?? {}) as Record<string, unknown>),
      }}
    >
      {showToolbarSpacer && !skipSpacer && <Toolbar sx={{ mt: isHorizontal ? 8 : 'inherit' }} />}
      <Container
        disableGutters={!useContainer}
        maxWidth={useContainer ? containerMaxWidth : false}
        sx={{
          ...(useContainer && { px: { xs: 0, sm: 2 } }),
          position: 'relative',
          minHeight: 'calc(100vh - 110px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default MainContent;
