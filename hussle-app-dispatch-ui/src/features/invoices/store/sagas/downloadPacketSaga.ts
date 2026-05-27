import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { downloadInvoicePacket } from 'utils/api/invoices/invoiceApi';
import {
  downloadPacketRequest,
  downloadPacketSuccess,
  downloadPacketFailure,
} from '../reducers/invoicePageSlice';

export function* downloadPacketSaga(
  action: ReturnType<typeof downloadPacketRequest>,
): Generator {
  const { id, invoiceNumber } = action.payload;

  try {
    const blob = (yield call(
      downloadInvoicePacket,
      id,
    )) as SagaReturnType<typeof downloadInvoicePacket>;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      invoiceNumber !== undefined && invoiceNumber.length > 0
        ? `Invoice_${invoiceNumber}_Packet.zip`
        : `invoice-${id}-packet.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    yield put(downloadPacketSuccess({ id }));
    yield put(notify({ message: 'Invoice packet downloaded', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download invoice packet';
    yield put(downloadPacketFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
