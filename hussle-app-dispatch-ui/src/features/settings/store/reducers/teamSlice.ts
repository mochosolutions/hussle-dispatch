import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Member, Invitation, SubscriptionUsage, InviteMemberInput } from 'utils/api/team/teamApi';

interface TeamState {
  members: Member[];
  invitations: Invitation[];
  usage: SubscriptionUsage | null;
  loading: Record<string, string>;
  errors: Record<string, string>;
}

const initialState: TeamState = {
  members: [],
  invitations: [],
  usage: null,
  loading: {},
  errors: {},
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
      delete state.loading.fetchTeam;
      delete state.errors.fetchTeam;
    },
    fetchTeamFailure(state, action: PayloadAction<string>) {
      delete state.loading.fetchTeam;
      state.errors.fetchTeam = action.payload;
    },

    changeMemberRoleRequest(state, action: PayloadAction<ChangeMemberRolePayload>) {
      state.loading[`changeRole:${action.payload.membershipId}`] = 'Pending';
      delete state.errors[`changeRole:${action.payload.membershipId}`];
    },
    changeMemberRoleSuccess(state, action: PayloadAction<Member>) {
      const index = state.members.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.members[index] = action.payload;
      }
      delete state.loading[`changeRole:${action.payload.id}`];
    },
    changeMemberRoleFailure(
      state,
      action: PayloadAction<{ membershipId: string; error: string }>,
    ) {
      delete state.loading[`changeRole:${action.payload.membershipId}`];
      state.errors[`changeRole:${action.payload.membershipId}`] = action.payload.error;
    },

    removeMemberRequest(state, action: PayloadAction<RemoveMemberPayload>) {
      state.loading[`remove:${action.payload.membershipId}`] = 'Pending';
      delete state.errors[`remove:${action.payload.membershipId}`];
    },
    removeMemberSuccess(state, action: PayloadAction<{ membershipId: string }>) {
      state.members = state.members.filter((m) => m.id !== action.payload.membershipId);
      delete state.loading[`remove:${action.payload.membershipId}`];
    },
    removeMemberFailure(
      state,
      action: PayloadAction<{ membershipId: string; error: string }>,
    ) {
      delete state.loading[`remove:${action.payload.membershipId}`];
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
  },
});

export const {
  fetchTeamRequest,
  fetchTeamSuccess,
  fetchTeamFailure,
  changeMemberRoleRequest,
  changeMemberRoleSuccess,
  changeMemberRoleFailure,
  removeMemberRequest,
  removeMemberSuccess,
  removeMemberFailure,
  inviteMemberRequest,
  inviteMemberSuccess,
  inviteMemberFailure,
} = teamSlice.actions;

export const teamReducer = teamSlice.reducer;
