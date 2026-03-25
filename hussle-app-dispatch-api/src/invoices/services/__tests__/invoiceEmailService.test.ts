jest.mock('@hussle/emails', () => ({
  renderInvoiceEmail: jest.fn().mockResolvedValue({
    subject: 'Invoice INV-001 from Test Carrier',
    html: '<p>Invoice email</p>',
  }),
}));

import { createInvoiceEmailService } from '../invoiceEmailService';
import type { InvoiceRepoPort, InvoiceLoadQueryPort, InvoiceWithRelations } from '../../types/invoiceTypes';
import type { PdfGenerationPort, InvoiceTemplateData } from '../../types/invoiceTemplateTypes';
import type { SendInvoiceEmailInput } from '../../types/emailTypes';
import type { DocumentQueryPort } from '../../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../../types/readinessTypes';
import type { StorageProvider } from '../../../shared/storage/storageProvider';
import type { NotificationService } from '../../../shared/notifications/notificationService';
import type { Logger } from '../../../shared/utils/logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeInvoice = (overrides: Partial<InvoiceWithRelations> = {}): InvoiceWithRelations =>
  ({
    id: 'inv-1',
    loadId: 'load-1',
    invoiceNumber: 'INV-001',
    totalAmount: '1500.00',
    dueDate: new Date('2026-04-15'),
    paymentTerms: 'NET_30',
    status: 'APPROVED',
    subtotal: '1400.00',
    accessorials: '100.00',
    createdAt: new Date('2026-03-15'),
    billingMethod: null,
    factoringAdvance: null,
    factoringFeeAmount: null,
    reserveAmount: null,
    notes: null,
    load: {
      id: 'load-1',
      loadNumber: 'LD-001',
      accessorialCharges: [],
    },
    carrier: null,
    customer: null,
    ...overrides,
  } as unknown as InvoiceWithRelations);

const makeDocument = (id: string, type: string) => ({
  id,
  type,
  fileName: `${type}-${id}.pdf`,
  mimeType: 'application/pdf' as string | null,
  s3Key: `uploads/${id}.pdf`,
});

const makeInput = (overrides: Partial<SendInvoiceEmailInput> = {}): SendInvoiceEmailInput => ({
  invoiceId: 'inv-1',
  recipientEmail: 'billing@customer.com',
  fromEmail: 'dispatch@hussle.com',
  replyToEmail: 'support@hussle.com',
  subject: 'Invoice INV-001',
  ...overrides,
});

const buildMockDeps = () => {
  const invoiceRepo: jest.Mocked<Pick<InvoiceRepoPort, 'findById' | 'updateStatus'>> = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  const loadQuery: jest.Mocked<Pick<InvoiceLoadQueryPort, 'findLoadWithStops'>> = {
    findLoadWithStops: jest.fn(),
  };

  const orgSettingsQuery: jest.Mocked<OrgSettingsQueryPort> = {
    findByOrganizationId: jest.fn(),
  };

  const documentQuery: jest.Mocked<DocumentQueryPort> = {
    findConfirmedByEntity: jest.fn(),
  };

  const pdfService: jest.Mocked<PdfGenerationPort> = {
    generateInvoicePdf: jest.fn(),
  };

  const storageProvider: jest.Mocked<Pick<StorageProvider, 'getFile'>> = {
    getFile: jest.fn(),
  };

  const notificationService: jest.Mocked<NotificationService> = {
    sendEmail: jest.fn(),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    invoiceRepo: invoiceRepo as unknown as jest.Mocked<InvoiceRepoPort>,
    loadQuery: loadQuery as unknown as jest.Mocked<InvoiceLoadQueryPort>,
    orgSettingsQuery,
    documentQuery,
    pdfService,
    storageProvider: storageProvider as unknown as jest.Mocked<StorageProvider>,
    notificationService,
    logger,
  };
};

const makePdfBuffer = (): Buffer => Buffer.from('fake-pdf-content');

