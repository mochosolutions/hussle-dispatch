import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '@/shared/utils/cookieUtils';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { ITokenProvider } from '../../types/tokenProvider';
import type { SignupOrgInput, SignupOrgResult } from '../../types/signupOrgTypes';
import { mapSignupOrgRequest } from './mappers/mapSignupOrgRequest';
import { toSignupOrgResponse } from './transformers/signupOrgTransformer';

interface SignupOrgControllerDeps {
  tokenProviderInstance: ITokenProvider;
  signupOrganization: (data: SignupOrgInput) => Promise<SignupOrgResult>;
  eventBus: EventBus;
  logger: Logger;
  config: { defaultOrgRole: string };
}

export const createSignupOrgController = ({
  tokenProviderInstance,
  signupOrganization,
  eventBus,
  logger,
  config,
}: SignupOrgControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const signupData = mapSignupOrgRequest(req);
    const result = await signupOrganization(signupData);

    eventBus.publish('organization.created', {
      orgId: result.tenant.tenantId,
      orgName: result.tenant.name,
      orgRole: signupData.orgRole ?? config.defaultOrgRole,
      userId: result.user.userId,
      userEmail: result.user.email,
      customMetadata: signupData.customMetadata ?? {},
    }).catch((error: unknown) => {
      logger.error('Failed to publish organization.created event', { error });
    });

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
    setCsrfTokenCookie(res, generateCsrfToken());

    return res.status(201).json(toSignupOrgResponse(result));
  };
