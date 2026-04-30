import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { LoadingState } from '@mocho/ui/redux';
import { invoiceSelectors } from '../reducers/invoiceEntitySlice';
import type { InvoiceCounts, InvoiceListItem, InvoiceStatus } from '../../types';
import formatPhone from 'utils/formatPhone';

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectAllInvoices = (state: RootState) => invoiceSelectors.selectAll(state);

export const selectInvoiceById = (id: string) =>
  createSelector(
    [(state: RootState) => invoiceSelectors.selectById(state, id)],
    (invoice) => {
      if (!invoice) return undefined;
      return {
        ...invoice,
        carrier: invoice.carrier
          ? { ...invoice.carrier, phone: formatPhone(invoice.carrier.phone) }
          : invoice.carrier,
      };
    },
  );

// ---------------------------------------------------------------------------
// Page loading selectors
// ---------------------------------------------------------------------------

export const selectInvoiceListLoading = (state: RootState) => {
  const status = state.pages.invoices.loading['getAll'];
  return status === undefined || status === LoadingState.Pending;
};

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
      OVERDUE: 0,
      VOID: 0,
    };

    const now = new Date();
    invoices.forEach((invoice) => {
      if (invoice.status in counts) {
        counts[invoice.status] += 1;
      }
      // Count overdue invoices (SENT or PARTIALLY_PAID with past due date)
      if (
        invoice.status !== 'PAID' &&
        invoice.status !== 'VOID' &&
        new Date(invoice.dueDate) < now
      ) {
        counts.OVERDUE += 1;
      }
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

// ---------------------------------------------------------------------------
// Invoice counts selector
// ---------------------------------------------------------------------------

export const selectInvoiceCounts = (state: RootState): InvoiceCounts | null =>
  state.pages.invoiceCounts.counts;

export const selectInvoiceDraftCount = (state: RootState): number =>
  state.pages.invoiceCounts.counts?.draft ?? 0;

// ---------------------------------------------------------------------------
// List page filtering selectors
// ---------------------------------------------------------------------------

export interface InvoiceListFilters {
  selectedStatuses: InvoiceStatus[];
  overdueOnly: boolean;
  missingBolOnly: boolean;
  searchQuery: string;
}

export const selectFilteredInvoices = (filters: InvoiceListFilters) =>
  createSelector([selectInvoicesWithOverdueFlag], (invoices) => {
    let result = invoices;

    if (filters.selectedStatuses.length > 0) {
      result = result.filter((inv) => filters.selectedStatuses.includes(inv.status));
    }

    if (filters.overdueOnly) {
      result = result.filter((inv) => inv.isOverdue);
    }

    if (filters.missingBolOnly) {
      result = result.filter((inv) => inv.missingSignedBol);
    }

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          (inv.load?.loadNumber.toLowerCase().includes(query) ?? false) ||
          (inv.carrier?.name.toLowerCase().includes(query) ?? false),
      );
    }

    return result;
  });

// ---------------------------------------------------------------------------
// KPI selectors
// ---------------------------------------------------------------------------

export interface InvoiceKpiItem {
  label: string;
  value: string | number;
  subtitle?: string;
}

const formatCurrency = (amount: number): string =>
  `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const selectInvoiceKpis = (filters: InvoiceListFilters) =>
  createSelector([selectFilteredInvoices(filters)], (invoices): InvoiceKpiItem[] => {
    const total = invoices.length;
    const draftCount = invoices.filter((inv) => inv.status === 'DRAFT').length;
    const overdueCount = invoices.filter((inv) => inv.isOverdue).length;

    const outstandingAmount = invoices.reduce((sum, inv) => {
      if (inv.status === 'PAID' || inv.status === 'VOID') {
        return sum;
      }
      const total = Number(inv.totalAmount ?? '0');
      const paid = Number(inv.paidAmount ?? '0');
      return sum + (total - paid);
    }, 0);

    return [
      { label: 'Total Invoices', value: String(total) },
      { label: 'Drafts', value: String(draftCount) },
      { label: 'Overdue', value: String(overdueCount) },
      { label: 'Outstanding', value: formatCurrency(outstandingAmount) },
    ];
  });
