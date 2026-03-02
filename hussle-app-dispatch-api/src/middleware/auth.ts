/**
 * Auth middleware — thin placeholder per decision L-007.
 *
 * packages/auth/ does not exist yet. This module defines the middleware
 * interface and provides working placeholder implementations that:
 *   - requireAuth: validates presence of a Bearer token and injects req.user,
 *     req.organizationId, and req.orgSlug onto the request.
 *   - requireRole: checks req.user.role against an allowed-roles list.
 *
 * When the real auth package ships, replace the body of `requireAuth` with a
 * call to the real package. The interface and types defined here must remain
 * compatible so that call-sites need no changes.
 */
import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../shared/constants/roles';
import { UnauthorizedError, ForbiddenError } from '../shared/errors';

/**
 * The authenticated user context injected into every guarded request.
 * Extend this interface when the real auth package adds more fields.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Extend Express's Request with auth context fields.
 * All three properties are set by requireAuth before any downstream handler runs.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
      orgSlug?: string;
    }
  }
}

/**
 * Extracts and returns a Bearer token from the Authorization header.
 * Returns undefined when the header is absent or malformed.
 */
const extractBearerToken = (req: Request): string | undefined => {
  const header = req.headers['authorization'];
  if (typeof header !== 'string') {
    return undefined;
  }
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return undefined;
  }
  return token;
};

/**
 * Decodes a placeholder JWT-style token for development use.
 *
 * The token is expected to be a base64-encoded JSON string:
 *   btoa(JSON.stringify({ id, email, role, organizationId, orgSlug }))
 *
 * The real auth package will replace this with proper JWT verification.
 */
const decodePlaceholderToken = (
  token: string,
): (AuthenticatedUser & { organizationId: string; orgSlug: string }) | undefined => {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      !('id' in decoded) ||
      !('email' in decoded) ||
      !('role' in decoded) ||
      !('organizationId' in decoded) ||
      !('orgSlug' in decoded)
    ) {
      return undefined;
    }
    const payload = decoded as Record<string, unknown>;
    if (
      typeof payload['id'] !== 'string' ||
      typeof payload['email'] !== 'string' ||
      typeof payload['role'] !== 'string' ||
      typeof payload['organizationId'] !== 'string' ||
      typeof payload['orgSlug'] !== 'string'
    ) {
      return undefined;
    }
    return {
      id: payload['id'],
      email: payload['email'],
      role: payload['role'] as Role,
      organizationId: payload['organizationId'],
      orgSlug: payload['orgSlug'],
    };
  } catch {
    return undefined;
  }
};

/**
 * requireAuth middleware — injects req.user, req.organizationId, req.orgSlug.
 *
 * Returns 401 UnauthorizedError when:
 *   - Authorization header is absent or not a Bearer token
 *   - Token cannot be decoded / verified
 *
 * Decision L-007: integrate with packages/auth/ when it ships.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearerToken(req);
  if (!token) {
    throw new UnauthorizedError('Authorization header with Bearer token is required');
  }

  const payload = decodePlaceholderToken(token);
  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  req.user = { id: payload.id, email: payload.email, role: payload.role };
  req.organizationId = payload.organizationId;
  req.orgSlug = payload.orgSlug;

  next();
};

/**
 * requireRole middleware factory — returns a middleware that enforces role-based access.
 *
 * Must be used after requireAuth (relies on req.user being populated).
 * Returns 403 ForbiddenError when the authenticated user's role is not in the allowed list.
 *
 * @param roles  Array of roles that are permitted to access the route
 */
export const requireRole =
  (roles: Role[]) =>
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
