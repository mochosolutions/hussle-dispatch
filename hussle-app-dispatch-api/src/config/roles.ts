export const ROLES = Object.freeze({
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  VIEWER: 'viewer',
  DRIVER: 'driver',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];
