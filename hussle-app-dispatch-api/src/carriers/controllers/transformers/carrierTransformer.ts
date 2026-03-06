import { checkCarrierOnboarding } from '@/shared/onboardingGate';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type {
  CarrierResponse,
  CarrierWithCounts,
  CarrierWithAssets,
  CarrierWithAssetsResponse,
  InsuranceWarning,
} from '../../types/carrierTypes';

const isAdminRole = (role: string): boolean => role === 'admin';

const daysUntil = (date: Date): number => {
  const now = new Date();
  const millis = date.getTime() - now.getTime();
  return Math.ceil(millis / (1000 * 60 * 60 * 24));
};

const getInsuranceWarning = (insuranceExpiry: Date | null): InsuranceWarning | null => {
  if (insuranceExpiry === null) {
    return null;
  }

  const daysRemaining = daysUntil(insuranceExpiry);
  if (daysRemaining < 0) {
    return 'EXPIRED';
  }
  if (daysRemaining <= 7) {
    return '7_DAY';
  }
  if (daysRemaining <= 30) {
    return '30_DAY';
  }
  return null;
};

export const toCarrierResponse = (carrier: CarrierWithCounts, role: string): CarrierResponse => {
  const onboarding = checkCarrierOnboarding({
    carrierType: carrier.type,
    dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
    insuranceCertOnFile: carrier.insuranceCertOnFile,
    insuranceExpiry: carrier.insuranceExpiry,
    w9OnFile: carrier.w9OnFile,
  });

  const responseBase: CarrierResponse = {
    id: carrier.id,
    managedByOrgId: carrier.managedByOrgId,
    carrierOrgId: carrier.carrierOrgId,
    name: carrier.name,
    type: carrier.type,
    mcNumber: carrier.mcNumber,
    dotNumber: carrier.dotNumber,
    ein: carrier.ein,
    phone: carrier.phone,
    email: carrier.email,
    address: carrier.address,
    city: carrier.city,
    state: carrier.state,
    zip: carrier.zip,
    dispatchFeePercent: carrier.dispatchFeePercent,
    feeIncludesAccessorials: carrier.feeIncludesAccessorials,
    ownerOpPayPercent: carrier.ownerOpPayPercent,
    dispatchAgreementOnFile: carrier.dispatchAgreementOnFile,
    dispatchAgreementSignedAt: carrier.dispatchAgreementSignedAt,
    insuranceCertOnFile: carrier.insuranceCertOnFile,
    insuranceExpiry: carrier.insuranceExpiry,
    w9OnFile: carrier.w9OnFile,
    carrierPacketOnFile: carrier.carrierPacketOnFile,
    onboardingFlowId: carrier.onboardingFlowId,
    onboardingStatus: carrier.onboardingStatus,
    authorityStatus: carrier.authorityStatus,
    status: carrier.status,
    notes: carrier.notes,
    createdAt: carrier.createdAt,
    updatedAt: carrier.updatedAt,
    deletedAt: carrier.deletedAt,
    driverCount: carrier._count.drivers,
    vehicleCount: carrier._count.vehicles,
    onboardingComplete: onboarding.allowed,
    insuranceWarning: getInsuranceWarning(carrier.insuranceExpiry),
  };

  if (!isAdminRole(role)) {
    return responseBase;
  }

  return {
    ...responseBase,
    partnerSplitPercent: carrier.partnerSplitPercent,
  };
};

export const toCarrierListResponse = (
  carriers: CarrierWithCounts[],
  role: string,
): CarrierResponse[] => carriers.map((carrier) => toCarrierResponse(carrier, role));

export const toCarrierListEnvelope = (
  carriers: CarrierWithCounts[],
  role: string,
  meta: PaginationMeta,
): { data: CarrierResponse[]; meta: PaginationMeta } => ({
  data: toCarrierListResponse(carriers, role),
  meta,
});

export const toCarrierWithAssetsResponse = (
  carrier: CarrierWithAssets,
  role: string,
): CarrierWithAssetsResponse => {
  return {
    ...toCarrierResponse(carrier, role),
    drivers: carrier.drivers,
    vehicles: carrier.vehicles,
  };
};
