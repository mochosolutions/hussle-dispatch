import type { AuthPayload } from './authenticateUser';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      organizationId?: string;
      orgSlug?: string;
      correlationId?: string;
      authMethod?: 'apiKey' | 'session';
    }
  }
}
