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

export const createFromLoadRequest = createAction<{ loadId: string }>(
  'invoice/createFromLoadRequest',
);
export const createFromLoadSuccess = createAction<{ id: string }>('invoice/createFromLoadSuccess');
export const createFromLoadFailure = createAction<{ error: string }>(
  'invoice/createFromLoadFailure',
);

export const voidInvoiceRequest = createAction<{ id: string }>('invoice/voidInvoiceRequest');
export const voidInvoiceSuccess = createAction<{ id: string }>('invoice/voidInvoiceSuccess');
export const voidInvoiceFailure = createAction<{ id: string; error: string }>(
  'invoice/voidInvoiceFailure',
);

export const downloadPacketRequest = createAction<{ id: string }>('invoice/downloadPacketRequest');
export const downloadPacketSuccess = createAction<{ id: string }>('invoice/downloadPacketSuccess');
export const downloadPacketFailure = createAction<{ id: string; error: string }>(
  'invoice/downloadPacketFailure',
);

export const previewPdfRequest = createAction<{ id: string }>('invoice/previewPdfRequest');
export const previewPdfSuccess = createAction<{ id: string }>('invoice/previewPdfSuccess');
export const previewPdfFailure = createAction<{ id: string; error: string }>(
  'invoice/previewPdfFailure',
);

export const fetchCountsRequest = createAction('invoice/fetchCountsRequest');
export const fetchCountsSuccess = createAction<{ counts: { draft: number } }>(
  'invoice/fetchCountsSuccess',
);
export const fetchCountsFailure = createAction<{ error: string }>('invoice/fetchCountsFailure');
