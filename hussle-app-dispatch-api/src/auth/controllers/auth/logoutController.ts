import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { AuthRequestError } from '@/shared/errors';
import { clearAuthCookies } from '@/shared/utils/cookieUtils';
import type { CreateAuditLogInput } from '../../types/auditLogPort';
import { tokenProvider } from '../../providers/tokenProvider';
import { logoutUserService } from '../../services';

interface LogoutControllerDeps {
  tokenProviderInstance: ReturnType<typeof tokenProvider>;
  auditLogRepo: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
}

export const createLogoutController = ({
  tokenProviderInstance,
  auditLogRepo,
}: LogoutControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const sessionId = req.user?.sessionId;
    const refreshToken = req.cookies?.refreshToken;

    if (!sessionId || !refreshToken) {
      throw new AuthRequestError('Session ID or refresh token is missing');
    }

    await logoutUserService(
      { sessionId, refreshToken },
      { tokenProvider: tokenProviderInstance },
    );

    if (req.user?.userId && req.user?.organizationId) {
      auditLogRepo
        .create(req.user.organizationId, {
          userId: req.user.userId,
          action: 'LOGOUT',
          entityType: 'User',
          entityId: req.user.userId,
          changes: null,
          metadata: { ip: req.ip },
        })
        .catch(() => {});
    }

    clearAuthCookies(res);

    return res.status(200).json({ message: 'User logged out successfully' });
  };
