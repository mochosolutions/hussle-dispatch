import express from 'express';
import { requireAuth } from '@/middleware/auth';
import { validateRequest } from '@/shared/middleware/validateRequest';
import type { ContactControllers } from '../controllers/contactController';
import {
  contactIdParamValidator,
  createContactValidator,
  listContactsValidator,
  updateContactValidator,
} from '../validators/contactValidators';

export const createContactsRouter = (controllers: ContactControllers): express.Router => {
  const router = express.Router();

  router.post('/', requireAuth, validateRequest(createContactValidator), controllers.createContact);
  router.get('/', requireAuth, validateRequest(listContactsValidator), controllers.listContacts);
  router.get(
    '/:id/stats',
    requireAuth,
    validateRequest(contactIdParamValidator),
    controllers.getContactStats,
  );
  router.get(
    '/:id',
    requireAuth,
    validateRequest(contactIdParamValidator),
    controllers.getContactById,
  );
  router.patch(
    '/:id',
    requireAuth,
    validateRequest(updateContactValidator),
    controllers.updateContact,
  );
  router.delete(
    '/:id',
    requireAuth,
    validateRequest(contactIdParamValidator),
    controllers.deleteContact,
  );

  return router;
};
