import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import type { CreateAuditLogInput } from '../../../audit/types/auditTypes';
import { setAccessTokenCookie, setRefreshTokenCookie } from '@/shared/utils/cookieUtils';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { SignupOrgInput, SignupOrgResult } from '../../types/signupOrgTypes';
import { mapSignupOrgRequest } from './mappers/mapSignupOrgRequest';
import { toSignupOrgResponse } from './transformers/signupOrgTransformer';

interface SignupOrgControllerDeps {
  auditLogRepo: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
  tokenProviderInstance: ITokenProvider;
  signupOrganization: (data: SignupOrgInput) => Promise<SignupOrgResult>;
}

export const createSignupOrgController = ({
  auditLogRepo,
  tokenProviderInstance,
  signupOrganization,
}: SignupOrgControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const signupData = mapSignupOrgRequest(req);
    const result = await signupOrganization(signupData);

    const { accessToken, refreshToken } = await tokenProviderInstance.createSession({
      userId: result.user.userId,
      organizationId: result.tenant.tenantId,
      orgSlug: result.tenant.slug,
      membershipId: result.tenant.membershipId,
      role: result.user.role,
      orgSubscriptionTier: result.tenant.subscriptionTier,
      orgStatus: result.tenant.status,
    });

    setAccessTokenCookie(res, accessToken);
    setRefreshTokenCookie(res, refreshToken);

    auditLogRepo
      .create(result.tenant.tenantId, {
        userId: result.user.userId,
        action: 'CREATE',
        entityType: 'User',
        entityId: result.user.userId,
        changes: null,
        metadata: {
          email: result.user.email,
          organizationName: result.tenant.name,
          action: 'signup',
        },
      })
      .catch(() => {
        // Audit failure should not block user flow
        // TODO: move to domain event
      });

    return res.status(201).json(toSignupOrgResponse(result));
  };
