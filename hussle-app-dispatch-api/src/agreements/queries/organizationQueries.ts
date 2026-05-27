import type { PrismaClient } from '@prisma/client';

import { NotFoundError } from '@/shared/errors';

/**
 * Cross-module read port for the agreements module.
 *
 * Lookups limited to fields the agreements module needs (org name for
 * dispatch-agreement template variables). Compositions in US-14 will pass
 * this port into the agreements composition root, mirroring the
 * `carrierQueries` cross-module pattern in `requestAgreement.ts`.
 */
export interface OrganizationQueryPort {
  findOrgNameById(organizationId: string): Promise<string>;
}

export const createOrganizationQueries = (prisma: PrismaClient): OrganizationQueryPort => ({
  findOrgNameById: async (organizationId) => {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });
    if (org === null) {
      throw new NotFoundError(`Organization not found: ${organizationId}`);
    }
    return org.name;
  },
});
