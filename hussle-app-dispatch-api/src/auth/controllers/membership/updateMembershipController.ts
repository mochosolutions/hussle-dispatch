import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError } from '@/shared/errors';
import type { Membership, UpdateMembershipInput } from '../../types/membershipTypes';
import { updateMembershipMapper } from './mappers/updateMembershipMapper';
import { toMembershipResponse } from './transformers/membershipTransformer';

interface MembershipRepoDeps {
  updateMembership: (
    organizationId: string,
    membershipId: string,
    data: UpdateMembershipInput,
  ) => Promise<Membership | null>;
}

interface UpdateMembershipControllerDeps {
  membershipRepo: MembershipRepoDeps;
}

export const updateMembershipController =
  ({ membershipRepo }: UpdateMembershipControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId, membershipId, data } = updateMembershipMapper(req);
    const updatedMembership = await membershipRepo.updateMembership(
      organizationId,
      membershipId,
      data,
    );

    if (!updatedMembership) {
      throw new NotFoundError('Membership not found');
    }

    const response = toMembershipResponse(updatedMembership);

    return res.status(200).json({
      message: 'Membership updated successfully',
      data: response.membership,
    });
  };
