import { Router } from 'express';
import { appAuth } from '@/shared/middleware/authenticateUser';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { ApiKeyControllers } from '../controllers/apiKeyControllers';
import {
  createApiKeyValidator,
  revokeApiKeyValidator,
} from '../validators/apiKeyValidators';

export const apiKeyRoutes = (controllers: ApiKeyControllers): Router => {
  const router = Router();

  router.post('/', appAuth, validateRequest(createApiKeyValidator), controllers.create);
  router.get('/', appAuth, controllers.list);
  router.delete(
    '/:id',
    appAuth,
    validateRequest(revokeApiKeyValidator),
    controllers.revoke,
  );

  return router;
};
