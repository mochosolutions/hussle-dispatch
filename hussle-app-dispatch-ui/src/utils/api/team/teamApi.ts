import axiosInstance from 'utils/axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface UsageEntry {
  current: number;
  limit: number;
}

export interface SubscriptionUsage {
  users: UsageEntry;
  vehicles: UsageEntry;
}

export interface Invitation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export interface InvitationVerification {
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationId: string;
}

export interface InviteMemberInput {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface AcceptInvitationInput {
  invitationToken: string;
  password: string;
}

export interface InviteResult {
  invited: string[];
  skipped: { email: string; reason: string }[];
  invites: Invitation[];
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface GetMembersResponse {
  data: Member[];
}

interface GetMemberResponse {
  data: Member;
}

interface GetSubscriptionUsageResponse {
  data: SubscriptionUsage;
}

interface GetInvitationsResponse {
  data: Invitation[];
}

interface InviteMemberResponse {
  data: InviteResult;
}

interface VerifyInvitationResponse {
  data: InvitationVerification;
}

interface AcceptInvitationResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getMembers = async (orgId: string): Promise<Member[]> => {
  const response = await axiosInstance.get<GetMembersResponse>(
    `/organizations/${orgId}/members`,
  );
  return response.data.data;
};

// Dispatcher directory — accessible to dispatchers (the members endpoint is
// tenant-admin only), used to populate the load assignment dispatcher picker.
export const getDispatchers = async (orgId: string): Promise<Member[]> => {
  const response = await axiosInstance.get<GetMembersResponse>(
    `/organizations/${orgId}/dispatchers`,
  );
  return response.data.data;
};

export const changeMemberRole = async (
  orgId: string,
  membershipId: string,
  role: string,
): Promise<Member> => {
  const response = await axiosInstance.patch<GetMemberResponse>(
    `/organizations/${orgId}/members/${membershipId}/role`,
    { role },
  );
  return response.data.data;
};

export const removeMember = async (orgId: string, membershipId: string): Promise<void> => {
  await axiosInstance.delete(`/organizations/${orgId}/members/${membershipId}`);
};

export const getSubscriptionUsage = async (orgId: string): Promise<SubscriptionUsage> => {
  const response = await axiosInstance.get<GetSubscriptionUsageResponse>(
    `/organizations/${orgId}/subscription/usage`,
  );
  return response.data.data;
};

export const inviteMember = async (
  orgId: string,
  data: InviteMemberInput,
): Promise<InviteResult> => {
  const response = await axiosInstance.post<{ invite: InviteResult }>(
    `/organizations/${orgId}/invite`,
    { users: [data] },
  );
  return response.data.invite;
};

export const getInvitations = async (orgId: string): Promise<Invitation[]> => {
  const response = await axiosInstance.get<{ invites: Invitation[] }>(
    `/organizations/${orgId}/invites`,
  );
  return response.data.invites ?? [];
};

export const revokeInvitation = async (orgId: string, inviteId: string): Promise<void> => {
  await axiosInstance.delete(`/organizations/${orgId}/invites/${inviteId}`);
};

export const resendInvitation = async (
  orgId: string,
  inviteId: string,
): Promise<Invitation> => {
  const response = await axiosInstance.post<{ invite: Invitation }>(
    `/organizations/${orgId}/invites/${inviteId}/resend`,
  );
  return response.data.invite;
};

export const verifyInvitation = async (token: string): Promise<InvitationVerification> => {
  const response = await axiosInstance.post<VerifyInvitationResponse>(
    `/invitations/${token}/verify`,
  );
  return response.data.data;
};

export const acceptInvitation = async (
  data: AcceptInvitationInput,
): Promise<AcceptInvitationResponse> => {
  const response = await axiosInstance.post<AcceptInvitationResponse>(
    '/invitations/accept',
    data,
  );
  return response.data;
};
