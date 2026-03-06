import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const carrierPageSlice = createCrudSlice({
  name: 'carrierPage',
  entityName: 'carrier',
  entityNamePlural: 'carriers',
});

export const carrierPageSelectors = createCrudSelectors<RootState>((state) => state.pages.carriers);
