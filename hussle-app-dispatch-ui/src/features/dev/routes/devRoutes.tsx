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
const FormFieldsPreview = lazy(() => import('../pages/FormFieldsPreview'));
const OnboardingPreviewIndex = lazy(
  () => import('features/carrier-portal/dev/OnboardingPreview'),
);
const WelcomeSegmentationPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/WelcomeSegmentationPreview'
    ),
);
const PortalShellPreview = lazy(
  () =>
    import('features/carrier-portal/dev/OnboardingPreview/previews/PortalShellPreview'),
);
const CompanyAuthorityPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/CompanyAuthorityPreview'
    ),
);
const LanePreferencesPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/LanePreferencesPreview'
    ),
);
const EquipmentEntryPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/EquipmentEntryPreview'
    ),
);
const DriversListPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/DriversListPreview'
    ),
);
const CostAnalysisPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/CostAnalysisPreview'
    ),
);
const SignAgreementPreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/SignAgreementPreview'
    ),
);
const LockedStatePreview = lazy(
  () =>
    import(
      'features/carrier-portal/dev/OnboardingPreview/previews/LockedStatePreview'
    ),
);

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
    path: '/dev/onboarding-preview',
    element: <OnboardingPreviewIndex />,
  },
  {
    path: '/dev/onboarding-preview/welcome-segmentation',
    element: <WelcomeSegmentationPreview />,
  },
  {
    path: '/dev/onboarding-preview/portal-shell',
    element: <PortalShellPreview />,
  },
  {
    path: '/dev/onboarding-preview/company-authority',
    element: <CompanyAuthorityPreview />,
  },
  {
    path: '/dev/onboarding-preview/lane-preferences',
    element: <LanePreferencesPreview />,
  },
  {
    path: '/dev/onboarding-preview/equipment-entry',
    element: <EquipmentEntryPreview />,
  },
  {
    path: '/dev/onboarding-preview/drivers-list',
    element: <DriversListPreview />,
  },
  {
    path: '/dev/onboarding-preview/cost-analysis',
    element: <CostAnalysisPreview />,
  },
  {
    path: '/dev/onboarding-preview/sign-agreement',
    element: <SignAgreementPreview />,
  },
  {
    path: '/dev/onboarding-preview/locked-state',
    element: <LockedStatePreview />,
  },
];

export default DevRoutes;
