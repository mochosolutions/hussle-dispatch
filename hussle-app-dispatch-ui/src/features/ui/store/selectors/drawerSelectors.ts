import type { RootState } from 'store';

export const currentDrawerSelector = (state: RootState) => state.pages.ui.drawer ?? null;

export const isDrawerOpenSelector = (state: RootState) => state.pages.ui.drawer !== null;
