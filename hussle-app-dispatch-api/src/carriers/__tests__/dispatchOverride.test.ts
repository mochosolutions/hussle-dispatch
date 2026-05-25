import { createDispatchOverrideService } from '../services/dispatchOverrideService';
import type {
  DispatchOverrideCarrierQueryPort,
  DispatchOverrideLoadQueryPort,
  DispatchOverrideAuditPort,
} from '../services/dispatchOverrideService';
import { NotFoundError } from '@/shared/errors';

const makeCarrier = (overrides = {}) => ({
  id: 'carrier-1',
  name: 'Test Carrier',
  type: 'EXTERNAL_CARRIER',
  tinOnFile: false,
  ...overrides,
});

interface ComplianceFixture {
  insuranceOnFile: boolean;
  insuranceExpiresAt: Date | null;
  agreementSigned: boolean;
}

const makeComplianceDeps = (fixture: ComplianceFixture) => {
  const insuranceDocs = fixture.insuranceOnFile
    ? [
        {
          id: 'doc-insurance-1',
          organizationId: 'org-1',
          entityType: 'carrier',
          entityId: 'carrier-1',
          type: 'INSURANCE_CERT',
          fileName: 'coi.pdf',
          fileSize: null,
          mimeType: 'application/pdf',
          s3Key: 's3://test/coi.pdf',
          url: 'https://test/coi.pdf',
          uploadStatus: 'confirmed',
          isArchived: false,
          uploadedByUserId: null,
          notes: null,
          expiresAt: fixture.insuranceExpiresAt,
          metadata: null,
          reviewStatus: 'approved',
          reviewedAt: null,
          reviewedByUserId: null,
          rejectionReason: null,
          signatureData: null,
          signedAt: null,
          createdAt: new Date('2026-03-01T00:00:00.000Z'),
          uploadedByUser: null,
        },
      ]
    : [];
  return {
    documentRepo: {
      findManyForCompliance: jest.fn().mockResolvedValue(insuranceDocs),
    },
    agreementRepo: {
      findManySigned: jest.fn().mockResolvedValue(
        fixture.agreementSigned
          ? [
              {
                id: 'agreement-1',
                carrierId: 'carrier-1',
                signedAt: new Date('2026-03-01T00:00:00.000Z'),
              },
            ]
          : [],
      ),
    },
  };
};

const makeLoad = (overrides = {}) => ({
  id: 'load-1',
  organizationId: 'org-1',
  onboardingOverride: false,
  onboardingOverrideReason: null,
  ...overrides,
});

const makeInput = (overrides = {}) => ({
  carrierId: 'carrier-1',
  loadId: 'load-1',
  reason: 'Urgent shipment - docs arriving tomorrow',
  organizationId: 'org-1',
  userId: 'user-1',
  ...overrides,
});

describe('dispatchOverrideService', () => {
  let carrierQuery: jest.Mocked<DispatchOverrideCarrierQueryPort>;
  let loadQuery: jest.Mocked<DispatchOverrideLoadQueryPort>;
  let auditLog: jest.Mocked<DispatchOverrideAuditPort>;

  beforeEach(() => {
    carrierQuery = {
      findById: jest.fn(),
    };
    loadQuery = {
      findById: jest.fn(),
      updateOverride: jest.fn(),
    };
    auditLog = {
      create: jest.fn().mockResolvedValue({}),
    };
  });

  const createService = (
    fixture: ComplianceFixture = {
      insuranceOnFile: false,
      insuranceExpiresAt: null,
      agreementSigned: false,
    },
  ) =>
    createDispatchOverrideService({
      carrierQuery,
      loadQuery,
      auditLog,
      derivedComplianceDeps: makeComplianceDeps(fixture),
    });

  it('returns 200 and sets override fields when admin calls with valid loadId and reason', async () => {
    // Arrange
    const carrier = makeCarrier();
    const load = makeLoad();
    const updatedLoad = makeLoad({
      onboardingOverride: true,
      onboardingOverrideReason: 'Urgent shipment - docs arriving tomorrow',
    });

    carrierQuery.findById.mockResolvedValue(carrier);
    loadQuery.findById.mockResolvedValue(load);
    loadQuery.updateOverride.mockResolvedValue(updatedLoad);

    const service = createService();
    const input = makeInput();

    // Act
    const result = await service.override(input);

    // Assert
    expect(result.data.onboardingOverride).toBe(true);
    expect(result.data.onboardingOverrideReason).toBe('Urgent shipment - docs arriving tomorrow');
    expect(loadQuery.updateOverride).toHaveBeenCalledWith('load-1', {
      onboardingOverride: true,
      onboardingOverrideReason: 'Urgent shipment - docs arriving tomorrow',
    });
  });

  it('throws NotFoundError when carrier not found', async () => {
    // Arrange
    carrierQuery.findById.mockResolvedValue(null);

    const service = createService();

    // Act & Assert
    await expect(service.override(makeInput())).rejects.toThrow(NotFoundError);
    expect(loadQuery.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when load not found', async () => {
    // Arrange
    carrierQuery.findById.mockResolvedValue(makeCarrier());
    loadQuery.findById.mockResolvedValue(null);

    const service = createService();

    // Act & Assert
    await expect(service.override(makeInput())).rejects.toThrow(NotFoundError);
    expect(loadQuery.updateOverride).not.toHaveBeenCalled();
  });

  it('writes AuditLog entry with correct action, entityType, and metadata', async () => {
    // Arrange
    const carrier = makeCarrier();
    const load = makeLoad();
    const updatedLoad = makeLoad({ onboardingOverride: true });

    carrierQuery.findById.mockResolvedValue(carrier);
    loadQuery.findById.mockResolvedValue(load);
    loadQuery.updateOverride.mockResolvedValue(updatedLoad);

    const service = createService();

    // Act
    await service.override(makeInput());

    // Allow fire-and-forget to settle
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Assert
    expect(auditLog.create).toHaveBeenCalledWith('org-1', {
      userId: 'user-1',
      action: 'DISPATCH_OVERRIDE',
      entityType: 'LOAD',
      entityId: 'load-1',
      changes: null,
      metadata: {
        reason: 'Urgent shipment - docs arriving tomorrow',
        missingDocuments: [
          'Certificate of Insurance',
          'Signed Dispatch Agreement',
          'W-9',
        ],
        carrierId: 'carrier-1',
      },
    });
  });

  it('includes missing documents from onboarding gate in audit metadata', async () => {
    // Arrange — carrier has insurance + signed agreement on file, but no W-9.
    const carrier = makeCarrier({ tinOnFile: false });

    carrierQuery.findById.mockResolvedValue(carrier);
    loadQuery.findById.mockResolvedValue(makeLoad());
    loadQuery.updateOverride.mockResolvedValue(makeLoad({ onboardingOverride: true }));

    const service = createService({
      insuranceOnFile: true,
      insuranceExpiresAt: null,
      agreementSigned: true,
    });

    // Act
    await service.override(makeInput());

    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });

    // Assert
    const auditCalls = auditLog.create.mock.calls;
    expect(auditCalls.length).toBeGreaterThan(0);
    const [, auditInput] = auditCalls[0] ?? [];
    expect(auditInput).toBeDefined();
    const metadata = (auditInput as { metadata: Record<string, unknown> }).metadata;
    expect(metadata['missingDocuments']).toEqual(['W-9']);
  });
});
