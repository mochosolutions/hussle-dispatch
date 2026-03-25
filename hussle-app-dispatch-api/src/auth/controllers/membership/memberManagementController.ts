import type { Request, RequestHandler, Response } from 'express';
import type { Role } from '@/config/roles';
import type { MembershipWithUser } from '../../types/membershipTypes';
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
  }): Promise<void>;
  removeMember(input: {
    organizationId: string;
    membershipId: string;
    requestingUserId: string;
  }): Promise<void>;
}

interface MemberManagementControllerDeps {
  memberManagementService: MemberManagementServicePort;
}

export const createListMembersController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = listMembersMapper(req);
    const members = await deps.memberManagementService.listMembers(input);
    sendSingle(res, toMemberListResponse(members));
  };

export const createChangeMemberRoleController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = changeMemberRoleMapper(req);
    await deps.memberManagementService.changeMemberRole(input);
    sendSingle(res, { updated: true });
  };

export const createRemoveMemberController =
  (deps: MemberManagementControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const input = removeMemberMapper(req);
    await deps.memberManagementService.removeMember(input);
    res.status(204).send();
  };
