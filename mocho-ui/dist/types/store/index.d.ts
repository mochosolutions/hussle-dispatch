import { useDispatch as useReduxDispatch, TypedUseSelectorHook } from 'react-redux';
import { MenuProps } from '../types/menu';
interface LayoutRootState {
    menu: MenuProps;
}
declare const useSelector: TypedUseSelectorHook<LayoutRootState>;
declare const useDispatch: () => ReturnType<typeof useReduxDispatch>;
export { useSelector, useDispatch };
export type { LayoutRootState };
//# sourceMappingURL=index.d.ts.map