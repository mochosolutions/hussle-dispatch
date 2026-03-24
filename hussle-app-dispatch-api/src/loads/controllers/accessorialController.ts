import type { Request, Response } from 'express';
import type { RequestHandler } from 'express';
import { sendSingle } from '@/shared/responseEnvelope';
import { UnauthorizedError } from '@/shared/errors';
import type { AccessorialService } from '../services/accessorialService';
import { createAccessorialMapper } from './mappers/createAccessorialMapper';
import { updateAccessorialMapper } from './mappers/updateAccessorialMapper';
import { toAccessorialResponse, toAccessorialListResponse } from './transformers/accessorialTransformer';

interface AccessorialControllerDeps {
  accessorialService: AccessorialService;
}

export interface AccessorialControllers {
  create: RequestHandler;
  update: RequestHandler;
  updateApproval: RequestHandler;
  remove: RequestHandler;
  list: RequestHandler;
  get: RequestHandler;
}

export const createAccessorialControllers = (
  deps: AccessorialControllerDeps,
): AccessorialControllers => ({
  create: async (req: Request, res: Response): Promise<void> => {
    const input = createAccessorialMapper(req);
    const charge = await deps.accessorialService.createAccessorial(input);
    sendSingle(res, toAccessorialResponse(charge), 201);
  },

  update: async (req: Request, res: Response): Promise<void> => {
    const input = updateAccessorialMapper(req);
    const charge = await deps.accessorialService.updateAccessorial(input);
    sendSingle(res, toAccessorialResponse(charge));
  },

  remove: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const id = req.params['id'];

    if (organizationId === undefined || id === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    await deps.accessorialService.deleteAccessorial(id, organizationId);
    res.status(204).send();
  },

  list: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const loadId = req.params['loadId'];

    if (organizationId === undefined || loadId === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const charges = await deps.accessorialService.listAccessorials(loadId, organizationId);
    sendSingle(res, toAccessorialListResponse(charges));
  },

  get: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const id = req.params['id'];

    if (organizationId === undefined || id === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const charge = await deps.accessorialService.getAccessorial(id, organizationId);
    sendSingle(res, toAccessorialResponse(charge));
  },

  updateApproval: async (req: Request, res: Response): Promise<void> => {
    const organizationId = req.organizationId;
    const id = req.params['id'];

    if (organizationId === undefined || id === undefined) {
      throw new UnauthorizedError('Authentication required');
    }

    const input = {
      id,
      organizationId,
      approvalStatus: req.body.approvalStatus,
      approvalSource: req.body.approvalSource,
      approvalNotes: req.body.approvalNotes,
      documentId: req.body.documentId,
    };

    const charge = await deps.accessorialService.updateApproval(input);
    sendSingle(res, toAccessorialResponse(charge));
  },
});
