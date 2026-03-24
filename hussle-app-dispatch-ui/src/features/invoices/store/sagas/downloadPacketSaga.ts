import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { downloadInvoicePacket } from 'utils/api/invoices/invoiceApi';
import {
  downloadPacketRequest,
  downloadPacketSuccess,
  downloadPacketFailure,
} from '../reducers/invoicePageSlice';

export function* downloadPacketSaga(
  action: ReturnType<typeof downloadPacketRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const blob = (yield call(
      downloadInvoicePacket,
      id,
    )) as SagaReturnType<typeof downloadInvoicePacket>;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${id}-packet.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    yield put(downloadPacketSuccess({ id }));
    yield call(enqueueSnackbar, 'Invoice packet downloaded', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download invoice packet';
    yield put(downloadPacketFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
