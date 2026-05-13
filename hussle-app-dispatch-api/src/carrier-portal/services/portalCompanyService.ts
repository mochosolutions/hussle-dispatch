import type { Carrier } from '@prisma/client';

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

export const createPortalCompanyService = (deps: PortalCompanyServiceDeps) => ({
  saveCompany: async (
    carrierId: string,
    organizationId: string,
    fields: SaveCompanyRequest,
  ): Promise<CarrierSummary> => {
    await deps.carrierRepo.findByIdScoped(carrierId, organizationId);

    const updated = await deps.carrierRepo.update(carrierId, organizationId, { ...fields });

    return toCarrierSummary(updated);
  },
});
