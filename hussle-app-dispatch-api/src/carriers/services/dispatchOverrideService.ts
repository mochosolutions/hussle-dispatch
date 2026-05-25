import { NotFoundError } from '@/shared/errors';
import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import type { CarrierOnboardingResult } from '@/shared/onboardingGate';
import type { DerivedComplianceDeps } from './derivedCompliance';
import { computeAgreementStatus, computeInsuranceStatus } from './derivedCompliance';

interface DispatchOverrideInput {
  carrierId: string;
  loadId: string;
  reason: string;
  organizationId: string;
  userId: string;
}

interface CarrierForOverride {
  id: string;
  name: string;
  type: string;
  tinOnFile: boolean;
}

interface LoadForOverride {
  id: string;
  organizationId: string;
  onboardingOverride: boolean;
  onboardingOverrideReason: string | null;
}

export interface DispatchOverrideCarrierQueryPort {
  findById(id: string, organizationId: string): Promise<CarrierForOverride | null>;
}

export interface DispatchOverrideLoadQueryPort {
  findById(id: string, organizationId: string): Promise<LoadForOverride | null>;
  updateOverride(
    id: string,
    data: { onboardingOverride: boolean; onboardingOverrideReason: string },
  ): Promise<LoadForOverride>;
}

export interface DispatchOverrideAuditPort {
  create(
    organizationId: string,
    input: {
      userId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      changes: Record<string, { old: unknown; new: unknown }> | null;
      metadata: Record<string, unknown> | null;
    },
  ): Promise<unknown>;
}

interface DispatchOverrideServiceDeps {
  carrierQuery: DispatchOverrideCarrierQueryPort;
  loadQuery: DispatchOverrideLoadQueryPort;
  auditLog: DispatchOverrideAuditPort;
  derivedComplianceDeps: DerivedComplianceDeps;
}

interface DispatchOverrideResult {
  data: LoadForOverride;
}

export const createDispatchOverrideService = (deps: DispatchOverrideServiceDeps) => ({
  override: async (input: DispatchOverrideInput): Promise<DispatchOverrideResult> => {
    const carrier = await deps.carrierQuery.findById(input.carrierId, input.organizationId);
    if (carrier === null) {
      throw new NotFoundError('Carrier not found.');
    }

    const load = await deps.loadQuery.findById(input.loadId, input.organizationId);
    if (load === null) {
      throw new NotFoundError('Load not found.');
    }

    const [insurance, agreement] = await Promise.all([
      computeInsuranceStatus(carrier.id, deps.derivedComplianceDeps),
      computeAgreementStatus(carrier.id, deps.derivedComplianceDeps),
    ]);
    const onboardingResult: CarrierOnboardingResult = checkCarrierOnboarding({
      carrierType: carrier.type as 'COMPANY_ASSET' | 'EXTERNAL_CARRIER' | 'LEASED_CARRIER',
      dispatchAgreementOnFile: agreement.onFile,
      insuranceCertOnFile: insurance.onFile,
      insuranceExpiry: insurance.expiresAt,
      tinOnFile: carrier.tinOnFile,
    });

    const updatedLoad = await deps.loadQuery.updateOverride(input.loadId, {
      onboardingOverride: true,
      onboardingOverrideReason: input.reason,
    });

    deps.auditLog
      .create(input.organizationId, {
        userId: input.userId,
        action: 'DISPATCH_OVERRIDE',
        entityType: 'LOAD',
        entityId: input.loadId,
        changes: null,
        metadata: {
          reason: input.reason,
          missingDocuments: onboardingResult.missingDocuments,
          carrierId: input.carrierId,
        },
      })
      .catch(() => {});

    return { data: updatedLoad };
  },
});
