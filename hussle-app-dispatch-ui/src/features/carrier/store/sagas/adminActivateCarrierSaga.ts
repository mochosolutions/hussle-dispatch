import { call, put } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { adminActivateCarrier } from 'utils/api/fleet/carrierApi';
import {
  adminActivateCarrierFailure,
  adminActivateCarrierRequest,
  adminActivateCarrierSuccess,
  fetchCarrierDetailsRequest,
  fetchCarrierTabCountsRequest,
} from '../reducers/carrierNewPageSlice';
import { closeModal } from 'features/ui/store/reducers/uiSlice';

export function* adminActivateCarrierSaga(
  action: ReturnType<typeof adminActivateCarrierRequest>,
): Generator {
  const { id, reason, evidenceDocumentId } = action.payload;

  try {
    const body: { reason: string; evidenceDocumentId?: string } = { reason };
    if (evidenceDocumentId !== undefined) {
      body.evidenceDocumentId = evidenceDocumentId;
    }
    const result: Awaited<ReturnType<typeof adminActivateCarrier>> = (yield call(
      adminActivateCarrier,
      id,
      body,
    )) as Awaited<ReturnType<typeof adminActivateCarrier>>;
    yield put(adminActivateCarrierSuccess({ id: result.id, status: result.status }));
    yield put(fetchCarrierDetailsRequest({ id }));
    yield put(fetchCarrierTabCountsRequest());
    yield call(enqueueSnackbar, 'Carrier activated', { variant: 'success' });
    yield put(closeModal());
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to activate carrier';
    yield put(adminActivateCarrierFailure(errorMessage));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
