import type { Request, RequestHandler, Response } from 'express';
import { ROLES, type Role } from '@/config/roles';
import type { MembershipWithUser } from '../../types/membershipTypes';
import type { CreateAuditLogInput } from '../../types/auditLogPort';
import { sendSingle } from '@/shared/responseEnvelope';
import { listMembersMapper } from './mappers/listMembersMapper';
import { changeMemberRoleMapper } from './mappers/changeMemberRoleMapper';
import { removeMemberMapper } from './mappers/removeMemberMapper';
import { toMemberListResponse } from './transformers/memberTransformer';

interface MemberManagementServicePort {
  listMembers(input: { organizationId: string }): Promise<MembershipWithUser[]>;
  changeMemberRole(input: {
    organizationId: string;
    membershipId: string;
    role: Role;
  }): Promise<{ oldRole: string; newRole: Role }>;
  removeMember(input: {
    organizationId: string;
    membershipId: string;
    requestingUserId: string;
  }): Promise<void>;
}

interface MemberManagementControllerDeps {
  memberManagementService: MemberManagementServicePort;
  auditLogRepo?: {
    create: (organizationId: string, input: CreateAuditLogInput) => Promise<unknown>;
  };
}

export const createListMembersController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = listMembersMapper(req);
    const members = await deps.memberManagementService.listMembers(input);
    sendSingle(res, toMemberListResponse(members));
  };

// Dispatcher directory — accessible to dispatchers (not just tenant admins) so
// they can assign a dispatcher to a load. Returns only active dispatchers.
export const createListDispatchersController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = listMembersMapper(req);
    const members = await deps.memberManagementService.listMembers(input);
    const dispatchers = members.filter(
      (member) => member.role === ROLES.DISPATCHER && member.status === 'active',
    );
    sendSingle(res, toMemberListResponse(dispatchers));
  };

export const createChangeMemberRoleController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = changeMemberRoleMapper(req);
    const { oldRole, newRole } = await deps.memberManagementService.changeMemberRole(input);

    if (deps.auditLogRepo && req.user?.userId) {
      deps.auditLogRepo
        .create(input.organizationId, {
          userId: req.user.userId,
          action: 'ROLE_CHANGE',
          entityType: 'Membership',
          entityId: input.membershipId,
          changes: { role: { old: oldRole, new: newRole } },
          metadata: { ip: req.ip },
        })
        .catch(() => {});
    }

    sendSingle(res, { updated: true });
  };

export const createRemoveMemberController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = removeMemberMapper(req);
    await deps.memberManagementService.removeMember(input);
    res.status(204).send();
  };
