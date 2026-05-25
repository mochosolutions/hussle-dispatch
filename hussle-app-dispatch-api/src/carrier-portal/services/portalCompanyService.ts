import type { Carrier } from '@prisma/client';
import { FieldLockedError } from '@/shared/errors';

export interface SaveCompanyRequest {
  // Display name remains accepted for backward compatibility with the old payload shape.
  // When omitted, Carrier.name is recomputed from dbaName ?? legalName on every write.
  name?: string;
  legalName?: string | null;
  dbaName?: string | null;
  taxClassification?: string | null;
  tin?: string | null;
  tinType?: string | null;
  signatoryName?: string | null;
  signatoryTitle?: string | null;
  mcNumber?: string | null;
  dotNumber?: string | null;
  ein?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
}

export interface CarrierSummary {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  type: string;
}

interface CarrierRepo {
  findByIdScoped(carrierId: string, organizationId: string): Promise<Carrier>;
  update(carrierId: string, organizationId: string, data: Record<string, unknown>): Promise<Carrier>;
}

interface PortalCompanyServiceDeps {
  carrierRepo: CarrierRepo;
}

const toCarrierSummary = (carrier: Carrier): CarrierSummary => ({
  id: carrier.id,
  name: carrier.name,
  email: carrier.email,
  phone: carrier.phone,
  status: carrier.status,
  type: carrier.type,
});

// Display name precedence: dbaName (when non-empty) > legalName > existing carrier.name.
const computeDisplayName = (
  incoming: SaveCompanyRequest,
  existing: Pick<Carrier, 'name' | 'legalName' | 'dbaName'>,
): string => {
  const trimmedDba = incoming.dbaName?.trim();
  const trimmedLegal = incoming.legalName?.trim();
  const effectiveDba =
    incoming.dbaName !== undefined
      ? trimmedDba && trimmedDba.length > 0
        ? trimmedDba
        : null
      : existing.dbaName;
  const effectiveLegal =
    incoming.legalName !== undefined
      ? trimmedLegal && trimmedLegal.length > 0
        ? trimmedLegal
        : null
      : existing.legalName;

  if (effectiveDba) {
    return effectiveDba;
  }
  if (effectiveLegal) {
    return effectiveLegal;
  }
  return incoming.name?.trim() || existing.name;
};

// Identity fields embedded in the DISPATCH_AGREEMENT signed PDF. Mutating any
// of these post-sign requires voiding the prior agreement first (see the
// /agreements/void-for-resign endpoint). All other Carrier columns are freely
// editable — they're not contract-bound.
const IDENTITY_FIELDS = ['legalName', 'mcNumber', 'dotNumber'] as const;

const assertIdentityFieldsUnchanged = (
  fields: SaveCompanyRequest,
  existing: Carrier,
): void => {
  if (existing.dispatchAgreementSignedAt === null) {
    return;
  }

  for (const field of IDENTITY_FIELDS) {
    const incoming = fields[field];
    if (incoming === undefined) {
      continue;
    }
    const current = existing[field];
    const incomingNormalized = incoming === null ? null : String(incoming);
    const currentNormalized = current === null || current === undefined ? null : String(current);
    if (incomingNormalized !== currentNormalized) {
      throw new FieldLockedError(`company.${field}`);
    }
  }
};

export const createPortalCompanyService = (deps: PortalCompanyServiceDeps) => ({
  saveCompany: async (
    carrierId: string,
    organizationId: string,
    fields: SaveCompanyRequest,
  ): Promise<CarrierSummary> => {
    const existing = await deps.carrierRepo.findByIdScoped(carrierId, organizationId);

    assertIdentityFieldsUnchanged(fields, existing);

    const writeData: Record<string, unknown> = { ...fields };
    // `name` is a derived display column — never write the request's raw `name` field through.
    delete writeData.name;
    writeData.name = computeDisplayName(fields, existing);

    const updated = await deps.carrierRepo.update(carrierId, organizationId, writeData);

    return toCarrierSummary(updated);
  },
});
