import { call, put, type SagaReturnType } from 'redux-saga/effects';
import { enqueueSnackbar } from 'notistack';
import { getCarrierOnboarding } from 'utils/api/fleet/carrierApi';
import {
  fetchCarrierOnboardingRequest,
  fetchCarrierOnboardingSuccess,
  fetchCarrierOnboardingFailure,
} from '../reducers/carrierPageSlice';

export function* fetchCarrierOnboardingSaga(
  action: ReturnType<typeof fetchCarrierOnboardingRequest>,
): Generator {
  try {
    const { id } = action.payload;

    const response = (yield call(
      getCarrierOnboarding,
      id,
    )) as SagaReturnType<typeof getCarrierOnboarding>;

    yield put(fetchCarrierOnboardingSuccess({ id, onboarding: response.onboarding }));
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load onboarding status';
    yield put(fetchCarrierOnboardingFailure({ error: errorMessage }));
    yield call(enqueueSnackbar, errorMessage, { variant: 'error' });
  }
}
