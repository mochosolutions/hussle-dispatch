import type { MembershipWithUser } from '../../../types/membershipTypes';

interface MemberResponse {
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

export const toMemberResponse = (membership: MembershipWithUser): MemberResponse => ({
  id: membership.id,
  userId: membership.userId,
  role: membership.role,
  status: membership.status,
  createdAt: membership.createdAt,
  user: {
    id: membership.userId,
    firstName: membership.firstName,
    lastName: membership.lastName,
    email: membership.email,
  },
});

export const toMemberListResponse = (members: MembershipWithUser[]): MemberResponse[] =>
  members.map(toMemberResponse);
