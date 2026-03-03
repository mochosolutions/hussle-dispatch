import type { AuthPayload } from './authenticateUser';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
      organizationId?: string;
      orgSlug?: string;
      correlationId?: string;
    }
  }
}
