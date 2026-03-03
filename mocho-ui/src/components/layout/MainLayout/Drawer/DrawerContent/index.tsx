import type { ReactNode } from 'react';

import Navigation from './Navigation';
import SimpleBar from '../../../../third-party/SimpleBar';
import type { NavItemType } from '../../../../../types/menu';

interface DrawerContentProps {
  menuItems?: NavItemType[];
  children?: ReactNode;
}

const DrawerContent = ({ menuItems = [], children }: DrawerContentProps) => (
  <SimpleBar
    sx={{
      '& .simplebar-content': {
        display: 'flex',
        flexDirection: 'column',
      },
    }}
  >
    {children ?? <Navigation menuItems={menuItems} />}
  </SimpleBar>
);

export default DrawerContent;
