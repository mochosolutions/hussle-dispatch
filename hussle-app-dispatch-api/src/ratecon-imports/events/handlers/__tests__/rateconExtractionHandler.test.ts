import type { PendingRateconImport } from '@prisma/client';

import type { EventBus } from '@/shared/messaging/eventBus';
import type { EventMap } from '@/shared/messaging/eventMap';
import type { PythonServiceClient } from '@/shared/python/pythonServiceClient';
import type { StorageProvider } from '@/shared/storage/storageProvider';
import type { Logger } from '@/shared/utils/logger';

import { createRateconExtractionSubscriber } from '../rateconExtractionHandler';
import type {
  RateconCustomerLookupPort,
  RateconDocumentPort,
  RateconExtractionResult,
  RateconImportRepoPort,
} from '../../../types/rateconImportTypes';

type ReceivedHandler = (data: EventMap['ratecon.import.received']) => Promise<void>;

const ORG = 'org-1';
const IMPORT_ID = 'import-1';
const DOC_ID = 'doc-1';

const makeImport = (overrides: Partial<PendingRateconImport> = {}): PendingRateconImport =>
  ({
    id: IMPORT_ID,
    organizationId: ORG,
    status: 'RECEIVED',
    source: 'EMAIL_INBOUND',
    documentId: DOC_ID,
    extractionResult: null,
    matchedCustomerId: null,
    receivedAt: new Date('2026-05-01'),
    ...overrides,
  }) as PendingRateconImport;

const makeResult = (overrides: Partial<RateconExtractionResult> = {}): RateconExtractionResult => ({
  is_ratecon: true,
  document_type_guess: null,
  extraction_confidence: 'HIGH',
  requires_review: false,
  warnings: [],
  customer_rate: 1850,
  customer_rate_raw: '$1,850.00',
  equipment_type: 'REEFER',
  commodity: 'Frozen',
  weight_lbs: 42000,
  piece_count: null,
  is_hazmat: false,
  is_tarp: null,
  is_team_driver: null,
  reefer_temp_min_f: -10,
  reefer_temp_max_f: -10,
  reefer_mode: 'continuous',
  reefer_precool_f: null,
  dispatcher_notes: 'Detention $25/hr',
  driver_instructions: 'Pre-cool to -10F',
  reference_numbers: [{ kind: 'LOAD_NUMBER', value: '12345', label: 'Load #' }],
  stops: [
    {
      sequence: 1,
      type: 'PICKUP',
      facility_name: 'Acme',
      address: '1 Main',
      city: 'Dallas',
      state: 'TX',
      zip: '75001',
      appointment_date: '2026-05-02',
      appointment_date_raw: '5/2/26',
      appointment_time: '08:00',
      appointment_time_raw: '0800',
      appointment_end_time: null,
      scheduling_type: 'APPOINTMENT',
      appointment_number: null,
      contact_name: null,
      contact_phone: null,
      commodity: null,
      weight_lbs: null,
      piece_count: null,
      is_hazmat: null,
      is_tarp: null,
      is_temp_controlled: null,
      notes: null,
    },
  ],
  customer: { company_name: 'Beemac', mc_number: '123456', dot_number: null },
  carrier_name_on_doc: 'HUSTLE',
  carrier_mc_number: '987654',
  ...overrides,
});

