import { createEntityModule } from '@mocho/ui/redux';
import type { OrgSettings } from '../../types';

export const settingsEntityModule = createEntityModule<OrgSettings>('orgSettings');
export const settingsEntityActions = settingsEntityModule.actions;
export const settingsEntityReducer = settingsEntityModule.reducer;
export const settingsEntitySelectors = settingsEntityModule.selectors;
