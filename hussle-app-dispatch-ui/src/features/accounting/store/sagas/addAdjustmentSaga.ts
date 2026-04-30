import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { addAdjustment } from 'utils/api/accounting/settlementApi';
import {
  addAdjustmentRequest,
  addAdjustmentSuccess,
  addAdjustmentFailure,
} from '../reducers/settlementPageSlice';
import { settlementActions } from '../reducers/settlementEntitySlice';

export function* addAdjustmentSaga(
  action: ReturnType<typeof addAdjustmentRequest>,
): Generator {
  const { settlementId, input } = action.payload;

  try {
    const response = (yield call(
      addAdjustment,
      settlementId,
      input,
    )) as SagaReturnType<typeof addAdjustment>;

    yield put(settlementActions.upsertOne(response));
    yield put(addAdjustmentSuccess({ id: settlementId }));
    yield put(notify({ message: 'Adjustment added', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to add adjustment';
    yield put(addAdjustmentFailure({ id: settlementId, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
