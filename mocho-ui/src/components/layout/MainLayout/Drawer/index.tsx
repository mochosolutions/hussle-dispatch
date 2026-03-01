import {useMemo} from 'react';

// material-ui
import {useTheme} from '@mui/material/styles';
import {Box, Drawer, useMediaQuery} from '@mui/material';

// project import
import DrawerHeader from './DrawerHeader';
import DrawerContent from './DrawerContent';
import MiniDrawerStyled from './MiniDrawerStyled';

import {DRAWER_WIDTH} from '../../../../config';
import {useDispatch, useSelector} from '../../../../store';
import {openDrawer} from '../../../../store/reducers/menu';

// ==============================|| MAIN LAYOUT - DRAWER ||============================== //

interface Props {
  window?: () => Window;
}

const MainDrawer = ({window}: Props) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const matchDownMD = useMediaQuery(theme.breakpoints.down('lg'));

  const menu = useSelector((state) => state.menu);
  const {drawerOpen} = menu;

  console.log("Drawer render", drawerOpen);

  // responsive drawer container
  const container =
    window !== undefined ? () => window().document.body : undefined;

  // header content
  const drawerContent = useMemo(() => <DrawerContent />, []);
  const drawerHeader = useMemo(
    () => <DrawerHeader open={drawerOpen} />,
    [drawerOpen],
  );

  // Desktop: Wrap in Box with nav role
  if (!matchDownMD) {
    return (
      <Box
        component="nav"
        sx={{flexShrink: {md: 0}, zIndex: 1200}}
        aria-label="mailbox folders"
      >
        <MiniDrawerStyled variant="permanent" open={drawerOpen}>
          {drawerHeader}
          {drawerContent}
        </MiniDrawerStyled>
      </Box>
    );
  }

  console.log("Rendering mobile drawer, open:", drawerOpen);

  // Mobile: Render Drawer directly without Box wrapper to avoid stacking context issues
  return (
    <Drawer
      container={container}
      variant="temporary"
      open={drawerOpen}
      onClose={() => {
        dispatch(openDrawer(false));
      }}
      ModalProps={{
        keepMounted: true,
        slotProps: {
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          }
        }
      }}
      sx={{
        display: {xs: 'block', lg: 'none'},
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: DRAWER_WIDTH,
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundImage: 'none',
          boxShadow: 'inherit',
        },
      }}
    >
      {drawerHeader}
      {drawerContent}
    </Drawer>
  );
};

export default MainDrawer;
