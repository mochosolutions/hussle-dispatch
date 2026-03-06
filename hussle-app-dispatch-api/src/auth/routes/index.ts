import express from 'express';
import type { AuthControllers } from '../controllers';
import { createUserAuthRouter } from './auth';
import { createInviteRouter } from './invite';
import { createOrganizationRouter } from './organization';

export const createRootAuthRouter = (controllers: AuthControllers): express.Router => {
  const rootAuthRouter = express.Router();
  const userAuthRouter = createUserAuthRouter(controllers);
  const organizationRouter = createOrganizationRouter(controllers);
  const inviteRouter = createInviteRouter(controllers);

  ['/api', '/api/v1'].forEach((prefix) => {
    rootAuthRouter.use(prefix, userAuthRouter);
    rootAuthRouter.use(prefix, organizationRouter);
    rootAuthRouter.use(prefix, inviteRouter);
  });

  return rootAuthRouter;
};
