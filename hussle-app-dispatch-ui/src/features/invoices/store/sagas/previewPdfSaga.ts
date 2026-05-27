import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { previewInvoicePdf } from 'utils/api/invoices/invoiceApi';
import {
  previewPdfRequest,
  previewPdfSuccess,
  previewPdfFailure,
} from '../reducers/invoicePageSlice';

export function* previewPdfSaga(
  action: ReturnType<typeof previewPdfRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const blob = (yield call(
      previewInvoicePdf,
      id,
    )) as SagaReturnType<typeof previewInvoicePdf>;

    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    yield put(previewPdfSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to preview invoice PDF';
    yield put(previewPdfFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