describe('createRateconExtractionSubscriber', () => {
  const repo: jest.Mocked<RateconImportRepoPort> = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    findByEmailMessage: jest.fn(),
  };
  const documentPort: jest.Mocked<RateconDocumentPort> = {
    createConfirmedDocument: jest.fn(),
    getById: jest.fn(),
    setEntity: jest.fn(),
    remove: jest.fn(),
  };
  const customerLookup: jest.Mocked<RateconCustomerLookupPort> = {
    findByMcNumber: jest.fn(),
  };
  const storageProvider = {
    put: jest.fn(),
    get: jest.fn(),
    getFile: jest.fn(),
    getPresignedPutUrl: jest.fn(),
    getPresignedGetUrl: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    deleteByPrefix: jest.fn(),
    list: jest.fn(),
    exists: jest.fn(),
    getMetadata: jest.fn(),
  } as jest.Mocked<StorageProvider>;
  const pythonClient: jest.Mocked<PythonServiceClient> = {
    extractRatecon: jest.fn(),
  };
  const eventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(),
    isReady: jest.fn(),
    close: jest.fn(),
  };
  const logger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const deps = {
    rateconImportRepo: repo,
    documentPort,
    customerLookup,
    storageProvider,
    pythonClient,
    eventBus,
    logger,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventBus.subscribe.mockResolvedValue(undefined);
    eventBus.publish.mockResolvedValue(undefined);
    repo.update.mockImplementation((id) => Promise.resolve(makeImport({ id })));
    documentPort.getById.mockResolvedValue({ id: DOC_ID, s3Key: 's3/doc-1', entityId: IMPORT_ID });
    storageProvider.getFile.mockResolvedValue(Buffer.from('%PDF-1.4'));
  });

  const captureHandler = async (): Promise<ReceivedHandler> => {
    await createRateconExtractionSubscriber(deps);
    const call = eventBus.subscribe.mock.calls[0];
    if (!call) {
      throw new Error('subscribe was not called');
    }
    return call[2] as ReceivedHandler;
  };

  const event = { importId: IMPORT_ID, organizationId: ORG };

  it('subscribes to ratecon.import.received with the extraction queue group', async () => {
    await createRateconExtractionSubscriber(deps);
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      'ratecon.import.received',
      'ratecon-extraction-service',
      expect.any(Function),
    );
  });

  it('skips imports that are not in RECEIVED state', async () => {
    repo.findById.mockResolvedValue(makeImport({ status: 'PENDING_REVIEW' }));
    const handler = await captureHandler();

    await handler(event);

    expect(pythonClient.extractRatecon).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('marks EXTRACTION_FAILED and does not match customer when document is not a ratecon', async () => {
    repo.findById.mockResolvedValue(makeImport());
    pythonClient.extractRatecon.mockResolvedValue(
      makeResult({ is_ratecon: false, document_type_guess: 'Bill of Lading' }),
    );
    const handler = await captureHandler();

    await handler(event);

    expect(repo.update).toHaveBeenLastCalledWith(
      IMPORT_ID,
      ORG,
      expect.objectContaining({
        status: 'EXTRACTION_FAILED',
        isRatecon: false,
        documentTypeGuess: 'Bill of Lading',
        failureReason: 'Not a rate confirmation (Bill of Lading)',
      }),
    );
    expect(customerLookup.findByMcNumber).not.toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalledWith('ratecon.import.ready', {
      importId: IMPORT_ID,
      organizationId: ORG,
      status: 'EXTRACTION_FAILED',
    });
  });

  it('marks PENDING_REVIEW with matched customer + denormalized fields on success', async () => {
    repo.findById.mockResolvedValue(makeImport());
    pythonClient.extractRatecon.mockResolvedValue(makeResult());
    customerLookup.findByMcNumber.mockResolvedValue({ id: 'cust-9' });
    const handler = await captureHandler();

    await handler(event);

    expect(customerLookup.findByMcNumber).toHaveBeenCalledWith(ORG, '123456');
    expect(repo.update).toHaveBeenLastCalledWith(
      IMPORT_ID,
      ORG,
      expect.objectContaining({
        status: 'PENDING_REVIEW',
        isRatecon: true,
        matchedCustomerId: 'cust-9',
        brokerName: 'Beemac',
        laneSummary: 'Dallas, TX',
        customerRate: 1850,
      }),
    );
    expect(eventBus.publish).toHaveBeenCalledWith('ratecon.import.ready', {
      importId: IMPORT_ID,
      organizationId: ORG,
      status: 'PENDING_REVIEW',
    });
  });

  it('leaves matchedCustomerId null when no customer matches the MC#', async () => {
    repo.findById.mockResolvedValue(makeImport());
    pythonClient.extractRatecon.mockResolvedValue(makeResult());
    customerLookup.findByMcNumber.mockResolvedValue(null);
    const handler = await captureHandler();

    await handler(event);

    expect(repo.update).toHaveBeenLastCalledWith(
      IMPORT_ID,
      ORG,
      expect.objectContaining({ status: 'PENDING_REVIEW', matchedCustomerId: null }),
    );
  });

  it('marks EXTRACTION_FAILED when the Python service throws', async () => {
    repo.findById.mockResolvedValue(makeImport());
    pythonClient.extractRatecon.mockRejectedValue(new Error('Python service unreachable'));
    const handler = await captureHandler();

    await handler(event);

    expect(repo.update).toHaveBeenLastCalledWith(
      IMPORT_ID,
      ORG,
      expect.objectContaining({
        status: 'EXTRACTION_FAILED',
        failureReason: 'Python service unreachable',
      }),
    );
  });

  it('warns and does nothing when the import is not found', async () => {
    repo.findById.mockResolvedValue(null);
    const handler = await captureHandler();

    await handler(event);

    expect(repo.update).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
