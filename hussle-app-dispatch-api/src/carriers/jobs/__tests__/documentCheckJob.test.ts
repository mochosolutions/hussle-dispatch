import { CarrierStatus, CarrierType } from '@prisma/client';
import { runDocumentCheckJob, type CarrierForDocumentCheck } from '../documentCheckJob';
import type { DerivedComplianceDeps } from '../../services/derivedCompliance';
import type { DocumentRepoPort } from '../../../documents/types/documentTypes';
import type { AgreementRepoPort } from '../../../agreements/types/agreementRepoPort';

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const pastDate = new Date('2020-01-01');

const buildCarrier = (
  overrides: Partial<CarrierForDocumentCheck> = {},
): CarrierForDocumentCheck => ({
  id: 'carrier-1',
  name: 'C1',
  managedByOrgId: 'org-1',
  status: CarrierStatus.ACTIVE,
  type: CarrierType.EXTERNAL_CARRIER,
  tinOnFile: true,
  ...overrides,
});

interface ComplianceState {
  insuranceOnFile: boolean;
  insuranceExpiry: Date | null;
  agreementOnFile: boolean;
}

const buildDerivedComplianceDeps = (
  perCarrier: Record<string, ComplianceState>,
): DerivedComplianceDeps => {
  const documentRepo: jest.Mocked<Pick<DocumentRepoPort, 'findManyForCompliance'>> = {
    findManyForCompliance: jest.fn(async (carrierIds: string[], _types) => {
      const docs: Awaited<ReturnType<DocumentRepoPort['findManyForCompliance']>> = [];
      for (const carrierId of carrierIds) {
        const state = perCarrier[carrierId];
        if (state?.insuranceOnFile) {
          docs.push({
            id: `doc-${carrierId}`,
            entityId: carrierId,
            type: 'INSURANCE_CERT',
            createdAt: new Date(),
            expiresAt: state.insuranceExpiry,
          } as Awaited<ReturnType<DocumentRepoPort['findManyForCompliance']>>[number]);
        }
      }
      return docs;
    }),
  };
  const agreementRepo: jest.Mocked<Pick<AgreementRepoPort, 'findManySigned'>> = {
    findManySigned: jest.fn(async (carrierIds: string[]) => {
      const result: Awaited<ReturnType<AgreementRepoPort['findManySigned']>> = [];
      for (const carrierId of carrierIds) {
        const state = perCarrier[carrierId];
        if (state?.agreementOnFile) {
          result.push({
            id: `agreement-${carrierId}`,
            carrierId,
            signedAt: new Date(),
            status: 'SIGNED',
          } as Awaited<ReturnType<AgreementRepoPort['findManySigned']>>[number]);
        }
      }
      return result;
    }),
  };
  return { documentRepo, agreementRepo };
};

const makeDeps = (
  carriers: CarrierForDocumentCheck[],
  perCarrier: Record<string, ComplianceState>,
) => ({
  carrierQuery: { findEligible: jest.fn().mockResolvedValue(carriers) },
  carrierWriter: { setStatus: jest.fn().mockResolvedValue({ id: 'x', status: 'ACTIVE' }) },
  auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  derivedComplianceDeps: buildDerivedComplianceDeps(perCarrier),
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
});

describe('runDocumentCheckJob', () => {
  it('flips ACTIVE -> ACTION_REQUIRED when insurance expired', async () => {
    const carrier = buildCarrier({ id: 'c1', status: CarrierStatus.ACTIVE });
    const deps = makeDeps([carrier], {
      c1: { insuranceOnFile: true, insuranceExpiry: pastDate, agreementOnFile: true },
    });

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('c1', CarrierStatus.ACTION_REQUIRED);
    expect(deps.auditLog.create).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        action: 'CARRIER_DOCUMENTS_INVALID',
        entityId: 'c1',
        changes: { status: { old: 'ACTIVE', new: 'ACTION_REQUIRED' } },
      }),
    );
    expect(result.toActionRequired).toBe(1);
    expect(result.toActive).toBe(0);
    expect(result.unchanged).toBe(0);
  });

  it('flips ACTION_REQUIRED -> ACTIVE when documents are valid again', async () => {
    const carrier = buildCarrier({ id: 'c2', status: CarrierStatus.ACTION_REQUIRED });
    const deps = makeDeps([carrier], {
      c2: { insuranceOnFile: true, insuranceExpiry: futureDate, agreementOnFile: true },
    });

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('c2', CarrierStatus.ACTIVE);
    expect(deps.auditLog.create).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({
        action: 'CARRIER_DOCUMENTS_VALID',
        changes: { status: { old: 'ACTION_REQUIRED', new: 'ACTIVE' } },
      }),
    );
    expect(result.toActive).toBe(1);
  });

  it('leaves carrier unchanged when status already matches gate result', async () => {
    const valid = buildCarrier({ id: 'c3', status: CarrierStatus.ACTIVE });
    const invalid = buildCarrier({ id: 'c4', status: CarrierStatus.ACTION_REQUIRED });
    const deps = makeDeps([valid, invalid], {
      c3: { insuranceOnFile: true, insuranceExpiry: futureDate, agreementOnFile: true },
      c4: { insuranceOnFile: true, insuranceExpiry: pastDate, agreementOnFile: true },
    });

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).not.toHaveBeenCalled();
    expect(deps.auditLog.create).not.toHaveBeenCalled();
    expect(result.unchanged).toBe(2);
  });

  it('checks COMPANY_ASSET with insurance only', async () => {
    const companyAssetMissingInsurance = buildCarrier({
      id: 'ca1',
      status: CarrierStatus.ACTIVE,
      type: CarrierType.COMPANY_ASSET,
      tinOnFile: false,
    });
    const companyAssetValid = buildCarrier({
      id: 'ca2',
      status: CarrierStatus.ACTIVE,
      type: CarrierType.COMPANY_ASSET,
      tinOnFile: false,
    });
    const deps = makeDeps([companyAssetMissingInsurance, companyAssetValid], {
      ca1: { insuranceOnFile: false, insuranceExpiry: null, agreementOnFile: false },
      ca2: { insuranceOnFile: true, insuranceExpiry: futureDate, agreementOnFile: false },
    });

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('ca1', CarrierStatus.ACTION_REQUIRED);
    expect(deps.carrierWriter.setStatus).not.toHaveBeenCalledWith('ca2', expect.any(String));
    expect(result.toActionRequired).toBe(1);
    expect(result.unchanged).toBe(1);
  });
});
