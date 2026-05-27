import express from 'express';
import { validateRequest } from '@/shared/middleware/validateRequest';
import { resolveSlugValidator } from '../validators/resolveSlugValidator';

export interface ShortLinkControllers {
  resolveSlug: express.RequestHandler;
}

export const createShortLinkRoutes = (
  controllers: ShortLinkControllers,
): express.Router => {
  const router = express.Router();

  router.get(
    '/:slug',
    validateRequest(resolveSlugValidator),
    controllers.resolveSlug,
  );

  return router;
};
