import type { Prisma } from '@prisma/client';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { PythonServiceClient } from '@/shared/python/pythonServiceClient';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import { buildCardSummary } from '../../services/rateconPrefillMapper';
import type {
  RateconCustomerLookupPort,
  RateconDocumentPort,
  RateconImportRepoPort,
} from '../../types/rateconImportTypes';

const QUEUE_GROUP = 'ratecon-extraction-service';

interface ImportRef {
  importId: string;
  organizationId: string;
}

export interface RateconExtractionSubscriberDeps {
  rateconImportRepo: RateconImportRepoPort;
  documentPort: RateconDocumentPort;
  customerLookup: RateconCustomerLookupPort;
  storageProvider: StorageProvider;
  pythonClient: PythonServiceClient;
  eventBus: EventBus;
  logger: Logger;
}

const processImport = async (
  importId: string,
  organizationId: string,
  deps: RateconExtractionSubscriberDeps,
): Promise<void> => {
  const found = await deps.rateconImportRepo.findById(importId, organizationId);
  if (found === null) {
    deps.logger.warn('Ratecon extraction: import not found', { importId });
    return;
  }
  // Idempotency: only RECEIVED imports are eligible (retry resets to RECEIVED).
  if (found.status !== 'RECEIVED') {
    deps.logger.info('Ratecon extraction: skipping, not in RECEIVED state', {
      importId,
      status: found.status,
    });
    return;
  }
  const ref: ImportRef = { importId, organizationId };
  if (found.documentId === null) {
    await markFailed(ref, 'No document attached', deps);
    return;
  }

  await deps.rateconImportRepo.update(importId, organizationId, {
    status: 'EXTRACTING',
    extractionStartedAt: new Date(),
  });

  const doc = await deps.documentPort.getById(found.documentId, organizationId);
  if (doc === null) {
    await markFailed(ref, 'Document record missing', deps);
    return;
  }

  let result;
  try {
    const bytes = await deps.storageProvider.getFile(doc.s3Key);
    result = await deps.pythonClient.extractRatecon(bytes);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    await markFailed(ref, reason, deps);
    return;
  }

  if (!result.is_ratecon) {
    const guess = result.document_type_guess !== null ? ` (${result.document_type_guess})` : '';
    await deps.rateconImportRepo.update(importId, organizationId, {
      status: 'EXTRACTION_FAILED',
      isRatecon: false,
      documentTypeGuess: result.document_type_guess,
      failureReason: `Not a rate confirmation${guess}`,
      extractionCompletedAt: new Date(),
    });
    await emitReady(ref, 'EXTRACTION_FAILED', deps);
    return;
  }

  const mcNumber = result.customer?.mc_number ?? null;
  const matched =
    mcNumber !== null ? await deps.customerLookup.findByMcNumber(organizationId, mcNumber) : null;
  const card = buildCardSummary(result);

  await deps.rateconImportRepo.update(importId, organizationId, {
    status: 'PENDING_REVIEW',
    isRatecon: true,
    extractionResult: result as unknown as Prisma.InputJsonValue,
    extractionConfidence: result.extraction_confidence,
    requiresReview: result.requires_review,
    warnings: result.warnings,
    matchedCustomerId: matched?.id ?? null,
    brokerName: card.brokerName,
    laneSummary: card.laneSummary,
    customerRate: card.customerRate,
    pickupDate: card.pickupDate,
    extractionCompletedAt: new Date(),
  });
  await emitReady(ref, 'PENDING_REVIEW', deps);
  deps.logger.info('Ratecon extraction completed', {
    importId,
    confidence: result.extraction_confidence,
    matched: matched !== null,
  });
};

const markFailed = async (
  ref: ImportRef,
  reason: string,
  deps: RateconExtractionSubscriberDeps,
): Promise<void> => {
  await deps.rateconImportRepo.update(ref.importId, ref.organizationId, {
    status: 'EXTRACTION_FAILED',
    failureReason: reason,
    extractionCompletedAt: new Date(),
  });
  await emitReady(ref, 'EXTRACTION_FAILED', deps);
  deps.logger.error('Ratecon extraction failed', { importId: ref.importId, reason });
};

const emitReady = async (
  ref: ImportRef,
  status: 'PENDING_REVIEW' | 'EXTRACTION_FAILED',
  deps: RateconExtractionSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.publish('ratecon.import.ready', {
    importId: ref.importId,
    organizationId: ref.organizationId,
    status,
  });
};

export const createRateconExtractionSubscriber = async (
  deps: RateconExtractionSubscriberDeps,
): Promise<void> => {
  await deps.eventBus.subscribe('ratecon.import.received', QUEUE_GROUP, async (data) => {
    try {
      await processImport(data.importId, data.organizationId, deps);
    } catch (error: unknown) {
      deps.logger.error('Ratecon extraction handler crashed', {
        importId: data.importId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
  deps.logger.info('Ratecon extraction subscriber initialized');
};
