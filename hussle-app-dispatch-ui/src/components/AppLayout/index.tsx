import {
  LayoutStateProvider,
  LayoutShell,
  LayoutHeader,
  LayoutDrawer,
  MainContent,
  Profile,
} from '@mocho/ui/components';
import type { NavItemType } from '@mocho/ui/types';
import type { ComponentProps } from 'react';
import { Outlet, useMatches } from 'react-router-dom';

const menuItems: NavItemType[] = [
  {
    id: 'navigation',
    title: 'Navigation',
    type: 'group',
    children: [
      { id: 'dashboard', title: 'Dashboard', type: 'item', url: '/' },
      { id: 'dispatch-board', title: 'Dispatch Board', type: 'item', url: '/dispatch-board' },
      {
        id: 'create-load',
        title: 'Create Load',
        type: 'item',
        url: '/dispatch-board/create-load',
      },
      {
        id: 'load-intelligence',
        title: 'Load Intelligence',
        type: 'item',
        url: '/load-intelligence',
      },
      {
        id: 'fleet',
        title: 'Fleet',
        type: 'collapse',
        url: '/fleet',
        children: [
          { id: 'carriers', title: 'Carriers', type: 'item', url: '/fleet/carriers' },
          { id: 'drivers', title: 'Drivers', type: 'item', url: '/fleet/drivers' },
          { id: 'vehicles', title: 'Vehicles', type: 'item', url: '/fleet/vehicles' },
          { id: 'contacts', title: 'Contacts', type: 'item', url: '/fleet/contacts' },
        ],
      },
      { id: 'invoices', title: 'Invoices', type: 'item', url: '/invoices' },
    ],
  },
];

const user = {
  name: 'John Doe',
  organizationName: 'Hussle',
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
    <LayoutStateProvider>
      <LayoutShell>
        <LayoutHeader>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: 'auto',
            }}
          >
            <Profile user={user} />
          </div>
        </LayoutHeader>
        <LayoutDrawer
          menuItems={menuItems}
          paperStyles={{}}
          headerStyles={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
          }}
        />
        <MainContent {...mainContentProps}>
          <Outlet />
          {/* <LayoutFooter /> */}
        </MainContent>
      </LayoutShell>
    </LayoutStateProvider>
  );
};

export default AppLayout;
