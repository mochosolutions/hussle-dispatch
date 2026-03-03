import { BadRequestError } from '@mocho/common';
import { each } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { findUsersByIds } from '@/shared/utils/cognito';
import { logger } from '@/shared/utils/logger';
import { InvitationStatus } from '../../constants/enums';

interface InviteUserInput {
  email: string;
  role: string;
}

interface InviteUsersPayload {
  users: InviteUserInput[];
  organizationId: string;
  userOrganizationId: string;
}

interface InviteUserDependencies {
  findInviteByFilter: (filter: any, context?: any) => Promise<any>;
  findMembershipbyFilter: (filter: any, context?: any) => Promise<any>;
  createInvite: (data: any, context?: any) => Promise<any>;
  findUserByFilter: (filter: any, context?: any) => Promise<any>;
  findOneOrganizationByFilter: (filter: any, context?: any) => Promise<any>;

  // createMembership?: (data: any, context?: any) => Promise<any>;
}

// todo validate organization]
export const inviteUserService = async (
  { users, organizationId, userOrganizationId }: InviteUsersPayload,
  {
    findInviteByFilter,
    findMembershipbyFilter,
    findUserByFilter,
    findOneOrganizationByFilter,
    createInvite,
  }: InviteUserDependencies
) => {
  try {
    const invitesToCreate: any[] = [];
    const invited: string[] = [];
    const skipped: { email: string; reason: string }[] = [];
    if (!organizationId) {
      throw new BadRequestError('Organization ID is required.');
    }

    if (userOrganizationId !== organizationId) {
      throw new BadRequestError('You do not have permission to invite users to this organization.');
    }

    const organization = await findOneOrganizationByFilter({
      _id: organizationId,
      status: 'active',
    });

    logger.info('Organization lookup complete', { organizationId });

    if (!organization) {
      throw new BadRequestError('Organization not found or inactive.');
    }

    const usersEmails = users.map((user) => user.email.toLowerCase().trim());
    const emails = Array.from(new Set(usersEmails));

    const usersObj = await findUserByFilter({
      email: { $in: emails },
    });

    let userIds = [];
    if (usersObj && usersObj.length > 0) {
      userIds = usersObj.map((user: any) => user.id);
    }

    logger.info('Users lookup complete', { userCount: userIds.length });

    const [existingInvites, existingMemberships] = await Promise.all([
      findInviteByFilter({
        email: { $in: emails },
        organizationId,
        status: InvitationStatus.Pending,
      }),
      findMembershipbyFilter({
        userId: { $in: userIds },
        organizationId,
      }),
    ]);

    logger.info('Invite context', { organizationId, emailCount: emails.length });
    logger.info('Existing invites and memberships', {
      existingInviteCount: existingInvites?.length ?? 0,
      existingMembershipCount: existingMemberships?.length ?? 0,
    });

    const existingInviteMap = new Map(existingInvites?.map((i: { email: string }) => [i.email, i]));
    const existingMembershipMap = new Map(
      existingMemberships?.map((m: { email: string }) => [m.email, m])
    );

    logger.info('Invite maps built', {
      inviteMapSize: existingInviteMap.size,
      membershipMapSize: existingMembershipMap.size,
    });

    for (const { email, role } of users) {
      if (!email || !role) {
        skipped.push({ email, reason: 'Email and role are required' });
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
        role,
        organizationId,
        token: uuidv4(),
        status: InvitationStatus.Pending,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    logger.info('Invites to create', { count: invitesToCreate.length });
    logger.info('Invites skipped', { count: skipped.length });

    // const existingInvites = await findInviteByFilter({
    // 	email: { $in: emails },
    // 	organizationId,
    // 	status: InvitationStatus.Pending,
    // });

    // const alreadyInvited = new Set(
    // 	existingInvites.map((invite: { email: string }) =>
    // 		invite.email.toLowerCase()
    // 	)
    // );

    // const existingMemberships = await findMembershipbyFilter({
    // 	email: { $in: uniqueEmails },
    // 	organizationId,
    // });

    // const alreadyMembers = new Set(
    // 	existingMemberships.map((mem: { email: string }) =>
    // 		mem.email.toLowerCase()
    // 	)
    // );

    // Step 3: Build valid invites
    // const now = Date.now();
    // const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000); // 7 days

    // const validInvites = uniqueEmails
    // 	.filter(
    // 		(email) => !alreadyInvited.has(email) && !alreadyMembers.has(email)
    // 	)
    // 	.map((email) => ({
    // 		email,
    // 		role:
    // 			users.find((user) => user.email.toLowerCase().trim() === email)
    // 				?.role || '',
    // 		organizationId,
    // 		token: uuidv4(),
    // 		status: InvitationStatus.Pending,
    // 		expiresAt,
    // 	}));

    // const skippedUsers = uniqueEmails
    // 	.filter((email) => alreadyInvited.has(email) || alreadyMembers.has(email))
    // 	.map((email) => ({
    // 		email,
    // 		reason: alreadyInvited.has(email)
    // 			? 'Already invited'
    // 			: 'Already a member',
    // 	}));

    // if (validInvites.length > 0) {
    // 	await createInvite(validInvites);
    // }

    return {
      // validInvites,
      // skippedUsers,
    };

    // const existingInvitation = await findInviteByFilter({
    // 	email,
    // 	organizationId,
    // 	// status: 'pending'
    // });

    // if (existingInvitation) {
    // 	throw new BadRequestError(
    // 		'An active invitation already exists for this email.'
    // 	);
    // }

    // // const existingUser = await userRepo.findOneByFilter({ email });
    // const existingMembership = await findMembershipbyFilter({
    // 	email,
    // 	organizationId,
    // });

    // if (existingMembership) {
    // 	throw new BadRequestError(
    // 		'User is already a member of the organization.'
    // 	);
    // }

    // const invitePayload = {
    // 	email,
    // 	role,
    // 	organizationId: organizationId,
    // 	token: uuidv4(),
    // 	status: InvitationStatus.Pending,
    // 	expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    // };

    // const invite = await createInvite(invitePayload);

    // return invite;
  } catch (error: any) {
    throw new BadRequestError(error.message);
  }
};
