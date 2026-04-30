import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from 'store';
import { expenseSelectors } from '../reducers/expenseEntitySlice';
import type { ExpenseFilters } from '../reducers/expensePageSlice';
import type { ExpenseListItem } from '../../types';

// ---------------------------------------------------------------------------
// Entity selectors
// ---------------------------------------------------------------------------

export const selectExpensesAll = (state: RootState): ExpenseListItem[] =>
  expenseSelectors.selectAll(state);

// ---------------------------------------------------------------------------
// Page slice selectors
// ---------------------------------------------------------------------------

export const selectExpenseListLoading = (state: RootState): boolean =>
  state.pages.expenses.loading;

export const selectExpenseError = (state: RootState): string | null =>
  state.pages.expenses.error;

export const selectExpenseFilters = (state: RootState): ExpenseFilters =>
  state.pages.expenses.filters;

export const selectExpenseHasLoadedOnce = (state: RootState): boolean =>
  state.pages.expenses.hasLoadedOnce;

export const selectExpenseLastFetchedAt = (state: RootState): number | null =>
  state.pages.expenses.lastFetchedAt;

export const selectExpenseTotalCount = (state: RootState): number =>
  state.pages.expenses.totalCount;

export const selectExpenseCreateLoading = (state: RootState): boolean =>
  state.pages.expenses.creating.loading;

export const selectExpenseCreateError = (state: RootState): string | null =>
  state.pages.expenses.creating.error;

// ---------------------------------------------------------------------------
// Filtered selectors
// ---------------------------------------------------------------------------

const matchesFilters = (expense: ExpenseListItem, filters: ExpenseFilters): boolean => {
  if (filters.category && filters.category !== 'ALL' && expense.category !== filters.category) {
    return false;
  }
  if (filters.dateFrom && expense.date < filters.dateFrom) {
    return false;
  }
  if (filters.dateTo && expense.date > filters.dateTo) {
    return false;
  }
  if (filters.query) {
    const query = filters.query.toLowerCase();
    const description = (expense.description ?? '').toLowerCase();
    const unit = (expense.vehicleUnitNumber ?? '').toLowerCase();
    const category = expense.category.toLowerCase();
    if (
      !description.includes(query) &&
      !unit.includes(query) &&
      !category.includes(query)
    ) {
      return false;
    }
  }
  return true;
};

export const selectFilteredExpenses = (filters: ExpenseFilters) =>
  createSelector([selectExpensesAll], (expenses) =>
    expenses.filter((expense) => matchesFilters(expense, filters)),
  );
