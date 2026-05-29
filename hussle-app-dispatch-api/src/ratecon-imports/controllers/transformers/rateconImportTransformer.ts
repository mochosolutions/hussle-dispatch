import type { PendingRateconImport } from '@prisma/client';

import type { RateconImportDetail } from '../../services/rateconImportService';
import type { RateconPrefill } from '../../types/rateconImportTypes';

export interface RateconImportResponse {
  id: string;
  status: string;
  source: string;
  documentId: string | null;
  brokerName: string | null;
  brokerEmail: string | null;
  laneSummary: string | null;
  customerRate: string | null;
  pickupDate: string | null;
  matchedCustomerId: string | null;
  extractionConfidence: string | null;
  requiresReview: boolean;
  warnings: string[];
  isRatecon: boolean | null;
  documentTypeGuess: string | null;
  failureReason: string | null;
  emailFrom: string | null;
  emailSubject: string | null;
  acceptedLoadId: string | null;
  receivedAt: string;
  createdAt: string;
}

export interface RateconImportDetailResponse extends RateconImportResponse {
  prefill: RateconPrefill | null;
}

export const toImportResponse = (row: PendingRateconImport): RateconImportResponse => ({
  id: row.id,
  status: row.status,
  source: row.source,
  documentId: row.documentId,
  brokerName: row.brokerName,
  brokerEmail: row.brokerEmail,
  laneSummary: row.laneSummary,
  customerRate: row.customerRate !== null ? row.customerRate.toString() : null,
  pickupDate: row.pickupDate !== null ? row.pickupDate.toISOString() : null,
  matchedCustomerId: row.matchedCustomerId,
  extractionConfidence: row.extractionConfidence,
  requiresReview: row.requiresReview,
  warnings: row.warnings,
  isRatecon: row.isRatecon,
  documentTypeGuess: row.documentTypeGuess,
  failureReason: row.failureReason,
  emailFrom: row.emailFrom,
  emailSubject: row.emailSubject,
  acceptedLoadId: row.acceptedLoadId,
  receivedAt: row.receivedAt.toISOString(),
  createdAt: row.createdAt.toISOString(),
});

export const toImportDetailResponse = (
  detail: RateconImportDetail,
): RateconImportDetailResponse => ({
  ...toImportResponse(detail.import),
  prefill: detail.prefill,
});
