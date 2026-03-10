import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { markPaid } from 'utils/api/invoices/invoiceApi';
import type { PaymentInput } from '../../types';
import {
  markPaidRequest,
  markPaidSuccess,
  markPaidFailure,
} from '../reducers/invoicePageSlice';
import { invoiceActions } from '../reducers/invoiceEntitySlice';

export function* markPaidSaga(action: ReturnType<typeof markPaidRequest>): Generator {
  const { id, payment } = action.payload;

  try {
    const paymentInput: PaymentInput = {
      amount: payment.amount,
      method: payment.method as PaymentInput['method'],
      reference: payment.reference,
      paidAt: payment.paidAt,
    };

    const response = (yield call(markPaid, id, paymentInput)) as SagaReturnType<typeof markPaid>;

    yield put(invoiceActions.upsertOne(response.invoice));
    yield put(markPaidSuccess({ id }));
    yield call(enqueueSnackbar, 'Payment recorded', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to record payment';
    yield put(markPaidFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
