import { createEntityModule } from '@mocho/ui/redux';
import type { Customer } from '../../types';

export const customerEntityModule = createEntityModule<Customer>('customers');
export const customerActions = customerEntityModule.actions;
export const customerReducer = customerEntityModule.reducer;
export const customerSelectors = customerEntityModule.selectors;
