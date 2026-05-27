import { CarrierStatus, CarrierType } from '@prisma/client';
import { runDocumentCheckJob } from '../documentCheckJob';
import type { CarrierForSuspend } from '../../types/suspendTypes';

const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const pastDate = new Date('2020-01-01');

const buildCarrier = (overrides: Partial<CarrierForSuspend> = {}): CarrierForSuspend => ({
  id: 'carrier-1',
  name: 'C1',
  managedByOrgId: 'org-1',
  status: CarrierStatus.ACTIVE,
  type: CarrierType.EXTERNAL_CARRIER,
  dispatchAgreementOnFile: true,
  insuranceCertOnFile: true,
  insuranceExpiry: futureDate,
  tinOnFile: true,
  ...overrides,
});

const makeDeps = (carriers: CarrierForSuspend[]) => ({
  carrierQuery: { findEligible: jest.fn().mockResolvedValue(carriers) },
  carrierWriter: { setStatus: jest.fn().mockResolvedValue({ id: 'x', status: 'ACTIVE' }) },
  auditLog: { create: jest.fn().mockResolvedValue(undefined) },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
});

describe('runDocumentCheckJob', () => {
  it('flips ACTIVE -> ACTION_REQUIRED when insurance expired', async () => {
    const carrier = buildCarrier({
      id: 'c1',
      status: CarrierStatus.ACTIVE,
      insuranceExpiry: pastDate,
    });
    const deps = makeDeps([carrier]);

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('c1', CarrierStatus.ACTION_REQUIRED);
    expect(deps.auditLog.create).toHaveBeenCalledWith('org-1', expect.objectContaining({
      action: 'CARRIER_DOCUMENTS_INVALID',
      entityId: 'c1',
      changes: { status: { old: 'ACTIVE', new: 'ACTION_REQUIRED' } },
    }));
    expect(result.toActionRequired).toBe(1);
    expect(result.toActive).toBe(0);
    expect(result.unchanged).toBe(0);
  });

  it('flips ACTION_REQUIRED -> ACTIVE when documents are valid again', async () => {
    const carrier = buildCarrier({
      id: 'c2',
      status: CarrierStatus.ACTION_REQUIRED,
    });
    const deps = makeDeps([carrier]);

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('c2', CarrierStatus.ACTIVE);
    expect(deps.auditLog.create).toHaveBeenCalledWith('org-1', expect.objectContaining({
      action: 'CARRIER_DOCUMENTS_VALID',
      changes: { status: { old: 'ACTION_REQUIRED', new: 'ACTIVE' } },
    }));
    expect(result.toActive).toBe(1);
  });

  it('leaves carrier unchanged when status already matches gate result', async () => {
    const valid = buildCarrier({ id: 'c3', status: CarrierStatus.ACTIVE });
    const invalid = buildCarrier({
      id: 'c4',
      status: CarrierStatus.ACTION_REQUIRED,
      insuranceExpiry: pastDate,
    });
    const deps = makeDeps([valid, invalid]);

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
      dispatchAgreementOnFile: false,
      tinOnFile: false,
      insuranceCertOnFile: false,
      insuranceExpiry: null,
    });
    const companyAssetValid = buildCarrier({
      id: 'ca2',
      status: CarrierStatus.ACTIVE,
      type: CarrierType.COMPANY_ASSET,
      dispatchAgreementOnFile: false,
      tinOnFile: false,
      insuranceCertOnFile: true,
      insuranceExpiry: futureDate,
    });
    const deps = makeDeps([companyAssetMissingInsurance, companyAssetValid]);

    const result = await runDocumentCheckJob(deps);

    expect(deps.carrierWriter.setStatus).toHaveBeenCalledWith('ca1', CarrierStatus.ACTION_REQUIRED);
    expect(deps.carrierWriter.setStatus).not.toHaveBeenCalledWith('ca2', expect.any(String));
    expect(result.toActionRequired).toBe(1);
    expect(result.unchanged).toBe(1);
  });
});
