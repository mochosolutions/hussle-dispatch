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
  create: (data: CreateMembershipInput) => Promise<Membership>;
  findOneByFilter: (filters: { userId: string; organizationId: string }) => Promise<Membership | null>;
}

export interface MembershipServiceDeps {
  findAllMemberships: () => Promise<Membership[]>;
}

export interface GetUserMembershipServiceDeps {
  findByUserId: (userId: string) => Promise<Membership | null>;
}

export interface DeleteManyMembershipArgs {
  ids: string[];
}

export interface DeleteMembershipServiceDeps {
  deleteById: (id: string) => Promise<Membership | null>;
}

export interface DeleteManyMembershipsDeps {
  deleteManyMemberships: (ids: string[]) => Promise<Membership[] | null>;
}

export interface UpdateMembershipServiceDeps {
  updateMembership: (id: string, data: Partial<Membership>) => Promise<Membership>;
}

export interface UpdateMembershipInput {
  role?: Membership['role'];
  status?: Membership['status'];
  // externalId?: Membership['externalId'];
}

export interface UpdateManyMembershipsDeps {
  updateManyMembership: (
    filter: MembershipFilter,
    data: Partial<Membership>
  ) => Promise<Membership[] | null>;
}

export interface UpdateMemberInput {
  role?: Membership['role'];
  status?: Membership['status'];
}

export interface MembershipFilter {
  organizationId?: string;
  userId?: string;
}

export interface UpdateManyMembershipArgs {
  filter: MembershipFilter;
  data: UpdateMemberInput;
}
