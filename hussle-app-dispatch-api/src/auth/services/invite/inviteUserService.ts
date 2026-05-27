import { BadRequestError } from '@mocho/common';
import { OrganizationStatus } from '../../constants/enums';
import { InvitationStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/utils/logger';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits';
import { SeatLimitReachedError } from '@/shared/errors';

interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface InviteUsersPayload {
  users: InviteUserInput[];
  organizationId: string;
  userOrganizationId: string;
}

interface InviteUserDependencies {
  findInviteByFilter: (filter: {
    email: { $in: string[] };
    organizationId: string;
    status: InvitationStatus;
  }) => Promise<{ email: string }[] | null>;
  findMembershipbyFilter: (filter: {
    userId: { $in: string[] };
    organizationId: string;
  }) => Promise<{ email: string }[] | null>;
  createInvite: (data: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    token: string;
    status: InvitationStatus;
    expiresAt: Date;
  }) => Promise<{
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    organizationId: string;
    token: string;
    expiresAt: string;
  }>;
  findUserByFilter: (filter: {
    email: { $in: string[] };
  }) => Promise<{ id: string }[] | null>;
  findOneOrganizationByFilter: (filter: {
    id: string;
    status: string;
  }) => Promise<{ id: string } | null>;
  countActiveMemberships: (organizationId: string) => Promise<number>;
  countPendingInvitations: (organizationId: string) => Promise<number>;
  allowedRoles: string[];
}

// todo validate organization]
export const inviteUserService = async (
  { users, organizationId, userOrganizationId }: InviteUsersPayload,
  deps: InviteUserDependencies,
) => {
  const invitesToCreate: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    organizationId: string;
    token: string;
    status: InvitationStatus;
    expiresAt: Date;
  }[] = [];
  const invited: string[] = [];
  const skipped: { email: string; reason: string }[] = [];

  if (!organizationId) {
    throw new BadRequestError('Organization ID is required.');
  }

  if (userOrganizationId !== organizationId) {
    throw new BadRequestError('You do not have permission to invite users to this organization.');
  }

  const organization = await deps.findOneOrganizationByFilter({
    id: organizationId,
    status: OrganizationStatus.ACTIVE,
  });

  logger.info('Organization lookup complete', { organizationId });

  if (!organization) {
    throw new BadRequestError('Organization not found or inactive.');
  }

  const [activeMemberships, pendingInvitations] = await Promise.all([
    deps.countActiveMemberships(organizationId),
    deps.countPendingInvitations(organizationId),
  ]);

  const totalOccupied = activeMemberships + pendingInvitations + users.length;

  if (totalOccupied > SUBSCRIPTION_LIMITS.maxUsers) {
    throw new SeatLimitReachedError('users', SUBSCRIPTION_LIMITS.maxUsers);
  }

  const usersEmails = users.map((user) => user.email.toLowerCase().trim());
  const emails = Array.from(new Set(usersEmails));

  const usersObj = await deps.findUserByFilter({
    email: { $in: emails },
  });

  let userIds: string[] = [];
  if (usersObj && usersObj.length > 0) {
    userIds = usersObj.map((user) => user.id);
  }

  logger.info('Users lookup complete', { userCount: userIds.length });

  const [existingInvites, existingMemberships] = await Promise.all([
    deps.findInviteByFilter({
      email: { $in: emails },
      organizationId,
      status: InvitationStatus.PENDING,
    }),
    deps.findMembershipbyFilter({
      userId: { $in: userIds },
      organizationId,
    }),
  ]);

  logger.info('Invite context', { organizationId, emailCount: emails.length });
  logger.info('Existing invites and memberships', {
    existingInviteCount: existingInvites?.length ?? 0,
    existingMembershipCount: existingMemberships?.length ?? 0,
  });

  const existingInviteMap = new Map(existingInvites?.map((i) => [i.email, i]));
  const existingMembershipMap = new Map(existingMemberships?.map((m) => [m.email, m]));

  logger.info('Invite maps built', {
    inviteMapSize: existingInviteMap.size,
    membershipMapSize: existingMembershipMap.size,
  });

  for (const { email, firstName, lastName, role } of users) {
    if (!email || !role) {
      skipped.push({ email, reason: 'Email and role are required' });
      continue;
    }

    if (!deps.allowedRoles.includes(role)) {
      skipped.push({ email, reason: `Invalid role: ${role}` });
      continue;
    }

    if (existingInviteMap.has(email)) {
      skipped.push({ email, reason: 'Active invitation already exists' });
      continue;
    }

    if (existingMembershipMap.has(email)) {
      skipped.push({ email, reason: 'User is already a member' });
      continue;
    }

    invitesToCreate.push({
      email,
      firstName,
      lastName,
      role,
      organizationId,
      token: uuidv4(),
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  logger.info('Invites to create', { count: invitesToCreate.length });
  logger.info('Invites skipped', { count: skipped.length });

  const createdInvites = await Promise.all(
    invitesToCreate.map((invitePayload) => deps.createInvite(invitePayload)),
  );

  createdInvites.forEach((inviteRecord) => {
    if (inviteRecord.email) {
      invited.push(inviteRecord.email);
    }
  });

  return {
    invited,
    skipped,
    invites: createdInvites,
  };
};
