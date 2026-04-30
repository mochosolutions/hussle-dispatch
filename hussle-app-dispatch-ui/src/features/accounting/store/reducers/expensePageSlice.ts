import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { CreateExpenseInput, ExpenseListItem } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpenseFilters {
  category: string;
  dateFrom: string | null;
  dateTo: string | null;
  query: string;
}

export interface ExpenseCreateState {
  loading: boolean;
  error: string | null;
}

export interface ExpensePageState {
  loading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  hasLoadedOnce: boolean;
  lastFetchedAt: number | null;
  totalCount: number;
  creating: ExpenseCreateState;
}

export interface FetchExpensesPayload {
  page?: number;
  limit?: number;
}

export interface FetchExpensesSuccessPayload {
  items: ExpenseListItem[];
  totalCount: number;
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: ExpensePageState = {
  loading: false,
  error: null,
  filters: {
    category: 'ALL',
    dateFrom: null,
    dateTo: null,
    query: '',
  },
  hasLoadedOnce: false,
  lastFetchedAt: null,
  totalCount: 0,
  creating: {
    loading: false,
    error: null,
  },
};

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const expensePageSlice = createSlice({
  name: 'expensePage',
  initialState,
  reducers: {
    fetchExpensesRequest: (state, _action: PayloadAction<FetchExpensesPayload | undefined>) => {
      state.loading = true;
      state.error = null;
    },
    fetchExpensesSuccess: (state, action: PayloadAction<FetchExpensesSuccessPayload>) => {
      state.loading = false;
      state.error = null;
      state.totalCount = action.payload.totalCount;
      state.hasLoadedOnce = true;
      state.lastFetchedAt = Date.now();
    },
    fetchExpensesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createExpenseRequest: (state, _action: PayloadAction<CreateExpenseInput>) => {
      state.creating.loading = true;
      state.creating.error = null;
    },
    createExpenseSuccess: (state, _action: PayloadAction<ExpenseListItem>) => {
      state.creating.loading = false;
      state.creating.error = null;
      state.totalCount += 1;
    },
    createExpenseFailure: (state, action: PayloadAction<string>) => {
      state.creating.loading = false;
      state.creating.error = action.payload;
    },
    setExpenseFilters: (state, action: PayloadAction<Partial<ExpenseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  fetchExpensesRequest,
  fetchExpensesSuccess,
  fetchExpensesFailure,
  createExpenseRequest,
  createExpenseSuccess,
  createExpenseFailure,
  setExpenseFilters,
} = expensePageSlice.actions;

export const expensePageReducer = expensePageSlice.reducer;
