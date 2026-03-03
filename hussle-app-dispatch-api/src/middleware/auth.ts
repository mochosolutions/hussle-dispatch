/**
 * Auth middleware — delegates to the real auth module.
 *
 * This file preserves the public API (requireAuth, requireRole, AuthenticatedUser)
 * so existing route call-sites need no changes.
 */
import type { NextFunction, Request, Response } from 'express';
import { appAuth, createAppAuthMiddleware } from '../shared/middleware/authenticateUser';
import type { AuthPayload } from '../shared/middleware/authenticateUser';
import { UnauthorizedError, ForbiddenError } from '../shared/errors';

export type { AuthPayload as AuthenticatedUser };

export { createAppAuthMiddleware };

/**
 * requireAuth — validates JWT from HttpOnly cookie and injects req.user,
 * req.organizationId, and req.orgSlug.
 */
export const requireAuth = appAuth;

/**
 * requireRole — checks that the authenticated user's role is in the allowed list.
 * Must be used after requireAuth.
 */
export const requireRole =
  (roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${roles.join(', ')}`,
      );
    }
    next();
  };
