import type { Request } from 'express';

import { ValidationError } from '@/shared/errors';

import type {
  AcceptImportInput,
  CreateImportFromBytesInput,
  GetImportInput,
  ListImportsInput,
  RejectImportInput,
  RetryImportInput,
} from '../../types/rateconImportTypes';
import type { RateconImportStatus } from '@prisma/client';

const requireOrg = (req: Request): string => {
  const organizationId = req.organizationId;
  if (organizationId === undefined || organizationId.length === 0) {
    throw new ValidationError('Missing organization scope');
  }
  return organizationId;
};

const requireId = (req: Request): string => {
  const id = req.params['id'];
  if (id === undefined || id.length === 0) {
    throw new ValidationError('Missing required id parameter');
  }
  return id;
};

export const listImportsMapper = (req: Request): ListImportsInput => {
  const status = req.query['status'];
  const includeResolved = req.query['includeResolved'];
  return {
    organizationId: requireOrg(req),
    ...(typeof status === 'string' && { status: status as RateconImportStatus }),
    ...(includeResolved === 'true' && { includeResolved: true }),
  };
};

export const importIdMapper = (req: Request): GetImportInput => ({
  organizationId: requireOrg(req),
  importId: requireId(req),
});

export const acceptMapper = (req: Request): AcceptImportInput => {
  const body = req.body as { loadId: string };
  return {
    organizationId: requireOrg(req),
    importId: requireId(req),
    loadId: body.loadId,
    ...(req.user?.userId !== undefined && { acceptedByUserId: req.user.userId }),
  };
};

export const rejectMapper = (req: Request): RejectImportInput => ({
  organizationId: requireOrg(req),
  importId: requireId(req),
  ...(req.user?.userId !== undefined && { rejectedByUserId: req.user.userId }),
});

export const retryMapper = (req: Request): RetryImportInput => ({
  organizationId: requireOrg(req),
  importId: requireId(req),
});

export const manualUploadMapper = (req: Request): CreateImportFromBytesInput => {
  const file = req.file;
  if (file === undefined) {
    throw new ValidationError('A PDF file is required (multipart field "file")');
  }
  if (file.mimetype !== 'application/pdf') {
    throw new ValidationError('Uploaded file must be a PDF');
  }
  return {
    organizationId: requireOrg(req),
    pdfBytes: file.buffer,
    fileName: file.originalname,
    source: 'MANUAL_UPLOAD',
    ...(req.user?.userId !== undefined && { receivedByUserId: req.user.userId }),
  };
};
