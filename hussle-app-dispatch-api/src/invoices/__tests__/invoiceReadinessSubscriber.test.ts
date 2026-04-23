import { initializeReadinessSubscriber } from '../services/invoiceReadinessSubscriber';
import { generateTonuInvoice } from '../services/invoiceGenerationService';
import type { EventBus } from '../../shared/messaging/eventBus';
import type { EventMap } from '../../shared/messaging/eventMap';
import type { InvoiceRepoPort, InvoiceLoadQueryPort } from '../types/invoiceTypes';
import type { DocumentQueryPort } from '../types/documentPacketTypes';
import type { OrgSettingsQueryPort } from '../types/readinessTypes';
import type { InvoiceBuilderService } from '../services/invoiceBuilderService';
import type { Logger } from '../../shared/utils/logger';

jest.mock('../services/invoiceGenerationService', () => ({
  generateTonuInvoice: jest.fn(),
}));

const mockedGenerateTonuInvoice = generateTonuInvoice as jest.MockedFunction<
  typeof generateTonuInvoice
>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SubscribeCall<K extends keyof EventMap> = [
  K,
  string,
  (data: EventMap[K]) => Promise<void>,
];

const buildMockDeps = () => {
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn().mockResolvedValue(undefined),
    close: jest.fn(),
  };

  const invoiceRepo: jest.Mocked<
    Pick<InvoiceRepoPort, 'findNonVoidByLoadId'>
  > = {
    findNonVoidByLoadId: jest.fn(),
  };

  const loadQuery: jest.Mocked<
    Pick<InvoiceLoadQueryPort, 'findLoadById' | 'updateLoadStatus'>
  > = {
    findLoadById: jest.fn(),
    updateLoadStatus: jest.fn().mockResolvedValue(undefined),
  };

  const documentQuery: jest.Mocked<DocumentQueryPort> = {
    findConfirmedByEntity: jest.fn(),
  };

  const orgSettingsQuery: jest.Mocked<OrgSettingsQueryPort> = {
    findByOrganizationId: jest.fn(),
  };

  const invoiceBuilderService: jest.Mocked<InvoiceBuilderService> = {
    createFromLoad: jest.fn(),
    voidInvoice: jest.fn(),
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
    documentQuery,
    orgSettingsQuery,
    invoiceBuilderService,
    logger,
  };
};

const extractHandler = <K extends keyof EventMap>(
  subscribeMock: jest.Mocked<EventBus>['subscribe'],
  eventName: K,
): ((data: EventMap[K]) => Promise<void>) => {
  const calls = (subscribeMock as unknown as { mock: { calls: SubscribeCall<K>[] } }).mock.calls;
  const call = calls.find(([name]) => name === eventName);

  if (call === undefined) {
    throw new Error(`No subscription found for event: ${eventName}`);
  }

  return call[2];
};

const makeDeliveredLoad = (overrides: Record<string, unknown> = {}) => ({
  id: 'load-1',
  status: 'DELIVERED',
  organizationId: 'org-1',
  loadNumber: 'LD-001',
  carrierId: null,
  customerId: null,
  vehicleId: null,
  customerRate: null,
  carrierRate: null,
  dispatchFee: null,
  bolSignedAt: null,
  carrier: null,
  customer: null,
  accessorialCharges: [],
  ...overrides,
});

