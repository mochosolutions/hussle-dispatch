/**
 * Membership role constants — used for authorization checks.
 * Roles are stored as strings on the Membership model (not a Prisma enum).
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  MANAGER: 'manager',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  VIEWER: 'viewer',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const isAdminOrSupport = (role: string): boolean =>
  role === ROLES.ADMIN || role === 'SystemAdmin' || role === 'CustomerSupport';
