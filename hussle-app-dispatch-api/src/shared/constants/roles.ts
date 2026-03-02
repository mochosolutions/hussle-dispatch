/**
 * User role constants — derived from the UserRole Prisma enum.
 */
export const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  DISPATCHER: 'DISPATCHER',
  VIEWER: 'VIEWER',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];
