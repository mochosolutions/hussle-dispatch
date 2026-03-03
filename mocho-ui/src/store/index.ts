import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
} from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

import type { MenuProps } from '../types/menu';

interface LayoutRootState {
  menu: MenuProps;
}

const useSelector: TypedUseSelectorHook<LayoutRootState> = useReduxSelector;
const useDispatch: () => ReturnType<typeof useReduxDispatch> = useReduxDispatch;

export { useSelector, useDispatch };
export type { LayoutRootState };
