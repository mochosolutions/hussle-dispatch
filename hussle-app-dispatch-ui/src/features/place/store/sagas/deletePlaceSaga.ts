import { call, put } from 'redux-saga/effects';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { deletePlace } from 'utils/api/places/placeApi';
import {
  deletePlaceRequest,
  deletePlaceSuccess,
  deletePlaceFailure,
} from '../reducers/placePageSlice';
import { placeActions } from '../reducers/placeEntitySlice';

export function* deletePlaceSaga(action: ReturnType<typeof deletePlaceRequest>): Generator {
  const { id } = action.payload;

  try {
    yield call(deletePlace, id);

    yield put(placeActions.removeOne(id));
    yield put(deletePlaceSuccess({ id }));

    yield put(notify({ message: 'Place deleted', variant: 'success' }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete place';
    yield put(deletePlaceFailure({ error: errorMessage, id }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