const makeLoadWithStops = () => ({
  id: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'LD-001',
  externalRefNumber: null,
  equipmentType: null,
  commodity: null,
  weight: null,
  totalMiles: null,
  customerRate: null,
  carrierRate: null,
  status: 'DELIVERED',
  carrier: null,
  customer: null,
  stops: [],
  accessorialCharges: [],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('invoiceEmailService.sendInvoiceEmail', () => {
  let deps: ReturnType<typeof buildMockDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
  });

  const setupHappyPath = () => {
    const invoice = makeInvoice();
    const pdfBuffer = makePdfBuffer();

    deps.invoiceRepo.findById.mockResolvedValue(invoice);
    deps.loadQuery.findLoadWithStops.mockResolvedValue(makeLoadWithStops());
    deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
      invoiceWorkflow: 'AUTO_REVIEW',
      sesFromEmail: 'noreply@hussle.com',
      companyLogoUrl: null,
    });
    deps.pdfService.generateInvoicePdf.mockResolvedValue(pdfBuffer);
    deps.documentQuery.findConfirmedByEntity.mockResolvedValue([]);
    deps.notificationService.sendEmail.mockResolvedValue(undefined);
    deps.invoiceRepo.updateStatus.mockResolvedValue(invoice);

    return { invoice, pdfBuffer };
  };

  it('throws when invoice is not found', async () => {
    // Arrange
    deps.invoiceRepo.findById.mockResolvedValue(null);
    const service = createInvoiceEmailService(deps);

    // Act & Assert
    await expect(
      service.sendInvoiceEmail(makeInput({ invoiceId: 'inv-missing' })),
    ).rejects.toThrow('Invoice not found: inv-missing');
  });

  it('generates PDF via pdfService.generateInvoicePdf', async () => {
    // Arrange
    setupHappyPath();
    const service = createInvoiceEmailService(deps);

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert
    expect(deps.pdfService.generateInvoicePdf).toHaveBeenCalledTimes(1);
    expect(deps.pdfService.generateInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceNumber: 'INV-001',
        loadNumber: 'LD-001',
      } satisfies Partial<InvoiceTemplateData>),
    );
  });

  it('fetches confirmed load documents via documentQuery', async () => {
    // Arrange
    setupHappyPath();
    const service = createInvoiceEmailService(deps);

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert
    expect(deps.documentQuery.findConfirmedByEntity).toHaveBeenCalledWith('load', 'load-1');
  });

  it('sends email with PDF and document attachments', async () => {
    // Arrange
    const { pdfBuffer } = setupHappyPath();
    const doc1 = makeDocument('doc-1', 'BOL_SIGNED');
    const doc2 = makeDocument('doc-2', 'POD');
    const doc1Buffer = Buffer.from('bol-content');
    const doc2Buffer = Buffer.from('pod-content');

    deps.documentQuery.findConfirmedByEntity.mockResolvedValue([doc1, doc2]);
    deps.storageProvider.getFile
      .mockResolvedValueOnce(doc1Buffer)
      .mockResolvedValueOnce(doc2Buffer);

    const service = createInvoiceEmailService(deps);

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert
    expect(deps.notificationService.sendEmail).toHaveBeenCalledTimes(1);
    expect(deps.notificationService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'billing@customer.com',
        from: 'dispatch@hussle.com',
        replyTo: 'support@hussle.com',
        subject: expect.stringContaining('Invoice INV-001'),
        attachments: [
          {
            filename: 'Invoice_INV-001.pdf',
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
          {
            filename: doc1.fileName,
            content: doc1Buffer,
            contentType: 'application/pdf',
          },
          {
            filename: doc2.fileName,
            content: doc2Buffer,
            contentType: 'application/pdf',
          },
        ],
      }),
    );
  });

  it('continues gracefully when a document fetch fails', async () => {
    // Arrange
    setupHappyPath();
    const doc1 = makeDocument('doc-ok', 'BOL_SIGNED');
    const doc2 = makeDocument('doc-fail', 'POD');

    deps.documentQuery.findConfirmedByEntity.mockResolvedValue([doc1, doc2]);
    deps.storageProvider.getFile
      .mockResolvedValueOnce(Buffer.from('bol-content'))
      .mockRejectedValueOnce(new Error('S3 access denied'));

    const service = createInvoiceEmailService(deps);

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert — email still sent with the PDF + the one successful doc
    expect(deps.notificationService.sendEmail).toHaveBeenCalledTimes(1);
    const emailCalls = deps.notificationService.sendEmail.mock.calls;
    const firstCall = emailCalls[0];
    if (firstCall === undefined) {
      throw new Error('Expected sendEmail to have been called');
    }
    expect(firstCall[0].attachments).toHaveLength(2); // PDF + 1 successful doc

    // Assert — warning logged for the failed doc
    expect(deps.logger.warn).toHaveBeenCalledWith(
      'Failed to fetch document for email attachment',
      expect.objectContaining({
        documentId: 'doc-fail',
        error: 'S3 access denied',
      }),
    );
  });

  it('updates invoice status to SENT with delivery metadata', async () => {
    // Arrange
    setupHappyPath();
    const service = createInvoiceEmailService(deps);
    const beforeSend = Date.now();

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert
    expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledTimes(1);
    expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith(
      'inv-1',
      'SENT',
      expect.objectContaining({
        sentTo: 'billing@customer.com',
        sentToEmail: 'billing@customer.com',
        deliveryMethod: 'PLATFORM_EMAIL',
      }),
    );

    // Verify sentAt is a recent Date
    const updateCalls = deps.invoiceRepo.updateStatus.mock.calls;
    const firstUpdate = updateCalls[0];
    if (firstUpdate === undefined) {
      throw new Error('Expected updateStatus to have been called');
    }
    const statusExtra = firstUpdate[2] as Record<string, unknown>;
    const sentAt = statusExtra.sentAt as Date;
    expect(sentAt).toBeInstanceOf(Date);
    expect(sentAt.getTime()).toBeGreaterThanOrEqual(beforeSend);
  });

  it('handles missing org settings gracefully', async () => {
    // Arrange
    const invoice = makeInvoice();
    deps.invoiceRepo.findById.mockResolvedValue(invoice);
    deps.loadQuery.findLoadWithStops.mockResolvedValue(makeLoadWithStops());
    deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue(null);
    deps.pdfService.generateInvoicePdf.mockResolvedValue(makePdfBuffer());
    deps.documentQuery.findConfirmedByEntity.mockResolvedValue([]);
    deps.notificationService.sendEmail.mockResolvedValue(undefined);
    deps.invoiceRepo.updateStatus.mockResolvedValue(invoice);

    const service = createInvoiceEmailService(deps);

    // Act & Assert — should not throw
    await expect(service.sendInvoiceEmail(makeInput())).resolves.toBeUndefined();

    // Assert — email was still sent
    expect(deps.notificationService.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('logs success with invoice id, recipient, and attachment count', async () => {
    // Arrange
    setupHappyPath();
    const service = createInvoiceEmailService(deps);

    // Act
    await service.sendInvoiceEmail(makeInput());

    // Assert
    expect(deps.logger.info).toHaveBeenCalledWith('Invoice email sent', {
      invoiceId: 'inv-1',
      recipientEmail: 'billing@customer.com',
      attachmentCount: 1, // PDF only, no load docs
    });
  });
});
