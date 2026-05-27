import type { PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, UserProfile, Tenant } from '../authSlice';
import { LoadingState } from 'types/loadingState';

interface SwitchOrgPayload {
  user: UserProfile;
  orgs: Tenant[];
}

export const switchOrgReducer = {
  switchOrgRequest: (state: AuthState, _action: PayloadAction<{ organizationId: string }>) => {
    state.loading.switchOrg = LoadingState.Pending;
  },
  switchOrgSuccess: (
    state: AuthState,
    action: PayloadAction<SwitchOrgPayload>,
  ) => {
    const { user, orgs } = action.payload;
    state.user = user;
    state.orgs = orgs;
    state.errors.switchOrg = '';
    state.loading.switchOrg = LoadingState.Fulfilled;
  },
  switchOrgFailure: (state: AuthState) => {
    state.errors.switchOrg = 'Failed to switch organization';
    state.loading.switchOrg = LoadingState.Rejected;
  },
};
