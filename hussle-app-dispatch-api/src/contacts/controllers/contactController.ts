import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendList, sendSingle } from '@/shared/responseEnvelope';
import type { ContactService } from '../types/contactServiceTypes';
import { createContactMapper } from './mappers/createContactMapper';
import { getRequiredContactIdMapper } from './mappers/getRequiredContactIdMapper';
import { getRequestContextMapper } from '@/shared/mappers/getRequestContextMapper';
import { listContactsMapper } from './mappers/listContactsMapper';
import { updateContactMapper } from './mappers/updateContactMapper';
import { toContactListEnvelope, toContactResponse } from './transformers/contactTransformer';

interface ContactControllerDeps {
  contactService: ContactService;
}

export interface ContactControllers {
  createContact: RequestHandler;
  listContacts: RequestHandler;
  getContactById: RequestHandler;
  updateContact: RequestHandler;
  deleteContact: RequestHandler;
}

export const createContactControllers = (deps: ContactControllerDeps): ContactControllers => ({
  createContact: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = createContactMapper(req);
    const contact = await deps.contactService.createContact(serviceInput);
    sendSingle(res, toContactResponse(contact), 201);
  },

  listContacts: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = listContactsMapper(req);
    const result = await deps.contactService.listContacts(serviceInput);
    const response = toContactListEnvelope(result.data, result.meta);
    sendList(res, { data: response.data, meta: response.meta });
  },

  getContactById: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredContactIdMapper(req);
    const contact = await deps.contactService.getContactById({
      ...context,
      id,
    });
    sendSingle(res, toContactResponse(contact));
  },

  updateContact: async (req: Request, res: Response): Promise<void> => {
    const serviceInput = updateContactMapper(req);
    const contact = await deps.contactService.updateContact(serviceInput);
    sendSingle(res, toContactResponse(contact));
  },

  deleteContact: async (req: Request, res: Response): Promise<void> => {
    const context = getRequestContextMapper(req);
    const id = getRequiredContactIdMapper(req);
    await deps.contactService.deleteContact({
      ...context,
      id,
    });

    res.status(204).send();
  },
});
