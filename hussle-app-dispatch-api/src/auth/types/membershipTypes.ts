export interface Membership {
  membershipId: string;
  userId: string;
  externalId?: string;
  organizationId: string;
  orgName: string;
  orgSlug: string;
  orgSubscriptionTier: string;
  orgStatus: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipWithUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organizationId: string;
  externalId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipInput {
  userId: string;
  organizationId: string;
  role: string;
  status: string;
}

export interface CreateMembershipServiceDeps {
  create: (data: CreateMembershipInput, options?: { context?: any }) => Promise<Membership>;
  findOneByFilter: (
    filters: { userId: string; organizationId: string },
    options?: { context?: any }
  ) => Promise<Membership | null>;
}

export interface MembershipServiceDeps {
  findAllMemberships: any;
}

export interface GetUserMembershipServiceDeps {
  findByUserId: any;
}

export interface DeleteManyMembershipArgs {
  ids: string[];
}

export interface DeleteMembershipServiceDeps {
  deleteById: any;
}

export interface DeleteManyMembershipsDeps {
  deleteManyMemberships: (ids: string[], context?: any) => Promise<any>;
}

export interface UpdateMembershipServiceDeps {
  updateMembership: (ids: string, data: Partial<Membership>, context?: any) => Promise<Membership>;
}

export interface UpdateMembershipInput {
  role?: Membership['role'];
  status?: Membership['status'];
  // externalId?: Membership['externalId'];
}

export interface UpdateManyMembershipsDeps {
  updateManyMembership: (
    filter: any,
    data: Partial<Membership>,
    context?: any
  ) => Promise<Membership[] | null>;
}

export interface UpdateMemberInput {
  role?: Membership['role'];
  status?: Membership['status'];
}

export interface UpdateManyMembershipArgs {
  filter: { [key: string]: any };
  data: UpdateMemberInput;
}
