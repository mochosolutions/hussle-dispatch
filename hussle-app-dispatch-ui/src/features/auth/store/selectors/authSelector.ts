import {createSelector} from '@reduxjs/toolkit';

export const authSelector = (state: any) => state.auth;
export const currentUserSelector = (state: any) => state.auth.user;
export const orgsSelector = (state: any) => state.auth.orgs;

export const currentUserEmailSelector = createSelector(
  currentUserSelector,
  (user) => user?.email,
);

export const organizationIdSelector = createSelector(
  currentUserSelector,
  (user) => user?.organizationId,
);

export const userOrgsSelector = createSelector(
  authSelector,
  (auth) => auth.orgs || [],
);

export const userActiveOrgSelector = createSelector(
  userOrgsSelector,
  organizationIdSelector,
  (orgs, organizationId) => {
    const allOrgs = orgs.filter((org) => org.organizationId === organizationId);
    return allOrgs.length > 0 ? allOrgs[0] : null;
  }
);
