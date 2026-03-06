import {PayloadAction} from '@reduxjs/toolkit';
import {LoadingState} from "types/loadingState";


interface SwitchOrgPayload {
  user: any;
  orgs: any[];
}


export const switchOrgReducer = {
  switchOrgRequest: (state, action: PayloadAction<{organizationId: string}>) => {
    state.loading.switchOrg = LoadingState.Pending;
  },
  switchOrgSuccess: (state, action: PayloadAction<SwitchOrgPayload>,
  ) => {
    console.log("switchOrgSuccess", state);
    const {user, orgs} = action.payload;
    state.user = user;
    state.orgs = orgs;
    state.errors.switchOrg = '';
    state.loading.switchOrg = LoadingState.Fulfilled;
  },
  switchOrgFailure: (state) => {
    state.errors.switchOrg = 'Failed to switch organization';
    state.loading.switchOrg = LoadingState.Rejected;
  },
};
