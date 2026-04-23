// ---------------------------------------------------------------------------
// Carrier Portal — shared types for the onboarding portal feature
// Synced from contract: .planning/carrier-onboarding/types.ts
// ---------------------------------------------------------------------------

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
  EXTERNAL_CARRIER = 'EXTERNAL_CARRIER',
  LEASED_CARRIER = 'LEASED_CARRIER',
}

export enum PayType {
  PERCENTAGE = 'PERCENTAGE',
  PER_MILE = 'PER_MILE',
  FLAT_RATE = 'FLAT_RATE',
}

export enum DocumentType {
  DISPATCH_AGREEMENT = 'DISPATCH_AGREEMENT',
  INSURANCE_CERT = 'INSURANCE_CERT',
  W_9 = 'W_9',
  CARRIER_PACKET = 'CARRIER_PACKET',
}

export enum DocumentReviewStatus {
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum StatePreference {
  NEUTRAL = 'NEUTRAL',
  PREFERRED = 'PREFERRED',
  AVOIDED = 'AVOIDED',
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

export enum CostProfileSource {
  ONBOARDING_ESTIMATE = 'onboarding_estimate',
  DISPATCHER_REVIEW = 'dispatcher_review',
}

export enum DeliveryType {
  COURIER = 'COURIER',
  LAST_MILE = 'LAST_MILE',
  MEDICAL_COURIER = 'MEDICAL_COURIER',
  GROCERY = 'GROCERY',
  PHARMACY = 'PHARMACY',
  OTHER = 'OTHER',
}

// ── Session & Carrier ──────────────────────

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

// ── Answers ────────────────────────────────

export interface SaveAnswerRequest {
  questionId: string;
  value: unknown;
  phase?: number;
}

// ── Company ────────────────────────────────

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

// ── Equipment ──────────────────────────────

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

// ── Drivers ────────────────────────────────

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

// ── Cost Analysis ──────────────────────────

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

// ── Lane Preferences ──────────────────────

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

// ── Documents ──────────────────────────────

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
