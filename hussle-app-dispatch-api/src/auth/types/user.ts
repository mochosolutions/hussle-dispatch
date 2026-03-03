import type { User as PrismaUser } from '@prisma/client';

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
  create: (data: CreateUserInput, options?: { context?: any }) => Promise<User>;
  findByEmail: (email: string, options?: { context?: any }) => Promise<User | null>;
}

export interface GetUserByIdInput {
  userId: string;
}

export interface GetUserByIdDeps {
  findUserById: (userId: string) => Promise<User | null>;
}

export interface GetUserServiceDeps {
  findAllUsers: (context?: any) => Promise<any[] | null>;
}

export interface UpdateManyUsersDeps {
  updateManyUsers: (filter: any, data: Partial<User>, context?: any) => Promise<User[] | null>;
}

export interface UpdateUserServiceDeps {
  filter: { [key: string]: any };
  data: UpdateUserInput;
}
