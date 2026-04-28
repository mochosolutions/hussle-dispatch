import type { RequestHandler } from 'express';
import { sendList, sendSingle, buildPaginationMeta } from '@/shared/responseEnvelope';
import type { ApiKeyService } from '../services/apiKeyService';
import { createApiKeyMapper } from './mappers/createApiKeyMapper';
import { listApiKeysMapper } from './mappers/listApiKeysMapper';
import { revokeApiKeyMapper } from './mappers/revokeApiKeyMapper';
import {
  apiKeyRecordTransformer,
  createApiKeyTransformer,
} from './transformers/apiKeyTransformer';

export interface ApiKeyControllers {
  create: RequestHandler;
  list: RequestHandler;
  revoke: RequestHandler;
}

interface ApiKeyControllersDeps {
  service: ApiKeyService;
}

export const createApiKeyControllers = (deps: ApiKeyControllersDeps): ApiKeyControllers => ({
  create: async (req, res) => {
    const input = createApiKeyMapper(req);
    const result = await deps.service.generate(input);
    sendSingle(res, createApiKeyTransformer(result), 201);
  },

  list: async (req, res) => {
    const input = listApiKeysMapper(req);
    const records = await deps.service.listForOrg(input.organizationId);
    const data = records.map(apiKeyRecordTransformer);
    sendList(res, {
      data,
      meta: buildPaginationMeta(data.length, 1, data.length === 0 ? 1 : data.length),
    });
  },

  revoke: async (req, res) => {
    const input = revokeApiKeyMapper(req);
    const record = await deps.service.revoke(input);
    sendSingle(res, apiKeyRecordTransformer(record));
  },
});
