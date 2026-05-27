import { takeLatest } from 'redux-saga/effects';
import { fetchTeamSaga } from './fetchTeamSaga';
import { fetchSubscriptionUsageSaga } from './fetchSubscriptionUsageSaga';
import { changeMemberRoleSaga } from './changeMemberRoleSaga';
import { removeMemberSaga } from './removeMemberSaga';
import { inviteMemberSaga } from './inviteMemberSaga';
import {
  fetchTeamRequest,
  fetchSubscriptionUsageRequest,
  changeMemberRoleRequest,
  removeMemberRequest,
  inviteMemberRequest,
} from '../reducers/teamSlice';

export function* teamSagaWatcher(): Generator {
  yield takeLatest(fetchTeamRequest.type, fetchTeamSaga);
  yield takeLatest(fetchSubscriptionUsageRequest.type, fetchSubscriptionUsageSaga);
  yield takeLatest(changeMemberRoleRequest.type, changeMemberRoleSaga);
  yield takeLatest(removeMemberRequest.type, removeMemberSaga);
  yield takeLatest(inviteMemberRequest.type, inviteMemberSaga);
}
