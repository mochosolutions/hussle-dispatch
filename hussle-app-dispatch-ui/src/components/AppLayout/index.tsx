import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { Outlet, useMatches, useNavigate } from 'react-router-dom';
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
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { LogoutOutlined } from '@ant-design/icons';
import { menuItems } from './menuItem';
import { formattedCurrentUserSelector } from '../../features/auth/store/selectors';
import { logoutRequest } from '../../features/auth/store/authSlice';
import { fetchCountsRequest } from '../../features/invoices/store/reducers/invoicePageSlice';
import { selectInvoiceDraftCount } from '../../features/invoices/store/selectors/invoiceSelectors';
import { useSelector, useDispatch } from '../../store';
import type { NavItemType } from '@mocho/ui/types';

const UserFooter = ({ onLogout }: { onLogout: () => void }) => {
  const user = useSelector(formattedCurrentUserSelector);
  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        alt="profile user"
        sx={{ width: 32, height: 32 }}
      />
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" textTransform="capitalize" noWrap>
          {user?.name} - {user?.role}
        </Typography>
        <Typography variant="body2" noWrap>
          {user?.orgName}
        </Typography>
      </Stack>
      <Tooltip title="Logout">
        <IconButton
          onClick={onLogout}
          size="small"
          aria-label="logout"
          sx={{ color: 'grey.400', '&:hover': { color: 'common.white' } }}
        >
          <LogoutOutlined />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

const validContainerMaxWidths = ['sm', 'md', 'lg', 'xl'];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

type AppLayoutMainContentProps = Pick<
  ComponentProps<typeof MainContent>,
  'container' | 'contentPadding' | 'containerMaxWidth' | 'showToolbarSpacer'
>;

interface AppLayoutHandle {
  mainContentProps?: AppLayoutMainContentProps;
}

const isAppLayoutHandle = (value: unknown): value is AppLayoutHandle => {
  if (!isRecord(value)) {
    return false;
  }

  if (!('mainContentProps' in value)) {
    return true;
  }

  const { mainContentProps } = value;

  if (!isRecord(mainContentProps)) {
    return false;
  }

  if ('container' in mainContentProps && typeof mainContentProps.container !== 'boolean') {
    return false;
  }

  if ('contentPadding' in mainContentProps) {
    const { contentPadding } = mainContentProps;

    if (
      contentPadding !== undefined &&
      typeof contentPadding !== 'number' &&
      typeof contentPadding !== 'string' &&
      !isRecord(contentPadding)
    ) {
      return false;
    }
  }

  if ('showToolbarSpacer' in mainContentProps) {
    if (typeof mainContentProps.showToolbarSpacer !== 'boolean') {
      return false;
    }
  }

  if ('containerMaxWidth' in mainContentProps) {
    const { containerMaxWidth } = mainContentProps;
    const isValidSize =
      typeof containerMaxWidth === 'string' && validContainerMaxWidths.includes(containerMaxWidth);

    if (containerMaxWidth !== false && !isValidSize) {
      return false;
    }
  }

  return true;
};

const AppLayout = () => {
  const matches = useMatches();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const formattedUser = useSelector(formattedCurrentUserSelector);
  const draftCount = useSelector(selectInvoiceDraftCount);

  useEffect(() => {
    dispatch(fetchCountsRequest());
  }, [dispatch]);

  const dynamicMenuItems: NavItemType[] = useMemo(() => {
    if (draftCount <= 0) {
      return menuItems;
    }

    return menuItems.map((group) => ({
      ...group,
      children: group.children?.map((item) => {
        if (item.id === 'invoices') {
          return {
            ...item,
            chip: {
              label: String(draftCount),
              color: 'warning' as const,
              size: 'small' as const,
              variant: 'filled' as const,
            },
          };
        }
        return item;
      }),
    }));
  }, [draftCount]);

  const handleNavigateToSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    dispatch(logoutRequest());
  }, [dispatch]);

  const mainContentProps = matches.reduce<AppLayoutMainContentProps>((accumulator, match) => {
    if (!isAppLayoutHandle(match.handle) || match.handle.mainContentProps === undefined) {
      return accumulator;
    }

    return {
      ...accumulator,
      ...match.handle.mainContentProps,
    };
  }, {});

  return (
    <LayoutStateProvider disableMiniDrawer>
      <LayoutShell sx={{ height: '100vh', overflow: 'hidden' }}>
        <LayoutHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Profile
              user={formattedUser ? { name: formattedUser.name, organizationName: formattedUser.orgName } : undefined}
              onLogout={handleLogout}
              onSettings={handleNavigateToSettings}
            />
          </Box>
        </LayoutHeader>
        <LayoutDrawer
          logo={<Logo text="Hussle Dispatch" reverse />}
          menuItems={dynamicMenuItems}
          paperStyles={{
            backgroundColor: 'primary.dark',
            color: 'grey.300',
            '& .MuiTypography-h6': {
              color: 'grey.300',
            },
            '& .MuiListItemIcon-root': {
              color: 'grey.400',
            },
            '& .MuiListItemButton-root:hover': {
              backgroundColor: 'primary.900',
            },
            '& .MuiListItemButton-root.Mui-selected': {
              backgroundColor: 'primary.900',
              '& .MuiTypography-h6': {
                color: 'common.white',
              },
              '& .MuiListItemIcon-root': {
                color: 'primary.light',
              },
              '&:hover': {
                backgroundColor: 'primary.900',
              },
            },
            '& .MuiTypography-caption': {
              color: 'grey.400',
            },
          }}
          headerStyles={{
            borderBottom: 1,
            borderColor: 'primary.900',
            px: 2,
          }}
          footer={<UserFooter onLogout={handleLogout} />}
        />
        <MainContent {...mainContentProps}>
          <Outlet />
        </MainContent>
      </LayoutShell>
    </LayoutStateProvider>
  );
};

export default AppLayout;
