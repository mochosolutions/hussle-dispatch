import React, { useCallback } from 'react';

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
  const propsOnClose = activeDrawer?.drawerProps?.onClose as (() => void) | undefined;

  const composedOnClose = useCallback(() => {
    onClose();
    propsOnClose?.();
  }, [onClose, propsOnClose]);

  if (!activeDrawer) {
    return null;
  }

  const Component = componentLookup[activeDrawer.drawerType];

  if (!Component) {
    return null;
  }

  return <Component {...activeDrawer.drawerProps} onClose={composedOnClose} />;
};
