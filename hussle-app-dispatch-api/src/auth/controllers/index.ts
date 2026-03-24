import type { RequestHandler } from 'express';
import type { ITokenProvider } from '../types/tokenProvider';
import { createConfirmForgotPasswordController } from './auth/confirmForgotPasswordController';
import { createConfirmUserSignUpController } from './auth/confirmUserSignUpController';
import { createForgotPasswordController } from './auth/forgotPasswordController';
import { createGetCurrentUserController } from './auth/getCurrentUserController';
import { createLoginController } from './auth/loginController';
import { createLogoutController } from './auth/logoutController';
import { createPasswordChallengeController } from './auth/passwordChallengeController';
import { createRefreshTokenController } from './auth/refreshTokenController';
import { createResendConfirmationCodeController } from './auth/resendConfirmationCodeController';
import { createSignupOrgController } from './auth/signupOrgController';
import { createSwitchOrgController } from './auth/switchOrgController';
import { createAcceptInviteController } from './invite/acceptInviteController';
import { createGetInvitesController } from './invite/getInvitesController';
import { createInviteUserController } from './invite/inviteUserController';
import { createVerifyInviteController } from './invite/verifyInviteController';
import { createOrgMembershipController } from './membership/createMembershipController';
import { deleteMembershipController } from './membership/deleteMembershipController';
import { getMembershipController } from './membership/getMembershipsController';
import { updateMembershipController } from './membership/updateMembershipController';
import { createOrganizationController } from './orgs/createOrgController';
import { deleteOrganizationController } from './orgs/deleteOrgController';
import { getOrganizationsController } from './orgs/getAllOrgsController';
import { getOrganizationsByIdController } from './orgs/getOrgByIdController';
import { updateOrganizationController } from './orgs/updateOrgController';
import { getClientId } from '@/shared/utils/cognito';
import { cognitoIdentityClient } from '@/shared/utils/cognito';
import { cognitoProvider } from '../providers/authProvider';
import type { PrismaTransaction } from '@/shared/prisma';
import type {
  Membership,
  MembershipWithUser,
  UpdateMembershipInput,
} from '../types/membershipTypes';
import type { CreateOrganizationInput, Organization } from '../types/organizationTypes';
import type { SignupOrgInput, SignupOrgResult } from '../types/signupOrgTypes';
import type { Invite } from '../types/invite';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { Logger } from '@/shared/utils/logger';
import type { CreateAuditLogInput } from '../types/auditLogPort';

interface OrgControllerRepoDeps {
  createOrganization: (data: CreateOrganizationInput) => Promise<Organization>;
  findAllOrganizations: () => Promise<Organization[]>;
  findOrganizationById: (id: string) => Promise<Organization | null>;
  updateOrganization: (
    id: string,
    data: Partial<Organization>,
  ) => Promise<Organization | null>;
  deleteOrganization: (id: string) => Promise<Organization | null>;
}

interface AuthControllerFactoryDeps {
  auditLogRepo: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
  signupTokenProviderInstance: ITokenProvider;
  refreshTokenProviderInstance: ITokenProvider;
  orgRepo: OrgControllerRepoDeps;
  membershipRepo: {
    createMembership: (
      organizationId: string,
      data: {
        userId: string;
        organizationId: string;
        role: string;
        status: string;
      },
    ) => Promise<Membership>;
    findMembershipByUserAndOrganization: (
      organizationId: string,
      userId: string,
    ) => Promise<Membership | null>;
    findMembershipsByOrganization: (organizationId: string) => Promise<MembershipWithUser[]>;
    deleteMembership: (organizationId: string, membershipId: string) => Promise<Membership | null>;
    updateMembership: (
      organizationId: string,
      membershipId: string,
      data: UpdateMembershipInput,
    ) => Promise<Membership | null>;
    findMembershipsByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<MembershipWithUser[] | null>;
    findMembershipsByUserId: (userId: string) => Promise<Membership[] | null>;
  };
  inviteRepo: {
    findAllInvites: (organizationId: string) => Promise<Invite[]>;
    findInviteByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<Invite[] | null>;
    create: (data: {
      email: string;
      role: string;
      organizationId: string;
      token: string;
      status: string;
      expiresAt: Date;
    }) => Promise<{ email: string }>;
    findOneByFilter: (
      organizationId: string,
      filter: Record<string, unknown>,
    ) => Promise<Invite | null>;
    updateInvite: (
      organizationId: string,
      id: string,
      data: Partial<Invite>,
    ) => Promise<Invite | null>;
  };
  userRepo: {
    findUserByEmail: (email: string) => Promise<import('../types/user').User | null>;
    findUsersByEmails: (emails: string[]) => Promise<{ id: string }[]>;
    findUserByExternalId: (externalId: string) => Promise<import('../types/user').User | null>;
    findUserByIdWithMemberships: (id: string) => Promise<import('../types/user').UserWithMemberships | null>;
  };
  tokenProviderInstance: ITokenProvider;
  loginTokenProviderInstance: ITokenProvider;
  transactionManager: {
    runInTransaction: <T>(fn: (tx: PrismaTransaction) => Promise<T>) => Promise<T>;
  };
  signupOrganization: (data: SignupOrgInput) => Promise<SignupOrgResult>;
  allowedRoles: string[];
  eventBus: EventBus;
  logger: Logger;
  config: { defaultOrgRole: string };
}

