import type { RequestHandler } from 'express';
import type { PrismaClient } from '@prisma/client';
import { NotFoundError, UnauthorizedError } from '../../shared/errors/commonErrors';
import { sendSingle } from '../../shared/responseEnvelope';
import type { LoadBoardService } from '../services/loadBoardService';
import { ingestMapper } from './mappers/ingestMapper';
import { getFeedMapper } from './mappers/getFeedMapper';
import { getLoadDetailMapper } from './mappers/getLoadDetailMapper';
import { clearSourceMapper } from './mappers/clearSourceMapper';

export interface LoadBoardControllers {
  ingest: RequestHandler;
  getFeed: RequestHandler;
  getLoadDetail: RequestHandler;
  clearSource: RequestHandler;
  ping: RequestHandler;
}

interface LoadBoardControllerDeps {
  service: LoadBoardService;
  prisma: PrismaClient;
}

export const createLoadBoardControllers = (deps: LoadBoardControllerDeps): LoadBoardControllers => ({
  ingest: async (req, res) => {
    const input = ingestMapper(req);
    const result = await deps.service.ingest(input);
    sendSingle(res, result);
  },

  getFeed: async (req, res) => {
    const input = getFeedMapper(req);
    const result = await deps.service.getFeed(input);
    // Custom meta shape (FeedMeta), not PaginationMeta — send raw response
    res.status(200).json(result);
  },

  getLoadDetail: async (req, res) => {
    const input = getLoadDetailMapper(req);
    const result = await deps.service.getLoadDetail(input);
    sendSingle(res, result);
  },

  clearSource: async (req, res) => {
    const input = clearSourceMapper(req);
    await deps.service.clearSource(input);
    res.status(204).send();
  },

  ping: async (req, res) => {
    if (!req.organizationId) {
      throw new UnauthorizedError('Organization context is required');
    }
    const org = await deps.prisma.organization.findUnique({
      where: { id: req.organizationId },
      select: { id: true, name: true },
    });
    if (!org) {
      throw new NotFoundError(`Organization with id ${req.organizationId} not found`);
    }
    sendSingle(res, { organizationId: org.id, organizationName: org.name });
  },
});
