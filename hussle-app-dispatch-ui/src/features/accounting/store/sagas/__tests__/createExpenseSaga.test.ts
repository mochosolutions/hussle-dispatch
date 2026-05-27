import { runSaga } from 'redux-saga';
import { createExpenseSaga } from '../createExpenseSaga';
import * as expenseApi from 'utils/api/accounting/expenseApi';
import {
  createExpenseRequest,
  createExpenseSuccess,
  createExpenseFailure,
} from '../../reducers/expensePageSlice';
import { expenseActions } from '../../reducers/expenseEntitySlice';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import type { CreateExpenseInput, ExpenseListItem } from '../../../types';

const baseInput: CreateExpenseInput = {
  category: 'FUEL',
  amount: 125.5,
  date: '2026-04-01',
  vehicleId: 'v1',
};

describe('createExpenseSaga', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('adds the entity, dispatches success, and shows success toast', async () => {
    const created: ExpenseListItem = {
      id: 'e1',
      category: 'FUEL',
      description: null,
      amount: '125.50',
      date: '2026-04-01',
      vehicleId: 'v1',
      vehicleUnitNumber: 'T-101',
      state: null,
      gallons: null,
      fuelType: null,
    };

    const spy = jest.spyOn(expenseApi, 'createExpense').mockResolvedValue(created);

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      createExpenseSaga,
      createExpenseRequest(baseInput),
    ).toPromise();

    expect(spy).toHaveBeenCalledWith(baseInput);
    expect(dispatched).toContainEqual(expenseActions.addOne(created));
    expect(dispatched).toContainEqual(createExpenseSuccess(created));
    expect(dispatched).toContainEqual(
      expect.objectContaining({
        type: notify.type,
        payload: expect.objectContaining({
          message: 'Expense created',
          variant: 'success',
        }),
      }),
    );
  });

  it('dispatches failure and shows error toast when the API call fails', async () => {
    jest.spyOn(expenseApi, 'createExpense').mockRejectedValue(new Error('bad input'));

    const dispatched: unknown[] = [];

    await runSaga(
      { dispatch: (a) => dispatched.push(a) },
      createExpenseSaga,
      createExpenseRequest(baseInput),
    ).toPromise();

    expect(dispatched).toContainEqual(createExpenseFailure('bad input'));
    expect(dispatched).toContainEqual(
      expect.objectContaining({
        type: notify.type,
        payload: expect.objectContaining({
          message: 'bad input',
          variant: 'error',
        }),
      }),
    );
  });
});
