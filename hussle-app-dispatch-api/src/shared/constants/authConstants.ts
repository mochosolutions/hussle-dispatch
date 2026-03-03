export enum AuthStatus {
  CHALLENGE_REQUIRED = 'CHALLENGE_REQUIRED',
  AUTHENTICATED = 'AUTHENTICATED',
  UNCONFIRMED = 'UNCONFIRMED',
}

export enum UserRole {
  TENANT_ADMIN = 'TenantAdmin',
  TENANT_USER = 'TenantUser',
}

export enum SystemUserRole {
  SYSTEM_ADMIN = 'SystemAdmin',
  CUSTOMER_SUPPORT = 'CustomerSupport',
}
