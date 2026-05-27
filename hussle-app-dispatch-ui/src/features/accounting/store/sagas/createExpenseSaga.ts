import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { createExpense } from 'utils/api/accounting/expenseApi';
import { expenseActions } from '../reducers/expenseEntitySlice';
import {
  createExpenseSuccess,
  createExpenseFailure,
} from '../reducers/expensePageSlice';
import type { CreateExpenseInput } from '../../types';

export function* createExpenseSaga(action: PayloadAction<CreateExpenseInput>): Generator {
  try {
    const item = (yield call(createExpense, action.payload)) as SagaReturnType<
      typeof createExpense
    >;
    yield put(expenseActions.addOne(item));
    yield put(createExpenseSuccess(item));
    yield put(notify({ message: 'Expense created', variant: 'success' }));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create expense';
    yield put(createExpenseFailure(message));
    yield put(notify({ message: message, variant: 'error' }));
  }
}
