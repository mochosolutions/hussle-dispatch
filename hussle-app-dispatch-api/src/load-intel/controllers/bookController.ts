import type { Request, Response } from 'express';
import { sendSingle } from '../../shared/responseEnvelope';
import type { BookLoadPrefill, BookChainPrefill } from '../types/bookTypes';
import type { IngestResult, IngestBatchResult, LoadIntelPayload } from '../types/loadIntelTypes';
import { bookLoadMapper, manualLoadIntelMapper, ingestSingleMapper, ingestBatchMapper } from './mappers/bookMapper';

interface BookLoadControllerDeps {
  bookLoad: (orgId: string, loadHash: string) => Promise<BookLoadPrefill>;
}

export const bookLoadController = (deps: BookLoadControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, loadHash } = bookLoadMapper(req);
    const prefill = await deps.bookLoad(orgId, loadHash);
    sendSingle(res, prefill);
  };

interface BookChainControllerDeps {
  bookChain: (orgId: string, loadHash: string) => Promise<BookChainPrefill>;
}

export const bookChainController = (deps: BookChainControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, loadHash } = bookLoadMapper(req);
    const prefill = await deps.bookChain(orgId, loadHash);
    sendSingle(res, prefill);
  };

interface ManualIntelControllerDeps {
  ingest: (orgId: string, payload: unknown) => Promise<IngestResult>;
}

export const manualIntelController = (deps: ManualIntelControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, input } = manualLoadIntelMapper(req);

    // Normalize manual entry to LoadIntelPayload shape
    const payload: LoadIntelPayload = {
      source: 'MANUAL',
      origin: input.origin,
      dest: input.dest,
      pickupDate: input.pickupDate,
      equipmentType: input.equipmentType as LoadIntelPayload['equipmentType'],
      rate: input.rate,
      loadedMiles: input.miles,
      broker: input.broker !== undefined ? { name: input.broker, mc: '' } : undefined,
    };

    const result = await deps.ingest(orgId, payload);
    sendSingle(res, result, 201);
  };

interface IngestSingleControllerDeps {
  ingest: (orgId: string, payload: unknown) => Promise<IngestResult>;
}

export const ingestSingleController = (deps: IngestSingleControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, payload } = ingestSingleMapper(req);
    const result = await deps.ingest(orgId, payload);
    sendSingle(res, result, 201);
  };

interface IngestBatchControllerDeps {
  ingestBatch: (orgId: string, payloads: unknown[]) => Promise<IngestBatchResult>;
}

export const ingestBatchController = (deps: IngestBatchControllerDeps) =>
  async (req: Request, res: Response) => {
    const { orgId, payloads } = ingestBatchMapper(req);
    const result = await deps.ingestBatch(orgId, payloads);
    sendSingle(res, result, 201);
  };
