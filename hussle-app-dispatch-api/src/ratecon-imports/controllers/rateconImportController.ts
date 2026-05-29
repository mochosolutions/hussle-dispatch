import type { Request, Response } from 'express';

import { buildPaginationMeta, sendList, sendSingle } from '@/shared/responseEnvelope';

import type { RateconImportService } from '../services/rateconImportService';
import {
  acceptMapper,
  importIdMapper,
  listImportsMapper,
  manualUploadMapper,
  rejectMapper,
  retryMapper,
} from './mappers/rateconImportMappers';
import { toImportDetailResponse, toImportResponse } from './transformers/rateconImportTransformer';

export interface RateconImportControllerDeps {
  rateconImportService: RateconImportService;
}

export interface RateconImportControllers {
  list: (req: Request, res: Response) => Promise<void>;
  getById: (req: Request, res: Response) => Promise<void>;
  accept: (req: Request, res: Response) => Promise<void>;
  reject: (req: Request, res: Response) => Promise<void>;
  retry: (req: Request, res: Response) => Promise<void>;
  manualUpload: (req: Request, res: Response) => Promise<void>;
}

export const createRateconImportControllers = (
  deps: RateconImportControllerDeps,
): RateconImportControllers => ({
  list: async (req, res) => {
    const items = await deps.rateconImportService.list(listImportsMapper(req));
    sendList(res, {
      data: items.map(toImportResponse),
      meta: buildPaginationMeta(items.length, 1, Math.max(items.length, 1)),
    });
  },

  getById: async (req, res) => {
    const detail = await deps.rateconImportService.get(importIdMapper(req));
    sendSingle(res, toImportDetailResponse(detail));
  },

  accept: async (req, res) => {
    const updated = await deps.rateconImportService.accept(acceptMapper(req));
    sendSingle(res, toImportResponse(updated));
  },

  reject: async (req, res) => {
    await deps.rateconImportService.reject(rejectMapper(req));
    sendSingle(res, { rejected: true });
  },

  retry: async (req, res) => {
    const updated = await deps.rateconImportService.retry(retryMapper(req));
    sendSingle(res, toImportResponse(updated));
  },

  manualUpload: async (req, res) => {
    const created = await deps.rateconImportService.createFromBytes(manualUploadMapper(req));
    sendSingle(res, toImportResponse(created), 201);
  },
});
