import type { PendingRateconImport } from '@prisma/client';

import type { Logger } from '@/shared/utils/logger';

import type { RateconImportRepoPort } from '../../types/rateconImportTypes';
import {
  createInboundEmailIngestor,
  parseOrgIdFromRecipient,
  type InboundEmail,
} from '../inboundEmailService';
import type { RateconImportService } from '../rateconImportService';

const ORG = 'org-123';

const makeEmail = (overrides: Partial<InboundEmail> = {}): InboundEmail => ({
  recipient: `ratecon+${ORG}@notify.localhost`,
  from: 'broker@example.com',
  messageId: 'msg-1',
  subject: 'Rate confirmation',
  pdfs: [{ fileName: 'ratecon.pdf', bytes: Buffer.from('%PDF-1.4') }],
  ...overrides,
});

describe('parseOrgIdFromRecipient', () => {
  it('extracts the org id from a plus-addressed recipient', () => {
    expect(parseOrgIdFromRecipient('ratecon+org-123@notify.localhost')).toBe('org-123');
  });

  it('is case-insensitive on the local part prefix', () => {
    expect(parseOrgIdFromRecipient('RateCon+abc@notify.fleetcommand.app')).toBe('abc');
  });

  it('returns null when the recipient is not a ratecon plus-address', () => {
    expect(parseOrgIdFromRecipient('dispatch@notify.localhost')).toBeNull();
  });
});

describe('createInboundEmailIngestor', () => {
  const service: jest.Mocked<RateconImportService> = {
    createFromBytes: jest.fn(),
    createFromDocument: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    accept: jest.fn(),
    reject: jest.fn(),
    retry: jest.fn(),
  };
  const repo: jest.Mocked<RateconImportRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    existsByMessageId: jest.fn(),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const ingestor = createInboundEmailIngestor({
    rateconImportService: service,
    rateconImportRepo: repo,
    logger,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repo.existsByMessageId.mockResolvedValue(false);
    service.createFromBytes.mockResolvedValue({ id: 'import-1' } as PendingRateconImport);
  });

  it('skips with no_org when the recipient has no parseable org', async () => {
    const result = await ingestor.ingest(makeEmail({ recipient: 'dispatch@notify.localhost' }));

    expect(result).toEqual({ accepted: 0, skippedReason: 'no_org' });
    expect(service.createFromBytes).not.toHaveBeenCalled();
  });

  it('skips with no_pdfs when there are no PDF attachments', async () => {
    const result = await ingestor.ingest(makeEmail({ pdfs: [] }));

    expect(result).toEqual({ accepted: 0, skippedReason: 'no_pdfs' });
    expect(service.createFromBytes).not.toHaveBeenCalled();
  });

  it('skips with duplicate when the message id was already ingested', async () => {
    repo.existsByMessageId.mockResolvedValue(true);

    const result = await ingestor.ingest(makeEmail());

    expect(repo.existsByMessageId).toHaveBeenCalledWith(ORG, 'msg-1');
    expect(result).toEqual({ accepted: 0, skippedReason: 'duplicate' });
    expect(service.createFromBytes).not.toHaveBeenCalled();
  });

  it('creates one import per PDF and forwards email metadata', async () => {
    const result = await ingestor.ingest(
      makeEmail({
        pdfs: [
          { fileName: 'a.pdf', bytes: Buffer.from('a') },
          { fileName: 'b.pdf', bytes: Buffer.from('b') },
        ],
      }),
    );

    expect(result).toEqual({ accepted: 2 });
    expect(service.createFromBytes).toHaveBeenCalledTimes(2);
    expect(service.createFromBytes).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        fileName: 'a.pdf',
        source: 'EMAIL_INBOUND',
        emailMessageId: 'msg-1',
        emailSubject: 'Rate confirmation',
        emailFrom: 'broker@example.com',
        brokerEmail: 'broker@example.com',
      }),
    );
  });

  it('does not dedup-check when the message id is null and still ingests', async () => {
    const result = await ingestor.ingest(makeEmail({ messageId: null }));

    expect(repo.existsByMessageId).not.toHaveBeenCalled();
    expect(result).toEqual({ accepted: 1 });
  });
});
