import { call, put } from 'redux-saga/effects';
import { extractErrorMessage } from 'utils/api/extractErrorMessage';
import { listRateconImports } from 'utils/api/ratecon-imports';
import type { RateconImport } from 'utils/api/ratecon-imports';
import { rateconImportEntityActions } from '../reducers/rateconImportEntitySlice';
import { fetchImportsFailure, fetchImportsSuccess } from '../reducers/rateconImportPageSlice';

// Fetches the active inbox (server excludes ACCEPTED/REJECTED). Status/source/search
// filtering is applied client-side via selectors. Drives both the initial load and
// the 10s poll, so failures stay silent — no toast spam on a transient poll error.
export function* fetchImportsSaga(): Generator {
  try {
    const { data } = (yield call(listRateconImports, {})) as { data: RateconImport[] };
    yield put(rateconImportEntityActions.setAll(data));
    yield put(fetchImportsSuccess({ count: data.length }));
  } catch (error: unknown) {
    const message = extractErrorMessage(error, 'Failed to load ratecon imports');
    yield put(fetchImportsFailure({ error: message }));
  }
}
