import type { Carrier } from '@prisma/client';
import { FieldLockedError } from '@/shared/errors';
import { createPortalCompanyService } from '../portalCompanyService';

const baseCarrier = (overrides: Partial<Carrier> = {}): Carrier =>
  ({
    id: 'carrier-1',
    managedByOrgId: 'org-1',
    carrierOrgId: null,
    name: 'Acme Logistics LLC',
    legalName: 'Acme Logistics LLC',
    dbaName: null,
    taxClassification: null,
    tin: null,
    tinType: null,
    signatoryName: null,
    signatoryTitle: null,
    signedAgreementId: null,
    homeBaseCity: null,
    homeBaseState: null,
    preferredLanes: null,
    weeklySchedule: null,
    freightPreferences: null,
    maxDaysOut: null,
    type: 'EXTERNAL_CARRIER',
    mcNumber: '123456',
    dotNumber: '654321',
    ein: null,
    phone: null,
    email: null,
    address: null,
    city: null,
    state: null,
    zip: null,
    lat: null,
    lng: null,
    dispatchAgreementSignedAt: null,
    ...overrides,
  } as unknown as Carrier);

describe('portalCompanyService.saveCompany', () => {
  const setup = (carrier: Carrier) => {
    const updated = { ...carrier };
    const carrierRepo = {
      findByIdScoped: jest.fn().mockResolvedValue(carrier),
      update: jest.fn(async (_carrierId: string, _orgId: string, data: Record<string, unknown>) => {
        Object.assign(updated, data);
        return updated;
      }),
    };
    const service = createPortalCompanyService({ carrierRepo });
    return { service, carrierRepo, updated };
  };

  it('computes Carrier.name = dbaName when dbaName is set', async () => {
    const { service, carrierRepo } = setup(baseCarrier());

    await service.saveCompany('carrier-1', 'org-1', {
      legalName: 'Acme Logistics LLC',
      dbaName: 'Acme Express',
    });

    const call = carrierRepo.update.mock.calls[0];
    if (!call) throw new Error('expected update to be called');
    const writeData = call[2] as Record<string, unknown>;
    expect(writeData.name).toBe('Acme Express');
    expect(writeData.legalName).toBe('Acme Logistics LLC');
    expect(writeData.dbaName).toBe('Acme Express');
  });

  it('computes Carrier.name = legalName when dbaName is null or empty', async () => {
    const { service, carrierRepo } = setup(baseCarrier());

    await service.saveCompany('carrier-1', 'org-1', {
      legalName: 'Acme Logistics LLC',
      dbaName: null,
    });

    const call = carrierRepo.update.mock.calls[0];
    if (!call) throw new Error('expected update to be called');
    const writeData = call[2] as Record<string, unknown>;
    expect(writeData.name).toBe('Acme Logistics LLC');
    expect(writeData.dbaName).toBeNull();
  });

  it('falls back to existing legalName when only dbaName is cleared', async () => {
    const { service, carrierRepo } = setup(
      baseCarrier({ legalName: 'Acme Logistics LLC', dbaName: 'Old DBA', name: 'Old DBA' }),
    );

    await service.saveCompany('carrier-1', 'org-1', { dbaName: null });

    const call = carrierRepo.update.mock.calls[0];
    if (!call) throw new Error('expected update to be called');
    const writeData = call[2] as Record<string, unknown>;
    expect(writeData.name).toBe('Acme Logistics LLC');
  });

  it('does not enforce locks when dispatchAgreementSignedAt is null', async () => {
    const { service, carrierRepo } = setup(baseCarrier({ dispatchAgreementSignedAt: null }));

    await service.saveCompany('carrier-1', 'org-1', {
      legalName: 'New Legal',
      mcNumber: '999',
      tin: '12-3456789',
    });

    expect(carrierRepo.update).toHaveBeenCalled();
  });

  it('rejects mutations to locked fields with FieldLockedError after signing', async () => {
    const { service } = setup(
      baseCarrier({
        dispatchAgreementSignedAt: new Date('2026-01-01'),
        legalName: 'Acme Logistics LLC',
      }),
    );

    await expect(
      service.saveCompany('carrier-1', 'org-1', { legalName: 'New Legal' }),
    ).rejects.toBeInstanceOf(FieldLockedError);
  });

  it('FieldLockedError carries the dot-path of the offending field', async () => {
    const { service } = setup(
      baseCarrier({
        dispatchAgreementSignedAt: new Date('2026-01-01'),
        tin: '12-3456789',
      }),
    );

    const error = await service
      .saveCompany('carrier-1', 'org-1', { tin: '99-9999999' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(FieldLockedError);
    expect((error as FieldLockedError).field).toBe('company.tin');
    expect((error as FieldLockedError).code).toBe('FIELD_LOCKED');
    expect((error as FieldLockedError).statusCode).toBe(422);
  });

  it('allows unchanged values for locked fields after signing (idempotent re-save)', async () => {
    const { service, carrierRepo } = setup(
      baseCarrier({
        dispatchAgreementSignedAt: new Date('2026-01-01'),
        legalName: 'Acme Logistics LLC',
        tin: '12-3456789',
      }),
    );

    await service.saveCompany('carrier-1', 'org-1', {
      legalName: 'Acme Logistics LLC',
      tin: '12-3456789',
      // Address is not in the lock list — should be writable.
      address: '123 New Street',
    });

    expect(carrierRepo.update).toHaveBeenCalled();
    const call = carrierRepo.update.mock.calls[0];
    if (!call) throw new Error('expected update to be called');
    const writeData = call[2] as Record<string, unknown>;
    expect(writeData.address).toBe('123 New Street');
  });

  it('allows unlocked field updates (dbaName, address) after signing', async () => {
    const { service, carrierRepo } = setup(
      baseCarrier({
        dispatchAgreementSignedAt: new Date('2026-01-01'),
        legalName: 'Acme Logistics LLC',
        dbaName: 'Old DBA',
        name: 'Old DBA',
      }),
    );

    await service.saveCompany('carrier-1', 'org-1', { dbaName: 'New DBA' });

    const call = carrierRepo.update.mock.calls[0];
    if (!call) throw new Error('expected update to be called');
    const writeData = call[2] as Record<string, unknown>;
    expect(writeData.dbaName).toBe('New DBA');
    expect(writeData.name).toBe('New DBA');
  });
});
