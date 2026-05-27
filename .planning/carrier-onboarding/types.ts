// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

// ── Enums ──────────────────────────────────

export enum OnboardingStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum VehicleCategory {
  SEMI_TRUCK = 'SEMI_TRUCK',
  BOX_TRUCK = 'BOX_TRUCK',
  CARGO_VAN = 'CARGO_VAN',
  PERSONAL_VEHICLE = 'PERSONAL_VEHICLE',
}

export enum CarrierType {
  COMPANY_ASSET = 'COMPANY_ASSET',
  OWNER_OPERATOR = 'OWNER_OPERATOR',
  EXTERNAL_CARRIER = 'EXTERNAL_CARRIER',
}

export enum CarrierStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  DRAFT = 'DRAFT',
}

export enum EntryMethod {
  INVITE = 'INVITE',
  SELF_REGISTER = 'SELF_REGISTER',
}

export enum CostProfileSource {
  ONBOARDING_ESTIMATE = 'onboarding_estimate',
  DISPATCHER_REVIEW = 'dispatcher_review',
}

export enum DocumentReviewStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DocumentType {
  DISPATCH_AGREEMENT = 'DISPATCH_AGREEMENT',
  INSURANCE_CERT = 'INSURANCE_CERT',
  W_9 = 'W_9',
  CARRIER_PACKET = 'CARRIER_PACKET',
}

export enum InsuranceWarning {
  THIRTY_DAY = '30_DAY',
  SEVEN_DAY = '7_DAY',
  EXPIRED = 'EXPIRED',
}

export enum TierClassification {
  TIER_A = 'TIER_A',
  TIER_B = 'TIER_B',
  TIER_C = 'TIER_C',
}

export enum FmcsaAuthorityStatus {
  AUTHORIZED = 'AUTHORIZED',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED',
  REVOKED = 'REVOKED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum FmcsaSafetyRating {
  SATISFACTORY = 'SATISFACTORY',
  CONDITIONAL = 'CONDITIONAL',
  UNSATISFACTORY = 'UNSATISFACTORY',
  NOT_RATED = 'NOT_RATED',
}

export enum PayType {
  PERCENTAGE = 'PERCENTAGE',
  PER_MILE = 'PER_MILE',
  FLAT_RATE = 'FLAT_RATE',
}

export enum FreightPreference {
  DRY_VAN = 'DRY_VAN',
  REEFER = 'REEFER',
  FLATBED = 'FLATBED',
  STEP_DECK = 'STEP_DECK',
  POWER_ONLY = 'POWER_ONLY',
  HOTSHOT = 'HOTSHOT',
  BOX_TRUCK = 'BOX_TRUCK',
  SPRINTER_VAN = 'SPRINTER_VAN',
}

export enum StatePreference {
  NEUTRAL = 'NEUTRAL',
  PREFERRED = 'PREFERRED',
  AVOIDED = 'AVOIDED',
}

export enum DeliveryType {
  COURIER = 'COURIER',
  LAST_MILE = 'LAST_MILE',
  MEDICAL_COURIER = 'MEDICAL_COURIER',
  GROCERY = 'GROCERY',
  PHARMACY = 'PHARMACY',
  OTHER = 'OTHER',
}

export enum McAuthorityRequirement {
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  NOT_REQUIRED = 'NOT_REQUIRED',
}

export enum DotRegistrationRequirement {
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  NOT_REQUIRED = 'NOT_REQUIRED',
  GVWR_DEPENDENT = 'GVWR_DEPENDENT',
}

export enum NonCdlRequirementStatus {
  REQUIRED = 'REQUIRED',
  RECOMMENDED = 'RECOMMENDED',
}

// ── Common ─────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ErrorDetail {
  message: string;
  field?: string;
}

export interface ErrorResponse {
  errors: ErrorDetail[];
}

// ── Response Envelopes ────────────────────

export interface SingleResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Onboarding Session ────────────────────

export interface OnboardingSession {
  id: string;
  carrierId: string;
  currentPhase: number;
  currentQuestionIndex: number;
  answers?: Record<string, unknown>;
  completedPhases: number[];
  lastActiveAt: string;
  completedAt?: string | null;
  remindersSent?: number;
  lastReminderAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Carrier Portal Summary ────────────────

export interface CarrierPortalSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  onboardingStatus: OnboardingStatus;
  type?: CarrierType;
}

export interface PortalSessionResponse {
  session: OnboardingSession;
  carrier: CarrierPortalSummary;
}

// ── Answer Save Request ───────────────────

export interface SaveAnswerRequest {
  questionId: string;
  value: unknown;
  phase?: number;
}

// ── Phase Save Requests ───────────────────

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

