import type { RequestHandler } from 'express';
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
}

interface LoadBoardControllerDeps {
  service: LoadBoardService;
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
});
