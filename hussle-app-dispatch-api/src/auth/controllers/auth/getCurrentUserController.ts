import type { Request, RequestHandler, Response } from 'express';
import { NotFoundError, UnauthorizedError } from '@/shared/errors';
import { currentUserService } from '../../services';
import { mapCurrentUserRequest } from './mappers/mapCurrentUserRequest';
import { toCurrentUserResponse } from './transformers/currentUserTransformer';
import type { userRepositoryPrisma } from '../../repositories/userRepositoryPrisma';

interface GetCurrentUserControllerDeps {
  userRepo: Pick<ReturnType<typeof userRepositoryPrisma>, 'findUserByIdWithMemberships'>;
}

export const createGetCurrentUserController = ({
  userRepo,
}: GetCurrentUserControllerDeps): RequestHandler =>
  async (req: Request, res: Response) => {
    const serviceInput = mapCurrentUserRequest(req);

    if (!serviceInput) {
      throw new UnauthorizedError('Authentication required');
    }

    const result = await currentUserService(serviceInput, {
      findUserByIdWithMemberships: userRepo.findUserByIdWithMemberships,
    });

    if (!result) {
      throw new NotFoundError('User not found');
    }

    return res.status(200).json(toCurrentUserResponse(result));
  };
