import { createEntityModule } from '@mocho/ui/redux';
import type { SettlementListItem } from '../../types';

export const settlementEntityModule = createEntityModule<SettlementListItem>('settlements');
export const settlementActions = settlementEntityModule.actions;
export const settlementReducer = settlementEntityModule.reducer;
export const settlementSelectors = settlementEntityModule.selectors;
