import type { Request } from 'express';
import type { ManualLoadIntelInput } from '../../types/bookTypes';

export const bookLoadMapper = (
  req: Request,
): { orgId: string; loadHash: string } => ({
  orgId: req.organizationId ?? '',
  loadHash: req.params['id'] ?? '',
});

export const manualLoadIntelMapper = (
  req: Request,
): { orgId: string; input: ManualLoadIntelInput } => ({
  orgId: req.organizationId ?? '',
  input: req.body as ManualLoadIntelInput,
});

export const ingestSingleMapper = (
  req: Request,
): { orgId: string; payload: unknown } => ({
  orgId: req.organizationId ?? '',
  payload: req.body,
});

export const ingestBatchMapper = (
  req: Request,
): { orgId: string; payloads: unknown[] } => ({
  orgId: req.organizationId ?? '',
  payloads: req.body as unknown[],
});
