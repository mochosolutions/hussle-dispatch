export interface CurrentUserServiceDeps {
  findUserByIdWithMemberships: any;
}

export interface CurrentUserInput {
  user: {
    userId: string;
    email: string;
    role: string;
    organizationId: string;
  };
}

export const currentUserService = async (
  { user }: CurrentUserInput,
  { findUserByIdWithMemberships }: CurrentUserServiceDeps
) => {
  // Single query to get user with memberships
  const dbUserWithMemberships = await findUserByIdWithMemberships(user.userId);

  if (!dbUserWithMemberships) {
    return null;
  }

  return {
    accessibleOrgs: dbUserWithMemberships.memberships,
    user: {
      ...dbUserWithMemberships,
      organizationId: user.organizationId,
      role: user.role,
    },
  };
};
