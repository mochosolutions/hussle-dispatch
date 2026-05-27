import { call, put } from 'redux-saga/effects';
import { isAxiosError } from 'axios';
import type { AxiosResponse } from 'axios';
import axiosPrivate from 'utils/axios';
import { getNavigate } from 'utils/getNavigate';
import { notify } from 'features/ui/store/reducers/notificationSlice';
import { acceptInvitation } from 'utils/api/team/teamApi';
import type { Tenant, UserProfile } from '../authSlice';
import {
  acceptInviteRequest,
  acceptInviteSuccess,
  acceptInviteFailure,
} from '../authSlice';

interface AuthMeResponse {
  user: UserProfile;
  accessibleOrgs?: Tenant[];
}

export function* handleAcceptInvite(action: ReturnType<typeof acceptInviteRequest>): Generator {
  try {
    const { invitationToken, password } = action.payload;

    yield call(acceptInvitation, { invitationToken, password });

    const meResponse = (yield call(axiosPrivate.get, '/auth/me')) as AxiosResponse<AuthMeResponse>;
    const user = meResponse?.data?.user;
    const orgs = meResponse?.data?.accessibleOrgs ?? [];

    if (!user) {
      throw new Error('Failed to load user after accepting invitation');
    }

    yield put(acceptInviteSuccess({ user, orgs }));

    const orgName = orgs[0]?.orgName ?? 'your team';
    yield put(notify({ message: `Welcome to ${orgName}!`, variant: 'success' }));

    const navigate = getNavigate();
    navigate('/');
  } catch (error: unknown) {
    let errorMessage = 'Failed to accept invitation';
    if (isAxiosError(error)) {
      errorMessage = error.response?.data?.errors?.[0]?.message
        ?? error.response?.data?.message
        ?? errorMessage;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    yield put(acceptInviteFailure({ error: errorMessage }));
    yield put(notify({ message: errorMessage, variant: 'error' }));
  }
}
