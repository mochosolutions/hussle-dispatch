import { call, put } from 'redux-saga/effects';
import axiosPrivate from 'utils/axios';
import { getNavigate } from 'utils/getNavigate';
import { switchOrgSuccess, switchOrgFailure} from '../authSlice';

export function* switchOrgSaga(action) {
	try {
		const { organizationId } = action.payload;
		console.log('switchorg Saga', { organizationId });

		const navigate = yield call(getNavigate);
		// yield delay(5000);
		const response = yield call(axiosPrivate.post, '/auth/switch-org', {
		  organizationId,
		});

        const {user, accessibleOrgs} = response?.data || {};
		console.log('switchOrgSaga Response', response);

        const actionPayload = {
            user,
            orgs: accessibleOrgs || [],
        }

        console.log('switchOrgSaga Success Action Payload', actionPayload);

        yield put(switchOrgSuccess(actionPayload));
		yield call(navigate, '/dashboard');
	} catch (error: any) {
        console.error('switchOrgSaga Error', error);
		yield put(switchOrgFailure());
	}
}
