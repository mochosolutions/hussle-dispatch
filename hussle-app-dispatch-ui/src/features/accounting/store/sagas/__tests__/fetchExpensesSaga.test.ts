import { runSaga } from 'redux-saga';
import { fetchExpensesSaga } from '../fetchExpensesSaga';
import * as expenseApi from 'utils/api/accounting/expenseApi';
import {
  fetchExpensesRequest,
  fetchExpensesSuccess,
  fetchExpensesFailure,
} from '../../reducers/expensePageSlice';
import { expenseActions } from '../../reducers/expenseEntitySlice';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import type { ExpenseListItem } from '../../../types';

const mockState = {
  pages: {
    expenses: {
      filters: {
        category: 'ALL',
        dateFrom: null,
        dateTo: null,
        query: '',
      },
    },
  },
};

describe('fetchExpensesSaga', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('dispatches setAll + success when the API returns expenses', async () => {
    const items: ExpenseListItem[] = [
      {
        id: 'e1',
        category: 'FUEL',
        description: 'Diesel fuel',
        amount: '125.50',
        date: '2026-04-01',
        vehicleId: 'v1',
        vehicleUnitNumber: 'T-101',
        state: 'TX',
        gallons: '40',
        fuelType: 'DIESEL',
      },
    ];

    const spy = jest.spyOn(expenseApi, 'getExpenses').mockResolvedValue({
      data: items,
      meta: { total: 1, page: 1, limit: 100 },
    });

    const dispatched: unknown[] = [];

    await runSaga(
      {
        dispatch: (a) => dispatched.push(a),
        getState: () => mockState,
      },
      fetchExpensesSaga,
      fetchExpensesRequest(),
    ).toPromise();

    expect(spy).toHaveBeenCalled();
    expect(dispatched).toContainEqual(expenseActions.setAll(items));
    expect(dispatched).toContainEqual(
      fetchExpensesSuccess({ items, totalCount: 1 }),
    );
  });

  it('dispatches failure and shows error toast when the API call fails', async () => {
    jest.spyOn(expenseApi, 'getExpenses').mockRejectedValue(new Error('boom'));

    const dispatched: unknown[] = [];

    await runSaga(
      {
        dispatch: (a) => dispatched.push(a),
        getState: () => mockState,
      },
      fetchExpensesSaga,
      fetchExpensesRequest(),
    ).toPromise();

    expect(dispatched).toContainEqual(fetchExpensesFailure('boom'));
    expect(dispatched).toContainEqual(
      expect.objectContaining({
        type: notify.type,
        payload: expect.objectContaining({ message: 'boom', variant: 'error' }),
      }),
    );
  });
});
