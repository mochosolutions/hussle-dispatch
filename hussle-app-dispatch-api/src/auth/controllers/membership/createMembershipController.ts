import type { Request, RequestHandler, Response } from 'express';
import { createMembershipService } from '../../services';
import type { CreateMembershipInput, Membership } from '../../types/membershipTypes';
import { createMembershipMapper } from './mappers/createMembershipMapper';
import { toMembershipResponse } from './transformers/membershipTransformer';

interface MembershipRepoDeps {
  createMembership: (organizationId: string, data: CreateMembershipInput) => Promise<Membership>;
  findMembershipByUserAndOrganization: (
    organizationId: string,
    userId: string,
  ) => Promise<Membership | null>;
}

interface CreateMembershipControllerDeps {
  membershipRepo: MembershipRepoDeps;
}

export const createOrgMembershipController =
  ({ membershipRepo }: CreateMembershipControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const createMemberPayload = createMembershipMapper(req);

    const result = await createMembershipService(createMemberPayload, {
      create: (data) => membershipRepo.createMembership(createMemberPayload.organizationId, data),
      findOneByFilter: (filters) =>
        membershipRepo.findMembershipByUserAndOrganization(
          createMemberPayload.organizationId,
          filters.userId,
        ),
    });

    const response = toMembershipResponse(result);

    return res.status(200).json({
      message: 'Organization updated successfully',
      data: response.membership,
    });
  };
