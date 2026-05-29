import { randomUUID } from 'crypto';

import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import type { EventBus } from '@/shared/messaging/eventBus';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import { buildPrefill } from './rateconPrefillMapper';
import type {
  AcceptImportInput,
  CreateImportFromBytesInput,
  CreateImportFromDocumentInput,
  GetImportInput,
  ListImportsInput,
  PendingRateconImport,
  RateconDocumentPort,
  RateconExtractionResult,
  RateconImportRepoPort,
  RateconPrefill,
  RejectImportInput,
  RetryImportInput,
} from '../types/rateconImportTypes';

const RATECON_IMPORT_ENTITY_TYPE = 'ratecon_import';

export interface RateconImportServiceDeps {
  rateconImportRepo: RateconImportRepoPort;
  documentPort: RateconDocumentPort;
  storageProvider: StorageProvider;
  eventBus: EventBus;
  logger: Logger;
}

export interface RateconImportDetail {
  import: PendingRateconImport;
  prefill: RateconPrefill | null;
}

export interface RateconImportService {
  createFromBytes(input: CreateImportFromBytesInput): Promise<PendingRateconImport>;
  createFromDocument(input: CreateImportFromDocumentInput): Promise<PendingRateconImport>;
  list(input: ListImportsInput): Promise<PendingRateconImport[]>;
  get(input: GetImportInput): Promise<RateconImportDetail>;
  accept(input: AcceptImportInput): Promise<PendingRateconImport>;
  reject(input: RejectImportInput): Promise<void>;
  retry(input: RetryImportInput): Promise<PendingRateconImport>;
}

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'ratecon.pdf';

const buildStorageKey = (organizationId: string, importId: string, fileName: string): string =>
  `${organizationId}/ratecon_imports/${importId}/${sanitizeFileName(fileName)}`;

export const createRateconImportService = (
  deps: RateconImportServiceDeps,
): RateconImportService => {
  const emitReceived = async (importId: string, organizationId: string): Promise<void> => {
    await deps.eventBus.publish('ratecon.import.received', { importId, organizationId });
  };

  return {
    createFromBytes: async (input) => {
      const importId = randomUUID();
      const s3Key = buildStorageKey(input.organizationId, importId, input.fileName);
      await deps.storageProvider.put(s3Key, input.pdfBytes, 'application/pdf');

      const doc = await deps.documentPort.createConfirmedDocument({
        organizationId: input.organizationId,
        entityId: importId,
        fileName: input.fileName,
        s3Key,
        fileSize: input.pdfBytes.length,
        ...(input.receivedByUserId !== undefined && { uploadedByUserId: input.receivedByUserId }),
      });

      const created = await deps.rateconImportRepo.create({
        id: importId,
        organizationId: input.organizationId,
        source: input.source,
        status: 'RECEIVED',
        documentId: doc.id,
        ...(input.receivedByUserId !== undefined && { receivedByUserId: input.receivedByUserId }),
        ...(input.emailMessageId !== undefined && { emailMessageId: input.emailMessageId }),
        ...(input.emailSubject !== undefined && { emailSubject: input.emailSubject }),
        ...(input.emailFrom !== undefined && { emailFrom: input.emailFrom }),
        ...(input.brokerEmail !== undefined && { brokerEmail: input.brokerEmail }),
      });

      await emitReceived(created.id, created.organizationId);
      deps.logger.info('Ratecon import created from bytes', {
        importId: created.id,
        source: input.source,
      });
      return created;
    },

    createFromDocument: async (input) => {
      const doc = await deps.documentPort.getById(input.documentId, input.organizationId);
      if (doc === null) {
        throw new NotFoundError(`Document ${input.documentId} not found`);
      }

      const importId = randomUUID();
      const created = await deps.rateconImportRepo.create({
        id: importId,
        organizationId: input.organizationId,
        source: input.source,
        status: 'RECEIVED',
        documentId: input.documentId,
        ...(input.receivedByUserId !== undefined && { receivedByUserId: input.receivedByUserId }),
        ...(input.emailMessageId !== undefined && { emailMessageId: input.emailMessageId }),
        ...(input.emailSubject !== undefined && { emailSubject: input.emailSubject }),
        ...(input.emailFrom !== undefined && { emailFrom: input.emailFrom }),
        ...(input.brokerEmail !== undefined && { brokerEmail: input.brokerEmail }),
      });

      await deps.documentPort.setEntity(input.documentId, RATECON_IMPORT_ENTITY_TYPE, importId);
      await emitReceived(created.id, created.organizationId);
      deps.logger.info('Ratecon import created from document', {
        importId: created.id,
        source: input.source,
      });
      return created;
    },

    list: (input) => deps.rateconImportRepo.findMany(input),

    get: async (input) => {
      const found = await deps.rateconImportRepo.findById(input.importId, input.organizationId);
      if (found === null) {
        throw new NotFoundError(`Ratecon import ${input.importId} not found`);
      }

      let prefill: RateconPrefill | null = null;
      if (found.extractionResult !== null && found.isRatecon === true) {
        const result = found.extractionResult as unknown as RateconExtractionResult;
        prefill = buildPrefill(result, found.matchedCustomerId);
      }
      return { import: found, prefill };
    },

    accept: async (input) => {
      const found = await deps.rateconImportRepo.findById(input.importId, input.organizationId);
      if (found === null) {
        throw new NotFoundError(`Ratecon import ${input.importId} not found`);
      }
      if (found.status === 'ACCEPTED') {
        throw new ConflictError(`Ratecon import ${input.importId} is already accepted`);
      }
      if (found.documentId !== null) {
        await deps.documentPort.setEntity(found.documentId, 'load', input.loadId);
      }
      return deps.rateconImportRepo.update(input.importId, input.organizationId, {
        status: 'ACCEPTED',
        acceptedLoadId: input.loadId,
        acceptedAt: new Date(),
      });
    },

    reject: async (input) => {
      const found = await deps.rateconImportRepo.findById(input.importId, input.organizationId);
      if (found === null) {
        throw new NotFoundError(`Ratecon import ${input.importId} not found`);
      }
      if (found.documentId !== null) {
        const doc = await deps.documentPort.getById(found.documentId, input.organizationId);
        if (doc !== null) {
          await deps.storageProvider.delete(doc.s3Key);
          await deps.documentPort.remove(found.documentId);
        }
      }
      await deps.rateconImportRepo.update(input.importId, input.organizationId, {
        status: 'REJECTED',
        rejectedAt: new Date(),
        deletedAt: new Date(),
        ...(input.rejectedByUserId !== undefined && { rejectedByUserId: input.rejectedByUserId }),
      });
    },

    retry: async (input) => {
      const found = await deps.rateconImportRepo.findById(input.importId, input.organizationId);
      if (found === null) {
        throw new NotFoundError(`Ratecon import ${input.importId} not found`);
      }
      if (found.status !== 'EXTRACTION_FAILED') {
        throw new ValidationError('Only failed imports can be retried');
      }
      const updated = await deps.rateconImportRepo.update(input.importId, input.organizationId, {
        status: 'RECEIVED',
        failureReason: null,
      });
      await emitReceived(updated.id, updated.organizationId);
      return updated;
    },
  };
};
