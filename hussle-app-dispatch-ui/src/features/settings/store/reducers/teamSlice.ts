import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Member, Invitation, SubscriptionUsage, InviteMemberInput } from 'utils/api/team/teamApi';

interface TeamState {
  members: Member[];
  invitations: Invitation[];
  usage: SubscriptionUsage | null;
  usageLastFetchedAt: number | null;
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: TeamState = {
  members: [],
  invitations: [],
  usage: null,
  usageLastFetchedAt: null,
  loading: {},
  errors: {},
};

// Immer-safe removal of a dynamically-keyed loading/error entry
// (avoids @typescript-eslint/no-dynamic-delete on computed keys).
const clearKey = (map: Record<string, string>, key: string): void => {
  Reflect.deleteProperty(map, key);
};

interface FetchTeamSuccessPayload {
  members: Member[];
  invitations: Invitation[];
  usage: SubscriptionUsage;
}

interface ChangeMemberRolePayload {
  membershipId: string;
  role: string;
}

interface RemoveMemberPayload {
  membershipId: string;
}

interface InviteActionPayload {
  inviteId: string;
}

export const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    fetchTeamRequest(state) {
      state.loading.fetchTeam = 'Pending';
      delete state.errors.fetchTeam;
    },
    fetchTeamSuccess(state, action: PayloadAction<FetchTeamSuccessPayload>) {
      state.members = action.payload.members;
      state.invitations = action.payload.invitations;
      state.usage = action.payload.usage;
      state.usageLastFetchedAt = Date.now();
      delete state.loading.fetchTeam;
      delete state.errors.fetchTeam;
    },
    fetchTeamFailure(state, action: PayloadAction<string>) {
      delete state.loading.fetchTeam;
      state.errors.fetchTeam = action.payload;
    },

    fetchSubscriptionUsageRequest(state) {
      state.loading.fetchSubscriptionUsage = 'Pending';
      delete state.errors.fetchSubscriptionUsage;
    },
    fetchSubscriptionUsageSuccess(state, action: PayloadAction<SubscriptionUsage>) {
      state.usage = action.payload;
      state.usageLastFetchedAt = Date.now();
      delete state.loading.fetchSubscriptionUsage;
      delete state.errors.fetchSubscriptionUsage;
    },
    fetchSubscriptionUsageFailure(state, action: PayloadAction<string>) {
      delete state.loading.fetchSubscriptionUsage;
      state.errors.fetchSubscriptionUsage = action.payload;
    },

    changeMemberRoleRequest(state, action: PayloadAction<ChangeMemberRolePayload>) {
      state.loading[`changeRole:${action.payload.membershipId}`] = 'Pending';
      clearKey(state.errors, `changeRole:${action.payload.membershipId}`);
    },
    changeMemberRoleSuccess(state, action: PayloadAction<Member>) {
      const index = state.members.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
      clearKey(state.loading, `changeRole:${action.payload.id}`);
    },
    changeMemberRoleFailure(
      state,
      action: PayloadAction<{ membershipId: string; error: string }>,
    ) {
      clearKey(state.loading, `changeRole:${action.payload.membershipId}`);
      state.errors[`changeRole:${action.payload.membershipId}`] = action.payload.error;
    },

    removeMemberRequest(state, action: PayloadAction<RemoveMemberPayload>) {
      state.loading[`remove:${action.payload.membershipId}`] = 'Pending';
      clearKey(state.errors, `remove:${action.payload.membershipId}`);
    },
    removeMemberSuccess(state, action: PayloadAction<{ membershipId: string }>) {
      state.members = state.members.filter((m) => m.id !== action.payload.membershipId);
      clearKey(state.loading, `remove:${action.payload.membershipId}`);
    },
    removeMemberFailure(
      state,
      action: PayloadAction<{ membershipId: string; error: string }>,
    ) {
      clearKey(state.loading, `remove:${action.payload.membershipId}`);
      state.errors[`remove:${action.payload.membershipId}`] = action.payload.error;
    },

    inviteMemberRequest(state, _action: PayloadAction<InviteMemberInput>) {
      state.loading.invite = 'Pending';
      delete state.errors.invite;
    },
    inviteMemberSuccess(state, action: PayloadAction<{ invitations: Invitation[] }>) {
      state.invitations = [...state.invitations, ...action.payload.invitations];
      delete state.loading.invite;
    },
    inviteMemberFailure(state, action: PayloadAction<string>) {
      delete state.loading.invite;
      state.errors.invite = action.payload;
    },

    revokeInvitationRequest(state, action: PayloadAction<InviteActionPayload>) {
      state.loading[`revoke:${action.payload.inviteId}`] = 'Pending';
      clearKey(state.errors, `revoke:${action.payload.inviteId}`);
    },
    revokeInvitationSuccess(state, action: PayloadAction<InviteActionPayload>) {
      state.invitations = state.invitations.filter((i) => i.id !== action.payload.inviteId);
      clearKey(state.loading, `revoke:${action.payload.inviteId}`);
    },
    revokeInvitationFailure(
      state,
      action: PayloadAction<{ inviteId: string; error: string }>,
    ) {
      clearKey(state.loading, `revoke:${action.payload.inviteId}`);
      state.errors[`revoke:${action.payload.inviteId}`] = action.payload.error;
    },

    resendInvitationRequest(state, action: PayloadAction<InviteActionPayload>) {
      state.loading[`resend:${action.payload.inviteId}`] = 'Pending';
      clearKey(state.errors, `resend:${action.payload.inviteId}`);
    },
    resendInvitationSuccess(state, action: PayloadAction<{ invitation: Invitation }>) {
      const index = state.invitations.findIndex((i) => i.id === action.payload.invitation.id);
      if (index !== -1) {
        state.invitations[index] = action.payload.invitation;
      }
      clearKey(state.loading, `resend:${action.payload.invitation.id}`);
    },
    resendInvitationFailure(
      state,
      action: PayloadAction<{ inviteId: string; error: string }>,
    ) {
      clearKey(state.loading, `resend:${action.payload.inviteId}`);
      state.errors[`resend:${action.payload.inviteId}`] = action.payload.error;
    },
  },
});

export const {
  fetchTeamRequest,
  fetchTeamSuccess,
  fetchTeamFailure,
  fetchSubscriptionUsageRequest,
  fetchSubscriptionUsageSuccess,
  fetchSubscriptionUsageFailure,
  changeMemberRoleRequest,
  changeMemberRoleSuccess,
  changeMemberRoleFailure,
  removeMemberRequest,
  removeMemberSuccess,
  removeMemberFailure,
  inviteMemberRequest,
  inviteMemberSuccess,
  inviteMemberFailure,
  revokeInvitationRequest,
  revokeInvitationSuccess,
  revokeInvitationFailure,
  resendInvitationRequest,
  resendInvitationSuccess,
  resendInvitationFailure,
} = teamSlice.actions;

export const teamReducer = teamSlice.reducer;
