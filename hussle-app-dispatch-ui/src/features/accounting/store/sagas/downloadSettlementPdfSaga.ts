import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { downloadSettlementPdf } from 'utils/api/accounting/settlementApi';
import {
  downloadSettlementPdfRequest,
  downloadSettlementPdfSuccess,
  downloadSettlementPdfFailure,
} from '../reducers/settlementPageSlice';

export function* downloadSettlementPdfSaga(
  action: ReturnType<typeof downloadSettlementPdfRequest>,
): Generator {
  const { id, shortId } = action.payload;

  try {
    const blob = (yield call(
      downloadSettlementPdf,
      id,
    )) as SagaReturnType<typeof downloadSettlementPdf>;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `settlement-${shortId ?? id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    yield put(downloadSettlementPdfSuccess({ id }));
    yield call(enqueueSnackbar, 'Settlement PDF downloaded', { variant: 'success' });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to download settlement PDF';
    yield put(downloadSettlementPdfFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
