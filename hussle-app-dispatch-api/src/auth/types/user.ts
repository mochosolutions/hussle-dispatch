import type { User as PrismaUser } from '@prisma/client';
import type { Membership } from './membershipTypes';

/**
 * User type (derived from Prisma)
 * Prisma returns dates as Date objects, but API serializes to strings
 */
export type User = Omit<PrismaUser, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

/**
 * Input type for creating a new user
 * Excludes fields set automatically by Prisma
 */
export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  externalId: string;
}

/**
 * Input type for updating a user
 * All fields optional
 */
export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  externalId?: string;
}

// ============================================================================
// Service Dependency Interfaces
// ============================================================================

export interface CreateUserServiceDeps {
  create: (data: CreateUserInput) => Promise<User>;
  findByEmail: (email: string) => Promise<User | null>;
}

export interface GetUserByIdInput {
  userId: string;
}

export interface GetUserByIdDeps {
  findUserById: (userId: string) => Promise<User | null>;
}

export interface GetUserServiceDeps {
  findAllUsers: () => Promise<User[] | null>;
}

export interface UpdateManyUsersDeps {
  updateManyUsers: (filter: UserFilter, data: Partial<User>) => Promise<User[] | null>;
}

export interface UserFilter {
  organizationId?: string;
  externalId?: string;
}

export interface UpdateUserServiceDeps {
  filter: UserFilter;
  data: UpdateUserInput;
}

export interface UserWithMemberships extends User {
  memberships: Membership[];
}
