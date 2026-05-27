export enum OrganizationStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * Membership status values.
 * Note: Membership.status is a plain String field in Prisma (not an enum),
 * so values are lowercase to match the DB default.
 */
export const MembershipStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
} as const;
