// ---------------------------------------------------------------------------
// Shared presign → S3 PUT → confirm orchestration used by both the dispatcher
// upload saga (`features/documents`) and the carrier portal upload saga
// (`features/carrier-portal`).
//
// IMPORTANT — this helper has no try/catch. Errors propagate to the calling
// saga so each side can dispatch its own typed failure action and toast.
// ---------------------------------------------------------------------------

import { call } from 'redux-saga/effects';

import type { DocumentEntityType, DocumentType } from 'features/documents/types';

export interface NormalizedPresign {
  documentId: string;
  presignedUrl: string;
}

export interface UploadFileViaPresignInput {
  file: File;
  documentType: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface PresignFnInput {
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface ConfirmFnInput {
  expiresAt?: string;
  metadata?: Record<string, string>;
}

export interface UploadFileViaPresignDeps<TConfirm = unknown> {
  presignFn: (input: PresignFnInput) => Promise<NormalizedPresign>;
  confirmFn: (documentId: string, confirmInput?: ConfirmFnInput) => Promise<TConfirm>;
  uploadFn: (presignedUrl: string, file: File) => Promise<void>;
}

const hasMetadata = (metadata?: Record<string, string>): boolean =>
  Boolean(metadata && Object.keys(metadata).length > 0);

const buildConfirmInput = (
  expiresAt?: string,
  metadata?: Record<string, string>,
): ConfirmFnInput | undefined => {
  if (!expiresAt && !hasMetadata(metadata)) {
    return undefined;
  }
  return {
    ...(expiresAt ? { expiresAt } : {}),
    ...(hasMetadata(metadata) ? { metadata } : {}),
  };
};

export function* uploadFileViaPresign<TConfirm = unknown>(
  input: UploadFileViaPresignInput,
  deps: UploadFileViaPresignDeps<TConfirm>,
): Generator<unknown, { documentId: string; confirmResult: TConfirm }, unknown> {
  const { file, documentType, entityType, entityId, expiresAt, metadata } = input;

  const presignInput: PresignFnInput = {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
    type: documentType,
    entityType,
    entityId,
    ...(expiresAt ? { expiresAt } : {}),
    ...(hasMetadata(metadata) ? { metadata } : {}),
  };

  const presign = (yield call(deps.presignFn, presignInput)) as NormalizedPresign;

  yield call(deps.uploadFn, presign.presignedUrl, file);

  const confirmInput = buildConfirmInput(expiresAt, metadata);
  const confirmResult = (yield call(deps.confirmFn, presign.documentId, confirmInput)) as TConfirm;

  return { documentId: presign.documentId, confirmResult };
}
