import type { Membership, MembershipWithUser } from '../../../types/membershipTypes';

export interface MembershipResponse {
  membership: Membership;
}

export interface MembershipListResponse {
  memberships: MembershipWithUser[];
}

export const toMembershipResponse = (membership: Membership): MembershipResponse => ({
  membership,
});

export const toMembershipListResponse = (
  memberships: MembershipWithUser[],
): MembershipListResponse => ({
  memberships,
});
