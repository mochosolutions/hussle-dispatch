import type React from 'react';

import type { DrawerState, PopupComponentMap } from '../../types/popup';

interface DrawerManagerProps {
  activeDrawer: DrawerState | null;
  componentLookup: PopupComponentMap;
  onClose: () => void;
}

export const DrawerManager: React.FC<DrawerManagerProps> = ({
  activeDrawer,
  componentLookup,
  onClose,
}) => {
  if (!activeDrawer) {
    return null;
  }

  const Component = componentLookup[activeDrawer.drawerType];

  if (!Component) {
    return null;
  }

  return <Component onClose={onClose} {...activeDrawer.drawerProps} />;
};