export interface VehicleEntry {
  category: VehicleCategory;
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  licensePlate?: string;
  gvwr?: number;
  lenderName?: string;
  loanPayment?: number;
  loanInterestRate?: number;
  insuranceMonthlyCost?: number;
  deliveryTypes?: DeliveryType[];
  insuranceAttested?: boolean;
  insuranceAttestedAt?: string;
}

export interface MedicalCourierCompliance {
  transportsPharma?: boolean;
  controlledSubstances?: boolean;
  complianceCallRequired?: boolean;
}

export interface SaveEquipmentRequest {
  vehicles: VehicleEntry[];
  medicalCourierCompliance?: MedicalCourierCompliance;
}

// ── Vehicle Compliance Rules ────────────────

export interface InsuranceMinimums {
  commercialAutoLiability: number;
  cargoInsurance?: number;
  requiresCommercialAutoRider?: boolean;
}

export interface GvwrThresholds {
  greenMax: number;
  amberMax: number;
  redMin: number;
}

export interface VehicleCategoryCompliance {
  mcAuthority: McAuthorityRequirement;
  dotRegistration: DotRegistrationRequirement;
  cdlRequired: boolean;
  gvwrThresholds?: GvwrThresholds;
  insuranceMinimums: InsuranceMinimums;
  nonCdlCallout: boolean;
  deliveryTypesRequired: boolean;
}

export type VehicleComplianceRules = Record<VehicleCategory, VehicleCategoryCompliance>;

export const VEHICLE_COMPLIANCE: VehicleComplianceRules = {
  [VehicleCategory.SEMI_TRUCK]: {
    mcAuthority: McAuthorityRequirement.REQUIRED,
    dotRegistration: DotRegistrationRequirement.REQUIRED,
    cdlRequired: true,
    insuranceMinimums: {
      commercialAutoLiability: 1_000_000,
      cargoInsurance: 100_000,
    },
    nonCdlCallout: false,
    deliveryTypesRequired: false,
  },
  [VehicleCategory.BOX_TRUCK]: {
    mcAuthority: McAuthorityRequirement.OPTIONAL,
    dotRegistration: DotRegistrationRequirement.GVWR_DEPENDENT,
    cdlRequired: false,
    gvwrThresholds: {
      greenMax: 10_000,
      amberMax: 26_000,
      redMin: 26_001,
    },
    insuranceMinimums: {
      commercialAutoLiability: 300_000,
      cargoInsurance: 100_000,
    },
    nonCdlCallout: false,
    deliveryTypesRequired: false,
  },
  [VehicleCategory.CARGO_VAN]: {
    mcAuthority: McAuthorityRequirement.OPTIONAL,
    dotRegistration: DotRegistrationRequirement.NOT_REQUIRED,
    cdlRequired: false,
    insuranceMinimums: {
      commercialAutoLiability: 300_000,
    },
    nonCdlCallout: true,
    deliveryTypesRequired: false,
  },
  [VehicleCategory.PERSONAL_VEHICLE]: {
    mcAuthority: McAuthorityRequirement.NOT_REQUIRED,
    dotRegistration: DotRegistrationRequirement.NOT_REQUIRED,
    cdlRequired: false,
    insuranceMinimums: {
      commercialAutoLiability: 300_000,
      requiresCommercialAutoRider: true,
    },
    nonCdlCallout: true,
    deliveryTypesRequired: true,
  },
};

export interface NonCdlRequirement {
  label: string;
  status: NonCdlRequirementStatus;
  description: string;
}

export const NON_CDL_REQUIREMENTS: NonCdlRequirement[] = [
  {
    label: 'Commercial Auto Insurance Rider',
    status: NonCdlRequirementStatus.REQUIRED,
    description: 'Required to operate as a commercial carrier',
  },
  {
    label: 'LLC or Business Entity',
    status: NonCdlRequirementStatus.RECOMMENDED,
    description: 'Protects personal assets',
  },
  {
    label: 'Business Bank Account',
    status: NonCdlRequirementStatus.RECOMMENDED,
    description: 'Required for ACH settlement payments',
  },
  {
    label: 'EIN (Employer Identification Number)',
    status: NonCdlRequirementStatus.REQUIRED,
    description: 'Required for year-end 1099 filing',
  },
];

export interface DriverEntry {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  payType?: PayType;
  payRate?: number;
}

export interface SaveDriversRequest {
  hasAdditionalDrivers: boolean;
  drivers?: DriverEntry[];
}

export interface SaveCostAnalysisRequest {
  truckPayment: number;
  insuranceCost: number;
  fuelCostPerGallon: number;
  milesPerGallon: number;
  maintenanceMonthlyCost: number;
  otherMonthlyCosts: number;
}

export interface CostAnalysisResult {
  breakEvenRpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  revenuePerMile: number;
  costProfileVersion: number;
  costProfileSource: CostProfileSource;
}

export interface LanePreferenceEntry {
  origin?: string;
  destination?: string;
}

