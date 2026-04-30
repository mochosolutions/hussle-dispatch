import { call, put, select, type SagaReturnType } from 'redux-saga/effects';
import { getSubscriptionUsage } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import {
  fetchSubscriptionUsageSuccess,
  fetchSubscriptionUsageFailure,
} from '../reducers/teamSlice';

export function* fetchSubscriptionUsageSaga(): Generator {
  try {
    const orgId = (yield select(organizationIdSelector)) as string;
    if (!orgId) {
      yield put(fetchSubscriptionUsageFailure('Missing organization id'));
      return;
    }

    const usage = (yield call(getSubscriptionUsage, orgId)) as SagaReturnType<
      typeof getSubscriptionUsage
    >;

    yield put(fetchSubscriptionUsageSuccess(usage));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unable to load subscription usage';
    yield put(fetchSubscriptionUsageFailure(errorMessage));
  }
}
