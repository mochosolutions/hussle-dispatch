import express from 'express';
import { userAuthRouter } from './auth';
import { inviteRouter } from './invite';
import { organizationRouter } from './organization';

const rootAuthRouter = express.Router();

rootAuthRouter.use('/api', userAuthRouter);
rootAuthRouter.use('/api', organizationRouter);
rootAuthRouter.use('/api', inviteRouter);

export default rootAuthRouter;
