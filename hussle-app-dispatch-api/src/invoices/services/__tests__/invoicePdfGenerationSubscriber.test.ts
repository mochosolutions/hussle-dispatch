import { initializeInvoicePdfGenerationSubscriber } from '../invoicePdfGenerationSubscriber';
import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import type {
  InvoiceRepoPort,
  InvoiceLoadQueryPort,
  InvoiceWithRelations,
} from '../../types/invoiceTypes';
import type { OrgSettingsQueryPort } from '../../types/readinessTypes';
import type { PdfGenerationPort } from '../../types/invoiceTemplateTypes';
import type { StorageProvider } from '../../../shared/storage/storageProvider';
import type { Logger } from '../../../shared/utils/logger';

jest.mock('../invoicePdfDataBuilder', () => ({
  buildInvoicePdfData: jest.fn().mockResolvedValue({ invoiceNumber: 'INV-0001' }),
}));

const buildMockDeps = () => {
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  };

  const invoiceRepo: jest.Mocked<Pick<InvoiceRepoPort, 'findById' | 'updateStatus'>> = {
    findById: jest.fn(),
    updateStatus: jest.fn().mockResolvedValue({} as InvoiceWithRelations),
  };

  const loadQuery: jest.Mocked<Pick<InvoiceLoadQueryPort, 'findLoadWithStops'>> = {
    findLoadWithStops: jest.fn(),
  };

  const orgSettingsQuery: jest.Mocked<OrgSettingsQueryPort> = {
    findByOrganizationId: jest.fn(),
  };

  const pdfService: jest.Mocked<PdfGenerationPort> = {
    generateInvoicePdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
  };

  const storageProvider: jest.Mocked<Pick<StorageProvider, 'put'>> = {
    put: jest.fn().mockResolvedValue('invoices/INV-0001.pdf'),
  };

  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  return {
    eventBus,
    invoiceRepo: invoiceRepo as unknown as jest.Mocked<InvoiceRepoPort>,
    loadQuery: loadQuery as unknown as jest.Mocked<InvoiceLoadQueryPort>,
    orgSettingsQuery,
    pdfService,
    storageProvider: storageProvider as unknown as jest.Mocked<StorageProvider>,
    logger,
  };
};

const extractHandler = (
  subscribeMock: jest.Mocked<EventBus>['subscribe'],
): ((data: EventMap['invoice.draft.created']) => Promise<void>) => {
  const call = subscribeMock.mock.calls.find((c) => c[0] === 'invoice.draft.created');
  if (!call) {
    throw new Error('subscriber did not register for invoice.draft.created');
  }
  return call[2] as (data: EventMap['invoice.draft.created']) => Promise<void>;
};

const mkInvoice = (overrides: Partial<InvoiceWithRelations> = {}): InvoiceWithRelations =>
  ({
    id: 'inv-1',
    invoiceNumber: 'INV-0001',
    status: 'DRAFT',
    pdfUrl: null,
    ...overrides,
  }) as InvoiceWithRelations;

const mkEvent = (
  overrides: Partial<EventMap['invoice.draft.created']> = {},
): EventMap['invoice.draft.created'] => ({
  invoiceId: 'inv-1',
  loadId: 'load-1',
  organizationId: 'org-1',
  invoiceNumber: 'INV-0001',
  ...overrides,
});

describe('invoicePdfGenerationSubscriber', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('generates, stores, and persists the PDF on a new invoice event', async () => {
    const deps = buildMockDeps();
    (deps.invoiceRepo.findById as jest.Mock).mockResolvedValue(mkInvoice());

    await initializeInvoicePdfGenerationSubscriber(deps);
    const handler = extractHandler(deps.eventBus.subscribe);
    await handler(mkEvent());

    expect(deps.pdfService.generateInvoicePdf).toHaveBeenCalledTimes(1);
    expect(deps.storageProvider.put).toHaveBeenCalledWith(
      'invoices/INV-0001.pdf',
      Buffer.from('pdf-bytes'),
      'application/pdf',
    );
    expect(deps.invoiceRepo.updateStatus).toHaveBeenCalledWith(
      'inv-1',
      'org-1',
      'DRAFT',
      { pdfUrl: 'invoices/INV-0001.pdf' },
    );
  });

  it('skips generation when pdfUrl is already set', async () => {
    const deps = buildMockDeps();
    (deps.invoiceRepo.findById as jest.Mock).mockResolvedValue(
      mkInvoice({ pdfUrl: 'invoices/INV-0001.pdf' }),
    );

    await initializeInvoicePdfGenerationSubscriber(deps);
    const handler = extractHandler(deps.eventBus.subscribe);
    await handler(mkEvent());

    expect(deps.pdfService.generateInvoicePdf).not.toHaveBeenCalled();
    expect(deps.storageProvider.put).not.toHaveBeenCalled();
    expect(deps.invoiceRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('warns and returns when invoice is not found (raced by void)', async () => {
    const deps = buildMockDeps();
    (deps.invoiceRepo.findById as jest.Mock).mockResolvedValue(null);

    await initializeInvoicePdfGenerationSubscriber(deps);
    const handler = extractHandler(deps.eventBus.subscribe);
    await handler(mkEvent());

    expect(deps.logger.warn).toHaveBeenCalled();
    expect(deps.pdfService.generateInvoicePdf).not.toHaveBeenCalled();
  });

  it('logs but does not rethrow when PDF generation fails', async () => {
    const deps = buildMockDeps();
    (deps.invoiceRepo.findById as jest.Mock).mockResolvedValue(mkInvoice());
    (deps.pdfService.generateInvoicePdf as jest.Mock).mockRejectedValue(
      new Error('puppeteer crashed'),
    );

    await initializeInvoicePdfGenerationSubscriber(deps);
    const handler = extractHandler(deps.eventBus.subscribe);

    await expect(handler(mkEvent())).resolves.toBeUndefined();
    expect(deps.logger.error).toHaveBeenCalled();
    expect(deps.invoiceRepo.updateStatus).not.toHaveBeenCalled();
  });

  it('logs but does not rethrow when storage put fails', async () => {
    const deps = buildMockDeps();
    (deps.invoiceRepo.findById as jest.Mock).mockResolvedValue(mkInvoice());
    (deps.storageProvider.put as jest.Mock).mockRejectedValue(
      new Error('s3 unavailable'),
    );

    await initializeInvoicePdfGenerationSubscriber(deps);
    const handler = extractHandler(deps.eventBus.subscribe);

    await expect(handler(mkEvent())).resolves.toBeUndefined();
    expect(deps.logger.error).toHaveBeenCalled();
    expect(deps.invoiceRepo.updateStatus).not.toHaveBeenCalled();
  });
});
