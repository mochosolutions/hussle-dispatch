import type { Carrier, Contact } from '@prisma/client';
import { NotFoundError } from '@/shared/errors/commonErrors';

export interface SaveCompanyRequest {
  name: string;
  mcNumber?: string;
  dotNumber?: string;
  ein?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  factoringCompanyName?: string;
  factoringCompanyEmail?: string;
  factoringSubmissionMethod?: string;
  factoringAdvanceRate?: number;
  factoringFeePercent?: number;
  fuelCardProviders?: string[];
  howFoundUs?: string;
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

interface ContactRepo {
  upsertPrimaryContact(input: {
    organizationId: string;
    existingContactId: string | null;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  }): Promise<Contact>;
}

interface PortalCompanyServiceDeps {
  carrierRepo: CarrierRepo;
  contactRepo: ContactRepo;
}

const toCarrierSummary = (carrier: Carrier): CarrierSummary => ({
  id: carrier.id,
  name: carrier.name,
  email: carrier.email,
  phone: carrier.phone,
  status: carrier.status,
  type: carrier.type,
});

const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const trimmed = fullName.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return {
    firstName: trimmed.substring(0, spaceIndex),
    lastName: trimmed.substring(spaceIndex + 1),
  };
};

export const createPortalCompanyService = (deps: PortalCompanyServiceDeps) => ({
  saveCompany: async (
    carrierId: string,
    organizationId: string,
    fields: SaveCompanyRequest,
  ): Promise<CarrierSummary> => {
    const existing = await deps.carrierRepo.findByIdScoped(carrierId, organizationId);

    const {
      primaryContactName,
      primaryContactPhone,
      primaryContactEmail,
      ...carrierFields
    } = fields;

    const hasPrimaryContactInput =
      primaryContactName !== undefined ||
      primaryContactPhone !== undefined ||
      primaryContactEmail !== undefined;

    let primaryContactId: string | undefined;

    if (hasPrimaryContactInput && primaryContactName !== undefined) {
      const { firstName, lastName } = splitName(primaryContactName);

      const contact = await deps.contactRepo.upsertPrimaryContact({
        organizationId: existing.managedByOrgId,
        existingContactId: existing.primaryContactId,
        firstName,
        lastName,
        phone: primaryContactPhone,
        email: primaryContactEmail,
      });

      primaryContactId = contact.id;
    }

    const updateData: Record<string, unknown> = { ...carrierFields };
    if (primaryContactId !== undefined) {
      updateData.primaryContactId = primaryContactId;
    }

    const updated = await deps.carrierRepo.update(carrierId, organizationId, updateData);

    return toCarrierSummary(updated);
  },
});
