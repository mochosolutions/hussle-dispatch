import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../../../store';

export const authSelector = (state: RootState) => state.auth;
export const currentUserSelector = (state: RootState) => state.auth.user;
export const orgsSelector = (state: RootState) => state.auth.orgs;

export const currentUserEmailSelector = (state: RootState) =>
  currentUserSelector(state)?.email;

export const organizationIdSelector = (state: RootState) =>
  currentUserSelector(state)?.organizationId;

export const userOrgsSelector = (state: RootState) =>
  authSelector(state).orgs || [];

export const userActiveOrgSelector = createSelector(
  userOrgsSelector,
  organizationIdSelector,
  (orgs, organizationId) => {
    const matched = orgs.filter((org) => org.organizationId === organizationId);
    return matched.length > 0 ? matched[0] : orgs[0] ?? null;
  },
);

export const formattedCurrentUserSelector = createSelector(
  currentUserSelector,
  userActiveOrgSelector,
  (user, activeOrg) => {
    const firstName = user?.firstName ?? '';
    const lastName = user?.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user?.email || 'User';

    return {
      name: displayName,
      orgName: activeOrg?.orgName ?? '',
      orgStatus: activeOrg?.orgStatus ?? '',
      role: activeOrg?.role ?? '',
    };
  },
);
