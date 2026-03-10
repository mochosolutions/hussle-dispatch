import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { invoiceSelectors } from '../reducers/invoiceEntitySlice';
import type { InvoiceListItem, InvoiceStatus } from '../../types';

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectAllInvoices = (state: RootState) => invoiceSelectors.selectAll(state);

export const selectInvoiceById = (id: string) => (state: RootState) =>
  invoiceSelectors.selectById(state, id);

// ---------------------------------------------------------------------------
// Page loading selectors
// ---------------------------------------------------------------------------

export const selectInvoiceListLoading = (state: RootState) =>
  state.pages.invoices.loading['getAll'] === LoadingState.Pending;

export const selectInvoiceDetailLoading = (id: string) => (state: RootState) =>
  state.pages.invoices.loading[`getById:${id}`] === LoadingState.Pending;

export const selectInvoiceDeleteLoading = (id: string) => (state: RootState) =>
  state.pages.invoices.loading[`delete:${id}`] === LoadingState.Pending;

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

export const selectInvoiceStatusCounts = createSelector(
  [selectAllInvoices],
  (invoices): Record<InvoiceStatus, number> => {
    const counts: Record<InvoiceStatus, number> = {
      DRAFT: 0,
      APPROVED: 0,
      SENT: 0,
      PARTIALLY_PAID: 0,
      PAID: 0,
      VOID: 0,
    };

    invoices.forEach((invoice) => {
      counts[invoice.status] += 1;
    });

    return counts;
  },
);

export const selectOverdueInvoiceCount = createSelector(
  [selectAllInvoices],
  (invoices): number => {
    const now = new Date();
    return invoices.filter((invoice) => {
      if (invoice.status === 'PAID' || invoice.status === 'VOID') {
        return false;
      }
      return new Date(invoice.dueDate) < now;
    }).length;
  },
);

export const selectInvoicesWithOverdueFlag = createSelector(
  [selectAllInvoices],
  (invoices): (InvoiceListItem & { isOverdue: boolean })[] => {
    const now = new Date();
    return invoices.map((invoice) => ({
      ...invoice,
      isOverdue:
        invoice.status !== 'PAID' &&
        invoice.status !== 'VOID' &&
        new Date(invoice.dueDate) < now,
    }));
  },
);
