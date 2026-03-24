import type { Request } from 'express';
import type { CurrentUserInput } from '../../../services/auth/currentUserService';

export const mapCurrentUserRequest = (req: Request): CurrentUserInput | null => {
  const authenticatedUser = req.user;

  if (!authenticatedUser) {
    return null;
  }

  return {
    user: {
      userId: authenticatedUser.userId,
      email: authenticatedUser.email ?? '',
      role: authenticatedUser.role,
      organizationId: authenticatedUser.organizationId,
      orgSlug: authenticatedUser.orgSlug,
    },
  };
};
