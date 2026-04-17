import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Box, IconButton, Stack, Tooltip, Typography, Toolbar, AppBar } from '@mui/material';
import {
  LayoutStateProvider,
  LayoutShell,
  LayoutHeader,
  LayoutDrawer,
  MainContent,
  Profile,
  Avatar,
  Logo,
} from '@mocho/ui/components';
import { height } from '@mui/system';

const ComponentLibrary = lazy(() => import('../pages/ComponentLibrary'));
const DetailLayoutDemo = lazy(() => import('../pages/DetailLayoutDemo'));
const ListLayoutDemo = lazy(() => import('../pages/ListLayoutDemo'));
const EditDrawerDemo = lazy(() => import('../pages/EditDrawerDemo'));
const EquipmentPreview = lazy(() => import('../pages/EquipmentPreview'));
const FormFieldsPreview = lazy(() => import('../pages/FormFieldsPreview'));

const ProfileHeaderSetup = () => {
  return (
    <AppBar
      sx={
        {
          // backgroundColor: 'primary.main',
          // border: '2px solid black',
          // height: 80,
        }
      }
    >
      Profile Header
    </AppBar>
  );
};

const ProfileFooterSetup = () => {
  return (
    <Box
      sx={{
        padding: 1,
        backgroundColor: 'primary.main',
        // border: '2px solid black',
        // height: 80,
      }}
    >
      Profile Footer
      {/* <Toolbar>Yo</Toolbar> */}
      {/* <Profile /> */}
    </Box>
  );
};

const ProfileLayout = ({ children }) => {
  return (
    <LayoutStateProvider disableMiniDrawer>
      <ProfileHeaderSetup />
      <MainContent>{children}</MainContent>
      <ProfileFooterSetup />
      {/* <LayoutShell sx={{ height: '100vh', overflow: 'hidden' }}> */}

      {/* </LayoutShell> */}
    </LayoutStateProvider>
  );
};

const DevRoutes: RouteObject[] = [
  {
    path: '/component-library',
    element: <ComponentLibrary />,
  },
  {
    path: '/dev/detail-layout',
    element: <DetailLayoutDemo />,
  },
  {
    path: '/dev/list-layout',
    element: <ListLayoutDemo />,
  },
  {
    path: '/dev/edit-drawer',
    element: <EditDrawerDemo />,
  },
  {
    path: '/dev/form-fields',
    element: <FormFieldsPreview />,
  },
  {
    path: '/dev/equipment-preview',
    element: (
      <ProfileLayout>
        <EquipmentPreview />
      </ProfileLayout>
    ),
  },
];

export default DevRoutes;
