import type { PrismaClient } from '@prisma/client';

import type { CarrierQueryPort } from '../services/requestAgreement';

/**
 * Cross-module read port impl backed by Prisma.
 *
 * Maps Carrier columns onto the agreement-template-shaped projection the
 * agreements service expects:
 *   - `name`            → `legalName`
 *   - `mcNumber`        → string (DB allows null; coerce to '' so the
 *                          template renders)
 *   - `dotNumber`       → string | null (passes through)
 *   - `primaryContact`  → derived `primaryContactName` (firstName lastName)
 *                          and `primaryContactEmail`
 *
 * Org-scoped via `managedByOrgId` and excludes soft-deleted rows.
 */
export const createCarrierQueries = (prisma: PrismaClient): CarrierQueryPort => ({
  findById: async (id, organizationId) => {
    const carrier = await prisma.carrier.findFirst({
      where: { id, managedByOrgId: organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        legalName: true,
        mcNumber: true,
        dotNumber: true,
        email: true,
        signatoryName: true,
        primaryContact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (carrier === null) {
      return null;
    }

    // Prefer the explicit primaryContact relation (legacy dispatcher flow).
    // Fall back to typed Carrier columns populated by the carrier-portal
    // self-onboarding flow (signatoryName + email written by
    // portalCompanyService.saveCompany).
    const primaryContactName =
      carrier.primaryContact !== null
        ? `${carrier.primaryContact.firstName} ${carrier.primaryContact.lastName}`.trim()
        : (carrier.signatoryName ?? null);
    const primaryContactEmail = carrier.primaryContact?.email ?? carrier.email ?? null;

    return {
      id: carrier.id,
      legalName: carrier.legalName ?? carrier.name,
      mcNumber: carrier.mcNumber ?? '',
      dotNumber: carrier.dotNumber,
      primaryContactName,
      primaryContactEmail,
    };
  },
});