export interface StatePreferenceEntry {
  state: string;
  preference: StatePreference;
}

export interface SaveLanePreferencesRequest {
  homeBaseCity?: string;
  homeBaseState?: string;
  maxDaysOut?: number;
  preferredLanes?: LanePreferenceEntry[];
  statePreferences?: StatePreferenceEntry[];
  freightPreferences?: FreightPreference[];
}

// ── Document Schemas ──────────────────────

export interface PortalDocument {
  id: string;
  documentType: DocumentType;
  fileName?: string;
  fileUrl?: string;
  reviewStatus: DocumentReviewStatus;
  signatureData?: string;
  signedAt?: string | null;
  createdAt: string;
}

export interface PresignRequest {
  fileName: string;
  contentType: string;
  documentType: DocumentType;
}

export interface PresignResponse {
  documentId: string;
  uploadUrl: string;
  fields: Record<string, string>;
}

export interface ConfirmUploadRequest {
  documentType: DocumentType;
  insuranceExpiry?: string;
  coverageConfirmed?: boolean;
}

export interface SignDocumentRequest {
  signatureData: string;
  consentGiven: boolean;
  signerName?: string;
  signerTitle?: string;
}

// ── Admin Schemas ─────────────────────────

export interface SendInviteRequest {
  message?: string;
}

export interface RejectCarrierRequest {
  reason: string;
}

export interface CarrierOnboardingDetail {
  carrier: Record<string, unknown>;
  session: OnboardingSession;
  vehicles: Record<string, unknown>[];
  drivers: Record<string, unknown>[];
  documents: PortalDocument[];
  costAnalysis?: CostAnalysisResult;
  lanePreferences?: {
    homeBaseCity?: string;
    homeBaseState?: string;
    maxDaysOut?: number;
    preferredLanes?: LanePreferenceEntry[];
    statePreferences?: StatePreferenceEntry[];
    freightPreferences?: FreightPreference[];
  };
}

export interface PendingCarrier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: CarrierType;
  onboardingStatus: OnboardingStatus;
  entryMethod: EntryMethod;
  completedAt?: string | null;
  inviteSentAt?: string | null;
  driverCount?: number;
  vehicleCount?: number;
}

export interface PendingCarrierListResponse {
  data: PendingCarrier[];
  meta: PaginationMeta;
}

// ── Phase 2: Self-Registration ────────────

export interface RegisterRequest {
  email: string;
  orgSlug: string;
}

export interface VerifyRequest {
  email: string;
  code: string;
}

export interface VerifyResponse {
  token: string;
  carrierId: string;
}

// ── Phase 2: FMCSA ───────────────────────

export interface FmcsaStatus {
  authorityStatus?: FmcsaAuthorityStatus;
  yearsActive?: number | null;
  safetyRating?: FmcsaSafetyRating;
  outOfServicePercent?: number | null;
  crashCount?: number | null;
  lastCheckedAt?: string | null;
  suggestedTier?: TierClassification;
}

export interface SetTierRequest {
  tier: TierClassification;
}

// ── Phase 3: Settings ─────────────────────

export interface OnboardingSettingsUpdate {
  onboardingReminderDelays?: number[];
  onboardingReminderMax?: number;
  documentExpiryWarningDays?: number[];
}

// ── Event Payloads ────────────────────────

export interface CarrierInvitedEvent {
  carrierId: string;
  organizationId: string;
  carrierName: string;
  carrierEmail: string;
  carrierPhone?: string | null;
  inviteToken: string;
  invitedByUserId: string;
}

export interface CarrierOnboardingCompletedEvent {
  carrierId: string;
  organizationId: string;
  carrierName: string;
}

export interface CarrierOnboardingApprovedEvent {
  carrierId: string;
  organizationId: string;
  carrierName: string;
  carrierEmail: string;
  carrierPhone?: string | null;
  minimumRatePerMile: number;
  approvedByUserId: string;
}

export interface CarrierOnboardingRejectedEvent {
  carrierId: string;
  organizationId: string;
  carrierName: string;
  carrierEmail: string;
  carrierPhone?: string | null;
  rejectionReason: string;
  rejectedByUserId: string;
}

export interface CarrierSelfRegisteredEvent {
  carrierId: string;
  organizationId: string;
  carrierEmail: string;
}

export interface CarrierFmcsaLookupRequestedEvent {
  carrierId: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
}

export interface CarrierFmcsaVerifiedEvent {
  carrierId: string;
  authorityStatus: string;
  safetyRating: string;
  yearsActive: number;
}

export interface CarrierOnboardingReminderSentEvent {
  carrierId: string;
  reminderNumber: number;
  totalReminders: number;
}

export interface CarrierDocumentExpiringEvent {
  carrierId: string;
  documentType: string;
  expiresAt: string;
  daysRemaining: number;
}