const makeDocument = (type: string) => ({
  id: `doc-${type}`,
  type,
  fileName: `${type}.pdf`,
  mimeType: 'application/pdf',
  s3Key: `uploads/${type}.pdf`,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('initializeReadinessSubscriber', () => {
  let deps: ReturnType<typeof buildMockDeps>;

  beforeEach(() => {
    jest.clearAllMocks();
    deps = buildMockDeps();
  });

  const initAndExtract = async () => {
    await initializeReadinessSubscriber(deps);

    return {
      statusChanged: extractHandler(deps.eventBus.subscribe, 'load.status.changed'),
      documentConfirmed: extractHandler(deps.eventBus.subscribe, 'document.confirmed'),
      loadDelivered: extractHandler(deps.eventBus.subscribe, 'load.delivered'),
      loadTonu: extractHandler(deps.eventBus.subscribe, 'load.tonu'),
    };
  };

  it('subscribes to all four events on initialization', async () => {
    await initializeReadinessSubscriber(deps);

    expect(deps.eventBus.subscribe).toHaveBeenCalledTimes(4);
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.status.changed',
      'invoice-readiness',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'document.confirmed',
      'invoice-readiness',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.delivered',
      'invoice-readiness',
      expect.any(Function),
    );
    expect(deps.eventBus.subscribe).toHaveBeenCalledWith(
      'load.tonu',
      'invoice-readiness',
      expect.any(Function),
    );
  });

  describe('delivery with existing BOL_SIGNED creates invoice', () => {
    it('auto-creates invoice when load is DELIVERED and all docs present', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
        invoiceWorkflow: 'AUTO_REVIEW',
        sesFromEmail: null,
        companyLogoUrl: null,
      });

      // Act
      await handlers.statusChanged({
        loadId: 'load-1',
        organizationId: 'org-1',
        loadNumber: 'LD-001',
        fromStatus: 'IN_TRANSIT',
        toStatus: 'DELIVERED',
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        contactCcEmails: [],
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).toHaveBeenCalledWith({
        loadId: 'load-1',
        organizationId: 'org-1',
        userId: 'system',
      });
    });
  });

  describe('delivery without BOL does not create invoice', () => {
    it('sets readiness to AWAITING_DOCUMENTS when BOL_SIGNED is missing', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('POD'),
      ]);

      // Act
      await handlers.statusChanged({
        loadId: 'load-1',
        organizationId: 'org-1',
        loadNumber: 'LD-001',
        fromStatus: 'IN_TRANSIT',
        toStatus: 'DELIVERED',
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        contactCcEmails: [],
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).not.toHaveBeenCalled();
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice readiness evaluated',
        expect.objectContaining({
          loadId: 'load-1',
          readiness: 'AWAITING_DOCUMENTS',
          hasSignedBol: false,
        }),
      );
    });
  });

  describe('BOL_SIGNED document.confirmed after delivery creates invoice', () => {
    it('re-evaluates and creates invoice when document.confirmed fires for a load', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
        invoiceWorkflow: 'AUTO_REVIEW',
        sesFromEmail: null,
        companyLogoUrl: null,
      });

      // Act
      await handlers.documentConfirmed({
        documentId: 'doc-123',
        entityType: 'load',
        entityId: 'load-1',
        documentType: 'BOL_SIGNED',
        organizationId: 'org-1',
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).toHaveBeenCalledWith({
        loadId: 'load-1',
        organizationId: 'org-1',
        userId: 'system',
      });
    });

    it('ignores document.confirmed events for non-load entities', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.documentConfirmed({
        documentId: 'doc-456',
        entityType: 'carrier',
        entityId: 'carrier-1',
        documentType: 'BOL_SIGNED',
        organizationId: 'org-1',
      });

      // Assert
      expect(deps.loadQuery.findLoadById).not.toHaveBeenCalled();
    });
  });

  describe('duplicate event idempotency', () => {
    it('does not create invoice when non-void invoice already exists', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue({
        id: 'existing-inv',
      } as ReturnType<typeof deps.invoiceRepo.findNonVoidByLoadId> extends Promise<infer T> ? NonNullable<T> : never);

      // Act
      await handlers.statusChanged({
        loadId: 'load-1',
        organizationId: 'org-1',
        loadNumber: 'LD-001',
        fromStatus: 'IN_TRANSIT',
        toStatus: 'DELIVERED',
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        contactCcEmails: [],
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).not.toHaveBeenCalled();
      expect(deps.loadQuery.updateLoadStatus).toHaveBeenCalledWith('load-1', 'INVOICE_PENDING');
    });
  });

  describe('TONU event', () => {
    it('calls generateTonuInvoice with correct dependencies', async () => {
      // Arrange
      const handlers = await initAndExtract();
      mockedGenerateTonuInvoice.mockResolvedValue(undefined);

      // Act
      await handlers.loadTonu({
        loadId: 'load-tonu-1',
        organizationId: 'org-1',
        status: 'TONU',
      });

      // Assert
      expect(mockedGenerateTonuInvoice).toHaveBeenCalledWith('load-tonu-1', 'org-1', {
        invoiceRepo: deps.invoiceRepo,
        loadQuery: deps.loadQuery,
        logger: deps.logger,
      });
    });

    it('logs error when generateTonuInvoice fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      mockedGenerateTonuInvoice.mockRejectedValue(new Error('TONU generation failed'));

      // Act
      await handlers.loadTonu({
        loadId: 'load-tonu-1',
        organizationId: 'org-1',
        status: 'TONU',
      });

      // Assert
      expect(deps.logger.error).toHaveBeenCalledWith(
        'Failed to generate TONU invoice from event',
        expect.objectContaining({
          loadId: 'load-tonu-1',
          error: 'TONU generation failed',
        }),
      );
    });
  });

  describe('AUTO_REVIEW creates draft', () => {
    it('calls createFromLoad when orgSettings workflow is AUTO_REVIEW', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
        invoiceWorkflow: 'AUTO_REVIEW',
        sesFromEmail: null,
        companyLogoUrl: null,
      });

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).toHaveBeenCalledTimes(1);
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Auto-created invoice draft',
        expect.objectContaining({ loadId: 'load-1', workflow: 'AUTO_REVIEW' }),
      );
    });

    it('calls createFromLoad when orgSettings workflow is AUTO_SEND', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
        invoiceWorkflow: 'AUTO_SEND',
        sesFromEmail: null,
        companyLogoUrl: null,
      });

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).toHaveBeenCalledTimes(1);
    });

    it('defaults to AUTO_REVIEW when orgSettings is null', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue(null);

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.invoiceBuilderService.createFromLoad).toHaveBeenCalledTimes(1);
    });
  });

  describe('load.delivered handler', () => {
    it('calls evaluateReadiness with the loadId', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([]);

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.loadQuery.findLoadById).toHaveBeenCalledWith('load-1');
      expect(deps.logger.info).toHaveBeenCalledWith(
        'Invoice readiness evaluated',
        expect.objectContaining({ loadId: 'load-1' }),
      );
    });

    it('logs error when evaluateReadiness throws', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockRejectedValue(new Error('DB connection lost'));

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.logger.error).toHaveBeenCalledWith(
        'Readiness evaluation failed on load delivered',
        expect.objectContaining({
          loadId: 'load-1',
          error: 'DB connection lost',
        }),
      );
    });
  });

  describe('load.status.changed handler edge cases', () => {
    it('ignores non-DELIVERED status changes', async () => {
      // Arrange
      const handlers = await initAndExtract();

      // Act
      await handlers.statusChanged({
        loadId: 'load-1',
        organizationId: 'org-1',
        loadNumber: 'LD-001',
        fromStatus: 'DRAFT',
        toStatus: 'IN_TRANSIT',
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        contactCcEmails: [],
      });

      // Assert
      expect(deps.loadQuery.findLoadById).not.toHaveBeenCalled();
    });

    it('exits early when load is not found', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(null);

      // Act
      await handlers.statusChanged({
        loadId: 'load-missing',
        organizationId: 'org-1',
        loadNumber: 'LD-001',
        fromStatus: 'IN_TRANSIT',
        toStatus: 'DELIVERED',
        customerId: null,
        contactEmail: null,
        contactPhone: null,
        contactCcEmails: [],
      });

      // Assert
      expect(deps.invoiceRepo.findNonVoidByLoadId).not.toHaveBeenCalled();
    });
  });

  describe('invoice creation failure handling', () => {
    it('logs warning when invoiceBuilderService.createFromLoad fails', async () => {
      // Arrange
      const handlers = await initAndExtract();
      deps.loadQuery.findLoadById.mockResolvedValue(makeDeliveredLoad());
      deps.invoiceRepo.findNonVoidByLoadId.mockResolvedValue(null);
      deps.documentQuery.findConfirmedByEntity.mockResolvedValue([
        makeDocument('BROKER_RATE_CON'),
        makeDocument('BOL_SIGNED'),
        makeDocument('POD'),
      ]);
      deps.orgSettingsQuery.findByOrganizationId.mockResolvedValue({
        invoiceWorkflow: 'AUTO_REVIEW',
        sesFromEmail: null,
        companyLogoUrl: null,
      });
      deps.invoiceBuilderService.createFromLoad.mockRejectedValue(
        new Error('Sequence generation failed'),
      );

      // Act
      await handlers.loadDelivered({
        loadId: 'load-1',
        organizationId: 'org-1',
        status: 'DELIVERED',
      });

      // Assert
      expect(deps.logger.warn).toHaveBeenCalledWith(
        'Auto-invoice creation failed',
        expect.objectContaining({
          loadId: 'load-1',
          error: 'Sequence generation failed',
        }),
      );
    });
  });
});