export interface AuthControllers {
  signupOrgController: RequestHandler;
  loginController: RequestHandler;
  logoutController: RequestHandler;
  getCurrentUserController: RequestHandler;
  refreshTokenController: RequestHandler;
  confirmForgotPasswordController: RequestHandler;
  forgotPasswordController: RequestHandler;
  passwordChallengeController: RequestHandler;
  confirmUserSignUpController: RequestHandler;
  switchOrgController: RequestHandler;
  resendConfirmationCodeController: RequestHandler;
  createOrganizationController: RequestHandler;
  getOrganizationsController: RequestHandler;
  getOrganizationsByIdController: RequestHandler;
  updateOrganizationController: RequestHandler;
  createOrgMembershipController: RequestHandler;
  getMembershipController: RequestHandler;
  deleteMembershipController: RequestHandler;
  updateMembershipController: RequestHandler;
  deleteOrganizationController: RequestHandler;
  inviteUserController: RequestHandler;
  verifyInviteController: RequestHandler;
  acceptInviteController: RequestHandler;
  getInvitesController: RequestHandler;
}

export const createAuthControllers = ({
  auditLogRepo,
  signupTokenProviderInstance,
  refreshTokenProviderInstance,
  orgRepo,
  membershipRepo,
  inviteRepo,
  userRepo,
  tokenProviderInstance,
  loginTokenProviderInstance,
  transactionManager,
  signupOrganization,
  allowedRoles,
  eventBus,
  logger,
  config,
}: AuthControllerFactoryDeps): AuthControllers => {
  const getAuthProvider = async () => {
    const { clientId, userPoolId } = await getClientId();
    return cognitoProvider({ client: cognitoIdentityClient, userPoolId, clientId });
  };

  return {
    signupOrgController: createSignupOrgController({
      tokenProviderInstance: signupTokenProviderInstance,
      signupOrganization,
      eventBus,
      logger,
      config,
    }),
    loginController: createLoginController({
      membershipRepo,
      userRepo,
      tokenProviderInstance: loginTokenProviderInstance,
      auditLogRepo,
      getAuthProvider,
    }),
    logoutController: createLogoutController({ tokenProviderInstance }),
    getCurrentUserController: createGetCurrentUserController({ userRepo }),
    refreshTokenController: createRefreshTokenController({ tokenProviderInstance: refreshTokenProviderInstance }),
    confirmForgotPasswordController: createConfirmForgotPasswordController({ getAuthProvider }),
    forgotPasswordController: createForgotPasswordController({ getAuthProvider }),
    passwordChallengeController: createPasswordChallengeController({ getAuthProvider }),
    confirmUserSignUpController: createConfirmUserSignUpController({ getAuthProvider }),
    switchOrgController: createSwitchOrgController({ userRepo, tokenProviderInstance }),
    resendConfirmationCodeController: createResendConfirmationCodeController({ getAuthProvider }),
    createOrganizationController: createOrganizationController({ orgRepo }),
    getOrganizationsController: getOrganizationsController({ orgRepo }),
    getOrganizationsByIdController: getOrganizationsByIdController({ orgRepo }),
    updateOrganizationController: updateOrganizationController({ orgRepo }),
    createOrgMembershipController: createOrgMembershipController({ membershipRepo }),
    getMembershipController: getMembershipController({ membershipRepo }),
    deleteMembershipController: deleteMembershipController({ membershipRepo }),
    updateMembershipController: updateMembershipController({ membershipRepo }),
    deleteOrganizationController: deleteOrganizationController({ orgRepo }),
    inviteUserController: createInviteUserController({
      inviteRepo,
      membershipRepo,
      userRepo,
      orgRepo,
      allowedRoles,
    }),
    verifyInviteController: createVerifyInviteController({
      inviteRepo,
      orgRepo,
      userRepo,
    }),
    acceptInviteController: createAcceptInviteController({
      transactionManager,
      getAuthProvider,
      tokenProviderInstance,
    }),
    getInvitesController: createGetInvitesController({ inviteRepo }),
  };
};
