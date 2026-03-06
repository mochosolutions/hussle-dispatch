import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError } from '@/shared/errors';
import { deleteMembershipService } from '../../services';
import type { Membership } from '../../types/membershipTypes';
import { deleteMembershipMapper } from './mappers/deleteMembershipMapper';

interface MembershipRepoDeps {
  deleteMembership: (organizationId: string, membershipId: string) => Promise<Membership | null>;
}

interface DeleteMembershipControllerDeps {
  membershipRepo: MembershipRepoDeps;
}

export const deleteMembershipController =
  ({ membershipRepo }: DeleteMembershipControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const { organizationId, membershipId } = deleteMembershipMapper(req);
    const deletedMembership = await deleteMembershipService(membershipId, {
      deleteById: (id: string) => membershipRepo.deleteMembership(organizationId, id),
    });

    if (!deletedMembership) {
      throw new NotFoundError('Membership not found');
    }

    return res.status(200).json({ deleted: true });
  };
