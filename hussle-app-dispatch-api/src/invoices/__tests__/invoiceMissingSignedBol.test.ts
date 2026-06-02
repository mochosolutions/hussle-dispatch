import { Prisma } from '@prisma/client';
import { generateFromDelivery } from '../services/invoiceGenerationService';
import { createInvoiceBuilderService } from '../services/invoiceBuilderService';

jest.mock('../../shared/sequenceGenerator', () => ({
  generateSequenceNumber: jest.fn().mockResolvedValue('INV-0001'),
}));

// ---------------------------------------------------------------------------
// US-02: invoice missingSignedBol must be derived from confirmed Documents
// (docTypes.includes('BOL_SIGNED')), NOT from load.bolSignedAt. A confirmed
// BOL_SIGNED doc with a null bolSignedAt projection must yield
// missingSignedBol=false; absence of a confirmed BOL_SIGNED doc yields true.
// ---------------------------------------------------------------------------

const baseLoad = {
  id: 'load-1',
  organizationId: 'org-1',
  loadNumber: 'L-001',
  carrierId: 'carrier-1',
  customerId: 'customer-1',
  vehicleId: null,
  customerRate: new Prisma.Decimal('1000'),
  carrierRate: new Prisma.Decimal('800'),
  dispatchFeeType: null,
  dispatchFeeAmount: null,
  loadedMiles: 100,
  totalMiles: 120,
  partnerSplitPercent: null,
  driverPayType: null,
  driverPayRate: null,
  dispatcherCommissionType: null,
  dispatcherCommissionRate: null,
  feeIncludesAccessorials: null,
  payFromNet: null,
  carrierType: 'COMPANY_ASSET' as const,
  // Intentionally null — proves derivation does NOT read this column.
  bolSignedAt: null,
  status: 'DELIVERED',
  contact: null,
  carrier: { id: 'carrier-1', name: 'Carrier', type: 'COMPANY_ASSET' } as never,
  customer: null,
  accessorialCharges: [],
};

const signedBolDoc = {
  id: 'doc-1',
  type: 'BOL_SIGNED',
  fileName: 'bol.pdf',
  mimeType: 'application/pdf',
  s3Key: 'key-1',
};

const podDoc = {
  id: 'doc-2',
  type: 'POD',
  fileName: 'pod.pdf',
  mimeType: 'application/pdf',
  s3Key: 'key-2',
};

const makeMocks = () => {
  const invoiceRepo = {
    findNonVoidByLoadId: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'inv-1', loadId: 'load-1' }),
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };
  const loadQuery = {
    findLoadById: jest.fn().mockResolvedValue(baseLoad),
    updateLoadStatus: jest.fn().mockResolvedValue(undefined),
  };
  const documentQuery = {
    findConfirmedByEntity: jest.fn().mockResolvedValue([]),
  };
  const eventBus = { publish: jest.fn().mockResolvedValue(undefined) };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  return { invoiceRepo, loadQuery, documentQuery, eventBus, logger };
};

describe('generateFromDelivery — missingSignedBol from confirmed docs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets missingSignedBol=false when a confirmed BOL_SIGNED doc exists despite null bolSignedAt', async () => {
    // Arrange
    const m = makeMocks();
    m.documentQuery.findConfirmedByEntity.mockResolvedValue([signedBolDoc, podDoc]);

    // Act
    await generateFromDelivery('load-1', 'org-1', {
      invoiceRepo: m.invoiceRepo as never,
      loadQuery: m.loadQuery as never,
      documentQuery: m.documentQuery as never,
      eventBus: m.eventBus as never,
      logger: m.logger as never,
    });

    // Assert
    expect(m.documentQuery.findConfirmedByEntity).toHaveBeenCalledWith('load', 'load-1');
    expect(m.invoiceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ missingSignedBol: false }),
    );
  });

  it('sets missingSignedBol=true when no confirmed BOL_SIGNED doc exists', async () => {
    // Arrange
    const m = makeMocks();
    m.documentQuery.findConfirmedByEntity.mockResolvedValue([podDoc]);

    // Act
    await generateFromDelivery('load-1', 'org-1', {
      invoiceRepo: m.invoiceRepo as never,
      loadQuery: m.loadQuery as never,
      documentQuery: m.documentQuery as never,
      eventBus: m.eventBus as never,
      logger: m.logger as never,
    });

    // Assert
    expect(m.invoiceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ missingSignedBol: true }),
    );
  });
});

describe('invoiceBuilderService.createFromLoad — missingSignedBol from confirmed docs', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sets missingSignedBol=false when a confirmed BOL_SIGNED doc exists despite null bolSignedAt', async () => {
    // Arrange
    const m = makeMocks();
    m.documentQuery.findConfirmedByEntity.mockResolvedValue([signedBolDoc]);
    const service = createInvoiceBuilderService({
      invoiceRepo: m.invoiceRepo as never,
      loadQuery: m.loadQuery as never,
      documentQuery: m.documentQuery as never,
      eventBus: m.eventBus as never,
      logger: m.logger as never,
    });

    // Act
    await service.createFromLoad({ loadId: 'load-1', organizationId: 'org-1', userId: 'user-1' });

    // Assert
    expect(m.documentQuery.findConfirmedByEntity).toHaveBeenCalledWith('load', 'load-1');
    expect(m.invoiceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ missingSignedBol: false }),
    );
  });

  it('sets missingSignedBol=true when no confirmed BOL_SIGNED doc exists', async () => {
    // Arrange
    const m = makeMocks();
    m.documentQuery.findConfirmedByEntity.mockResolvedValue([]);
    const service = createInvoiceBuilderService({
      invoiceRepo: m.invoiceRepo as never,
      loadQuery: m.loadQuery as never,
      documentQuery: m.documentQuery as never,
      eventBus: m.eventBus as never,
      logger: m.logger as never,
    });

    // Act
    await service.createFromLoad({ loadId: 'load-1', organizationId: 'org-1', userId: 'user-1' });

    // Assert
    expect(m.invoiceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ missingSignedBol: true }),
    );
  });
});
