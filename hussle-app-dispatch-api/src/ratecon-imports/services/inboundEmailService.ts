import type { Logger } from '@/shared/utils/logger';

import type { RateconImportRepoPort } from '../types/rateconImportTypes';
import type { RateconImportService } from './rateconImportService';

export interface InboundPdf {
  fileName: string;
  bytes: Buffer;
}

export interface InboundEmail {
  recipient: string;
  from: string | null;
  messageId: string | null;
  subject: string | null;
  pdfs: InboundPdf[];
}

export interface InboundIngestResult {
  accepted: number;
  skippedReason?: 'no_org' | 'duplicate' | 'no_pdfs';
}

export interface InboundEmailIngestorDeps {
  rateconImportService: RateconImportService;
  rateconImportRepo: RateconImportRepoPort;
  logger: Logger;
}

const ORG_FROM_RECIPIENT = /ratecon\+([^@]+)@/i;

export const parseOrgIdFromRecipient = (recipient: string): string | null => {
  const match = ORG_FROM_RECIPIENT.exec(recipient);
  return match?.[1] ?? null;
};

export interface InboundEmailIngestor {
  ingest(email: InboundEmail): Promise<InboundIngestResult>;
}

export const createInboundEmailIngestor = (
  deps: InboundEmailIngestorDeps,
): InboundEmailIngestor => ({
  ingest: async (email) => {
    const organizationId = parseOrgIdFromRecipient(email.recipient);
    if (organizationId === null) {
      deps.logger.warn('Inbound ratecon email: could not parse org from recipient', {
        recipient: email.recipient,
      });
      return { accepted: 0, skippedReason: 'no_org' };
    }

    if (email.pdfs.length === 0) {
      deps.logger.info('Inbound ratecon email: no PDF attachments', {
        organizationId,
        messageId: email.messageId,
      });
      return { accepted: 0, skippedReason: 'no_pdfs' };
    }

    if (email.messageId !== null) {
      const seen = await deps.rateconImportRepo.existsByMessageId(organizationId, email.messageId);
      if (seen) {
        deps.logger.info('Inbound ratecon email: duplicate message, skipping', {
          organizationId,
          messageId: email.messageId,
        });
        return { accepted: 0, skippedReason: 'duplicate' };
      }
    }

    let accepted = 0;
    for (const pdf of email.pdfs) {
      await deps.rateconImportService.createFromBytes({
        organizationId,
        pdfBytes: pdf.bytes,
        fileName: pdf.fileName,
        source: 'EMAIL_INBOUND',
        ...(email.messageId !== null && { emailMessageId: email.messageId }),
        ...(email.subject !== null && { emailSubject: email.subject }),
        ...(email.from !== null && { emailFrom: email.from, brokerEmail: email.from }),
      });
      accepted += 1;
    }

    deps.logger.info('Inbound ratecon email ingested', {
      organizationId,
      messageId: email.messageId,
      pdfCount: accepted,
    });
    return { accepted };
  },
});
