import { call, put } from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import { getNavigate } from 'utils/getNavigate';
import { switchOrgSuccess, switchOrgFailure} from '../authSlice';

export function* switchOrgSaga(action) {
	try {
		const { organizationId } = action.payload;

		const navigate = yield call(getNavigate);
		const response = yield call(axiosPrivate.post, '/auth/switch-org', {
		  organizationId,
		});

        const {user, accessibleOrgs} = response?.data || {};

        const actionPayload = {
            user,
            orgs: accessibleOrgs || [],
        };

        yield put(switchOrgSuccess(actionPayload));
		yield call(navigate, '/dashboard');
	} catch (_error: unknown) {
		yield put(switchOrgFailure());
	}
}
