import { useDispatch } from 'store';
import { openDrawer, closeDrawer } from '../store/reducers/uiSlice';
import type { DrawerType, DrawerTypeMap } from '../types/popupTypes';

interface DrawerOptions {
  anchor?: 'left' | 'right';
  width?: number;
  disableBackdropClose?: boolean;
}

export const useDrawerActions = () => {
  const dispatch = useDispatch();

  return {
    openDrawer: <T extends DrawerType>(
      drawerType: T,
      drawerProps: DrawerTypeMap[T],
      options?: DrawerOptions,
    ) => dispatch(openDrawer({ drawerType, drawerProps, ...options })),
    closeDrawer: () => dispatch(closeDrawer()),
  };
};
