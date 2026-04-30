import { createEntityModule } from '@mocho/ui/redux';
import type { ExpenseListItem } from '../../types';

export const expenseEntityModule = createEntityModule<ExpenseListItem>('expenses');
export const expenseActions = expenseEntityModule.actions;
export const expenseReducer = expenseEntityModule.reducer;
export const expenseSelectors = expenseEntityModule.selectors;
