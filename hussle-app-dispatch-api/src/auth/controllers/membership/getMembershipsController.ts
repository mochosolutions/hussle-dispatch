import type { Request, RequestHandler, Response } from 'express';
import type { MembershipWithUser } from '../../types/membershipTypes';
import { getMembershipsMapper } from './mappers/getMembershipsMapper';
import { toMembershipListResponse } from './transformers/membershipTransformer';

interface MembershipRepoDeps {
  findMembershipsByOrganization: (organizationId: string) => Promise<MembershipWithUser[]>;
}

interface GetMembershipControllerDeps {
  membershipRepo: MembershipRepoDeps;
}

export const getMembershipController =
  ({ membershipRepo }: GetMembershipControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId } = getMembershipsMapper(req);

    const result = await membershipRepo.findMembershipsByOrganization(organizationId);

    const response = toMembershipListResponse(result);

    return res.status(200).json({
      message: 'Memberships retrieved successfully',
      memberships: response.memberships,
    });
  };
