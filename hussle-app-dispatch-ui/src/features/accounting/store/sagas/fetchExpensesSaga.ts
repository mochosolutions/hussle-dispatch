import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getExpenses } from 'utils/api/accounting/expenseApi';
import { expenseActions } from '../reducers/expenseEntitySlice';
import {
  fetchExpensesSuccess,
  fetchExpensesFailure,
  type FetchExpensesPayload,
} from '../reducers/expensePageSlice';
import { selectExpenseFilters } from '../selectors/expenseSelectors';

export function* fetchExpensesSaga(
  action: PayloadAction<FetchExpensesPayload | undefined>,
): Generator {
  try {
    const filters = (yield select(selectExpenseFilters)) as ReturnType<typeof selectExpenseFilters>;

    const params: Parameters<typeof getExpenses>[0] = {
      page: action.payload?.page ?? 1,
      limit: action.payload?.limit ?? 500,
    };

    if (filters.category && filters.category !== 'ALL') {
      params.category = filters.category;
    }
    if (filters.query) {
      params.search = filters.query;
    }
    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }
    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }

    const result = (yield call(getExpenses, params)) as SagaReturnType<typeof getExpenses>;

    yield put(expenseActions.setAll(result.data));
    yield put(
      fetchExpensesSuccess({
        items: result.data,
        totalCount: result.meta.total,
      }),
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load expenses';
    yield put(fetchExpensesFailure(message));
    yield put(notify({ message: message, variant: 'error' }));
  }
}
