import { RootState } from 'store';

export const currentDrawerSelector = (state: RootState) => state.ui.drawer;

export const isDrawerOpenSelector = (state: RootState) => state.ui.drawer !== null;
