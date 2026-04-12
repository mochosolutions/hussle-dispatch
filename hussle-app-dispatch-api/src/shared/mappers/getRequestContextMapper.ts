import type { Request } from 'express';

export interface RequestContext {
  organizationId: string;
  role: string;
}

export const getRequestContextMapper = (req: Request): RequestContext => ({
  organizationId: req.organizationId ?? '',
  role: req.user?.role ?? '',
});
