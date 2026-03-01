import {useEffect} from 'react';
import {Outlet} from 'react-router-dom';

// material-ui
import {useTheme} from '@mui/material/styles';
import {useMediaQuery, Box, Container, Toolbar, Typography} from '@mui/material';

// project import
import Drawer from './Drawer';
import Header from './Header';
import Footer from './Footer';
// import HorizontalBar from './Drawer/HorizontalBar';

import useConfig from '../../../hooks/useConfig';
import {useDispatch, useSelector} from '../../../store';
import {openDrawer} from '../../../store/reducers/menu';
import {MenuOrientation} from '../../../types/config';
import Loader from '../../Loadable/Loader';
import {useLayout} from '../LayoutContext';

const MainLayout = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const {container, miniDrawer, menuOrientation} = useConfig();
  const menu = useSelector((state) => state.menu);
  const {drawerOpen} = menu;

  // Get loading state from LayoutContext
  const { isLoading, loadingMessage } = useLayout();

  const isHorizontal =
    menuOrientation === MenuOrientation.HORIZONTAL && !downLG;

  // Initialize drawer state on mount based on viewport
  useEffect(() => {
    if (!miniDrawer) {
      // Desktop (>= xl): open, Mobile (< xl): closed
      dispatch(openDrawer(!matchDownXL));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Handle responsive changes after mount
  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  if(isLoading){
    return (
    <div>
      <Loader />
      <Typography
        variant="h6"
        sx={{textAlign: 'center', mt: 2}}
      >
        {loadingMessage || 'Loading, please wait...'}
      </Typography>
    </div>
    )
  }

  return (
    <Box sx={{display: 'flex', width: '100%'}}>
      <Header />
      <Drawer />
      <Box
        component="main"
        sx={{
          width: downLG
            ? '100%'
            : drawerOpen
              ? 'calc(100% - 260px)'
              : 'calc(100% - 60px)',
          flexGrow: 1,
          p: {xs: 2, sm: 3},
          // Disable pointer events on mobile when drawer is open to allow backdrop clicks
          ...(downLG && drawerOpen && {
            pointerEvents: 'none',
          }),
          transition: theme.transitions.create(['width', 'pointer-events'], {
            easing: theme.transitions.easing.sharp,
            duration: drawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar sx={{mt: isHorizontal ? 8 : 'inherit'}} />
        <Container
          maxWidth={container ? 'xl' : false}
          sx={{
            ...(container && {px: {xs: 0, sm: 2}}),
            position: 'relative',
            minHeight: 'calc(100vh - 110px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} /> */}
          <Outlet />
          <Footer />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
