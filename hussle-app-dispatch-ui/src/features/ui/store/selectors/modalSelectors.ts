import type { RootState } from 'store';

export const currentModalSelector = (state: RootState) => state.pages.ui.modal ?? null;
