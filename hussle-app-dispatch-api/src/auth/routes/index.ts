import express from 'express';
import type { AuthControllers } from '../controllers';
import type { AuthModuleValidators } from '../compositionRoot';
import { createUserAuthRouter } from './auth';
import { createInviteRouter } from './invite';
import { createOrganizationRouter } from './organization';

export const createRootAuthRouter = (
  controllers: AuthControllers,
  validators: AuthModuleValidators,
): express.Router => {
  const rootAuthRouter = express.Router();
  const userAuthRouter = createUserAuthRouter(controllers, validators);
  const organizationRouter = createOrganizationRouter(controllers);
  const inviteRouter = createInviteRouter(controllers);

  ['/api', '/api/v1'].forEach((prefix) => {
    rootAuthRouter.use(prefix, userAuthRouter);
    rootAuthRouter.use(prefix, organizationRouter);
    rootAuthRouter.use(prefix, inviteRouter);
  });

  return rootAuthRouter;
};
