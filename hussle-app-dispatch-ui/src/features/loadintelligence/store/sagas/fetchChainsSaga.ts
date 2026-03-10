import { call, put, type SagaReturnType } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { getChains } from 'utils/api/intel/loadIntelApi';
import { fetchChainsSuccess, fetchChainsFailure } from '../reducers/intelPageSlice';

export function* fetchChainsSaga(
  action: PayloadAction<{ id: string; vehicleId?: string }>,
): Generator {
  const { id, vehicleId } = action.payload;
  try {
    const response = (yield call(getChains, id, vehicleId)) as SagaReturnType<typeof getChains>;

    const chain = response.chains.length > 0 ? response.chains[0] : null;

    yield put(fetchChainsSuccess({ id, chain }));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load chains';
    yield put(fetchChainsFailure({ id, error: errorMessage }));
  }
}
