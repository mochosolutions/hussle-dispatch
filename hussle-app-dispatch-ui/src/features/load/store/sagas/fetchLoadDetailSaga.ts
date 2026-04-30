import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getLoad } from 'utils/api/loads/loadApi';
import {
  fetchLoadDetailsRequest,
  fetchLoadDetailsSuccess,
  fetchLoadDetailsFailure,
} from '../reducers/loadPageSlice';
import { loadActions } from '../reducers/loadEntitySlice';
import { mapDetailToListItem } from './detailToListItemMapper';

export function* fetchLoadDetailSaga(
  action: ReturnType<typeof fetchLoadDetailsRequest>,
): Generator {
  const { id } = action.payload;

  try {
    const load = (yield call(getLoad, id)) as SagaReturnType<typeof getLoad>;

    // Refresh the list-row projection first so the dispatch board grid keeps
    // its LoadListItem shape, then upsert the full detail for the detail page.
    yield put(loadActions.updateOne({ id, changes: mapDetailToListItem(load) }));
    yield put(loadActions.upsertOne(load));
    yield put(fetchLoadDetailsSuccess({ id }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load load details';
    yield put(fetchLoadDetailsFailure({ id, error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
