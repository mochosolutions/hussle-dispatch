import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { getPlace } from 'utils/api/places/placeApi';
import {
  fetchPlaceDetailsRequest,
  fetchPlaceDetailsSuccess,
  fetchPlaceDetailsFailure,
} from '../reducers/placePageSlice';
import { placeActions } from '../reducers/placeEntitySlice';

export function* fetchPlaceDetailsSaga(
  action: ReturnType<typeof fetchPlaceDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const response = (yield call(getPlace, id)) as SagaReturnType<typeof getPlace>;

    yield put(placeActions.upsertOne(response));
    yield put(fetchPlaceDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load place details';
    yield put(fetchPlaceDetailsFailure({ id, error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
