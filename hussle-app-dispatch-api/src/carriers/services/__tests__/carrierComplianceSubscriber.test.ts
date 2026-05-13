import type { EventBus } from '../../../shared/messaging/eventBus';
import type { EventMap } from '../../../shared/messaging/eventMap';
import type { Logger } from '../../../shared/utils/logger';
import { initializeCarrierComplianceSubscriber } from '../carrierComplianceSubscriber';

type ConfirmedHandler = (data: EventMap['document.confirmed']) => Promise<void>;

const buildPayload = (
  overrides: Partial<EventMap['document.confirmed']> = {},
): EventMap['document.confirmed'] => ({
  documentId: 'doc-1',
  entityType: 'carrier',
  entityId: 'carrier-1',
  documentType: 'INSURANCE_CERT',
  organizationId: 'org-1',
  expiresAt: null,
  ...overrides,
});

describe('initializeCarrierComplianceSubscriber', () => {
  const mockEventBus: jest.Mocked<EventBus> = {
    publish: jest.fn(),
    publishDelayed: jest.fn(),
    subscribe: jest.fn(),
    close: jest.fn(),
  };

  const mockCompliance = {
    updateComplianceFlags: jest.fn(),
  };

  const mockLogger: jest.Mocked<Logger> = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBus.subscribe.mockResolvedValue(undefined);
    mockCompliance.updateComplianceFlags.mockResolvedValue(undefined);
  });

  const captureHandler = async (): Promise<ConfirmedHandler> => {
    await initializeCarrierComplianceSubscriber({
      eventBus: mockEventBus,
      carrierCompliance: mockCompliance,
      logger: mockLogger,
    });
    const call = mockEventBus.subscribe.mock.calls[0];
    if (!call) {
      throw new Error('subscribe was not called');
    }
    return call[2] as ConfirmedHandler;
  };

  it('subscribes to document.confirmed with carrier-compliance-service queue group', async () => {
    await initializeCarrierComplianceSubscriber({
      eventBus: mockEventBus,
      carrierCompliance: mockCompliance,
      logger: mockLogger,
    });

    expect(mockEventBus.subscribe).toHaveBeenCalledWith(
      'document.confirmed',
      'carrier-compliance-service',
      expect.any(Function),
    );
  });

  it('sets insuranceCertOnFile and copies expiresAt to insuranceExpiry for INSURANCE_CERT', async () => {
    const handler = await captureHandler();
    const expiry = '2027-01-15T00:00:00.000Z';

    await handler(buildPayload({ documentType: 'INSURANCE_CERT', expiresAt: expiry }));

    expect(mockCompliance.updateComplianceFlags).toHaveBeenCalledWith(
      'carrier-1',
      'org-1',
      {
        insuranceCertOnFile: true,
        insuranceExpiry: new Date(expiry),
      },
    );
  });

  it('sets only insuranceCertOnFile when INSURANCE_CERT has no expiry', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ documentType: 'INSURANCE_CERT', expiresAt: null }));

    expect(mockCompliance.updateComplianceFlags).toHaveBeenCalledWith(
      'carrier-1',
      'org-1',
      { insuranceCertOnFile: true },
    );
  });

  it('sets w9OnFile for W9', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ documentType: 'W9' }));

    expect(mockCompliance.updateComplianceFlags).toHaveBeenCalledWith(
      'carrier-1',
      'org-1',
      { w9OnFile: true },
    );
  });

  it('sets dispatchAgreementOnFile for DISPATCH_AGREEMENT', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ documentType: 'DISPATCH_AGREEMENT' }));

    expect(mockCompliance.updateComplianceFlags).toHaveBeenCalledWith(
      'carrier-1',
      'org-1',
      { dispatchAgreementOnFile: true },
    );
  });

  it('sets carrierPacketOnFile for CARRIER_PACKET', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ documentType: 'CARRIER_PACKET' }));

    expect(mockCompliance.updateComplianceFlags).toHaveBeenCalledWith(
      'carrier-1',
      'org-1',
      { carrierPacketOnFile: true },
    );
  });

  it('ignores documents whose entityType is not carrier', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ entityType: 'load', documentType: 'INSURANCE_CERT' }));

    expect(mockCompliance.updateComplianceFlags).not.toHaveBeenCalled();
  });

  it('ignores carrier documents with non-compliance types', async () => {
    const handler = await captureHandler();

    await handler(buildPayload({ documentType: 'BOL_SIGNED' }));

    expect(mockCompliance.updateComplianceFlags).not.toHaveBeenCalled();
  });

  it('logs an error and does not throw when the compliance update fails', async () => {
    const handler = await captureHandler();
    mockCompliance.updateComplianceFlags.mockRejectedValueOnce(new Error('db down'));

    await expect(handler(buildPayload({ documentType: 'W9' }))).resolves.toBeUndefined();

    expect(mockLogger.error).toHaveBeenCalledWith(
      'Failed to apply carrier compliance flags on document.confirmed',
      expect.objectContaining({
        carrierId: 'carrier-1',
        documentType: 'W9',
        error: 'db down',
      }),
    );
  });
});
