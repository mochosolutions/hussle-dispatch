import { createEntityModule } from '@mocho/ui/redux';
import type { InvoiceListItem } from '../../types';

export const invoiceEntityModule = createEntityModule<InvoiceListItem>('invoices');
export const invoiceActions = invoiceEntityModule.actions;
export const invoiceReducer = invoiceEntityModule.reducer;
export const invoiceSelectors = invoiceEntityModule.selectors;
