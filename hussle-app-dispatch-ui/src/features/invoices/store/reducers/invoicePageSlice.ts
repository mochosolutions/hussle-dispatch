import { createAction } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { createCrudSlice, createCrudSelectors } from '@mocho/ui/redux';

export const invoicePageSlice = createCrudSlice({
  name: 'invoice',
  entityName: 'invoice',
  entityNamePlural: 'invoices',
});

export const invoicePageSelectors = createCrudSelectors<RootState>(
  (state) => state.pages.invoices,
);

// Semantic action aliases
export const {
  fetchAllRequest: fetchInvoicesRequest,
  fetchAllSuccess: fetchInvoicesSuccess,
  fetchAllFailure: fetchInvoicesFailure,
  fetchByIdRequest: fetchInvoiceDetailsRequest,
  fetchByIdSuccess: fetchInvoiceDetailsSuccess,
  fetchByIdFailure: fetchInvoiceDetailsFailure,
  updateRequest: updateInvoiceRequest,
  updateSuccess: updateInvoiceSuccess,
  updateFailure: updateInvoiceFailure,
  deleteRequest: deleteInvoiceRequest,
  deleteSuccess: deleteInvoiceSuccess,
  deleteFailure: deleteInvoiceFailure,
} = invoicePageSlice.actions;

// ---------------------------------------------------------------------------
// Custom actions for invoice-specific operations
// ---------------------------------------------------------------------------

export const approveInvoiceRequest = createAction<{ id: string }>('invoice/approveInvoiceRequest');
export const approveInvoiceSuccess = createAction<{ id: string }>('invoice/approveInvoiceSuccess');
export const approveInvoiceFailure = createAction<{ id: string; error: string }>(
  'invoice/approveInvoiceFailure',
);

export const sendInvoiceRequest = createAction<{ id: string; recipientEmail: string }>(
  'invoice/sendInvoiceRequest',
);
export const sendInvoiceSuccess = createAction<{ id: string }>('invoice/sendInvoiceSuccess');
export const sendInvoiceFailure = createAction<{ id: string; error: string }>(
  'invoice/sendInvoiceFailure',
);

export const markPaidRequest = createAction<{
  id: string;
  payment: { amount: number; method: string; reference?: string; paidAt: string };
}>('invoice/markPaidRequest');
export const markPaidSuccess = createAction<{ id: string }>('invoice/markPaidSuccess');
export const markPaidFailure = createAction<{ id: string; error: string }>(
  'invoice/markPaidFailure',
);
