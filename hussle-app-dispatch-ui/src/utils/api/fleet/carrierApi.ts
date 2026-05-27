import axiosInstance from 'utils/axios';
import type {
  Carrier,
  CarrierListItem,
  CarrierOnboardingStatus,
  CarrierNote,
  CreateCarrierInput,
  CreateCarrierNoteInput,
  UpdateCarrierInput,
  Driver,
  Vehicle,
  CreateDriverInput,
  CreateVehicleInput,
  PaginationMeta,
} from 'features/carrier/types';
import type { CarrierOnboardingDetail } from 'features/carrier/onboardingTypes';

interface GetCarriersParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string | string[];
  sort?: string;
  order?: 'asc' | 'desc';
}

// ---------------------------------------------------------------------------
// Field naming bridge: UI <-> API
//
// UI domain uses `companyMarginPercent`. API/Prisma column is `dispatchFeePercent`.
// The financial model redesign plans to rename the API column post-MVP; until
// then we translate at the HTTP boundary so the UI stays domain-pure.
// ---------------------------------------------------------------------------

interface WireCarrier
  extends Omit<Carrier, 'companyMarginPercent' | 'dispatchFeeAmount' | 'lat' | 'lng'> {
  dispatchFeePercent?: number | string | null;
  dispatchFeeAmount?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

interface WireCarrierListItem
  extends Omit<CarrierListItem, 'companyMarginPercent' | 'dispatchFeeAmount' | 'lat' | 'lng'> {
  dispatchFeePercent?: number | string | null;
  dispatchFeeAmount?: number | string | null;
  lat?: number | string | null;
  lng?: number | string | null;
}

const parseDecimal = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'string' ? Number(value) : value;
};

const fromWireCarrier = <
  T extends {
    dispatchFeePercent?: number | string | null;
    dispatchFeeAmount?: number | string | null;
    lat?: number | string | null;
    lng?: number | string | null;
  },
>(
  wire: T,
): Omit<T, 'dispatchFeePercent' | 'dispatchFeeAmount' | 'lat' | 'lng'> & {
  companyMarginPercent: number;
  dispatchFeeAmount: number;
  lat: number | null;
  lng: number | null;
} => {
  const { dispatchFeePercent, dispatchFeeAmount, lat, lng, ...rest } = wire;
  return {
    ...rest,
    companyMarginPercent: parseDecimal(dispatchFeePercent) ?? 0,
    dispatchFeeAmount: parseDecimal(dispatchFeeAmount) ?? 0,
    lat: parseDecimal(lat),
    lng: parseDecimal(lng),
  };
};

const toWireCarrierInput = <
  T extends {
    companyMarginPercent?: number | null;
    dispatchFeeType?: 'PERCENTAGE' | 'FLAT' | null;
    dispatchFeeAmount?: number | null;
  },
>(
  input: T,
): Omit<T, 'companyMarginPercent'> & {
  dispatchFeePercent?: number | null;
} => {
  const { companyMarginPercent, ...rest } = input;
  if (companyMarginPercent === undefined) {
    return rest;
  }
  return {
    ...rest,
    dispatchFeePercent: companyMarginPercent,
  };
};

interface GetCarriersResponse {
  data: WireCarrierListItem[];
  meta: PaginationMeta;
}

interface GetCarrierResponse {
  data: WireCarrier;
}

interface CarrierOnboardingResponse {
  data: CarrierOnboardingStatus;
}

export const getCarriers = async (
  params: GetCarriersParams,
): Promise<{ data: CarrierListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetCarriersResponse>('/carriers', { params });
  return {
    data: response.data.data.map((c) => fromWireCarrier(c) as CarrierListItem),
    meta: response.data.meta,
  };
};

export const getCarrier = async (id: string): Promise<Carrier> => {
  const response = await axiosInstance.get<GetCarrierResponse>(`/carriers/${id}`);
  return fromWireCarrier(response.data.data) as Carrier;
};

export const createCarrier = async (data: CreateCarrierInput): Promise<Carrier> => {
  const response = await axiosInstance.post<GetCarrierResponse>(
    '/carriers',
    toWireCarrierInput(data),
  );
  return fromWireCarrier(response.data.data) as Carrier;
};

export const updateCarrier = async (
  id: string,
  data: UpdateCarrierInput,
): Promise<Carrier> => {
  const response = await axiosInstance.patch<GetCarrierResponse>(
    `/carriers/${id}`,
    toWireCarrierInput(data),
  );
  return fromWireCarrier(response.data.data) as Carrier;
};

export const deleteCarrier = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/carriers/${id}`);
};

export const getCarrierOnboarding = async (
  id: string,
): Promise<CarrierOnboardingStatus> => {
  const response = await axiosInstance.get<CarrierOnboardingResponse>(
    `/carriers/${id}/onboarding`,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Onboarding Detail (full 6-phase read-only view)
// ---------------------------------------------------------------------------

interface CarrierOnboardingDetailResponse {
  data: CarrierOnboardingDetail;
}

export const getCarrierOnboardingDetail = async (
  carrierId: string,
): Promise<CarrierOnboardingDetail> => {
  const response = await axiosInstance.get<CarrierOnboardingDetailResponse>(
    `/carriers/${carrierId}/onboarding`,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Stats
// ---------------------------------------------------------------------------

export interface CarrierStats {
  lifetimeRevenue: string;
  loadCount: number;
}

interface GetCarrierStatsResponse {
  data: CarrierStats;
}

export const getCarrierStats = async (id: string): Promise<CarrierStats> => {
  const response = await axiosInstance.get<GetCarrierStatsResponse>(`/carriers/${id}/stats`);
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Notes
// ---------------------------------------------------------------------------

interface GetCarrierNotesResponse {
  data: CarrierNote[];
}

interface CreateCarrierNoteResponse {
  data: CarrierNote;
}

export const getCarrierNotes = async (
  carrierId: string,
): Promise<CarrierNote[]> => {
  const response = await axiosInstance.get<GetCarrierNotesResponse>(
    `/carriers/${carrierId}/notes`,
  );
  return response.data.data;
};

export const createCarrierNote = async (
  carrierId: string,
  data: CreateCarrierNoteInput,
): Promise<CarrierNote> => {
  const response = await axiosInstance.post<CreateCarrierNoteResponse>(
    `/carriers/${carrierId}/notes`,
    data,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Drivers & Vehicles (scoped to carrier)
// ---------------------------------------------------------------------------

interface GetCarrierDriversResponse {
  data: Driver[];
  meta: PaginationMeta;
}

interface GetCarrierVehiclesResponse {
  data: Vehicle[];
  meta: PaginationMeta;
}

export const getCarrierDrivers = async (
  carrierId: string,
): Promise<Driver[]> => {
  const response = await axiosInstance.get<GetCarrierDriversResponse>(
    `/drivers`,
    { params: { carrierId } },
  );
  return response.data.data;
};

export const getCarrierVehicles = async (
  carrierId: string,
): Promise<Vehicle[]> => {
  const response = await axiosInstance.get<GetCarrierVehiclesResponse>(
    `/vehicles`,
    { params: { carrierId } },
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier With Assets (create flow)
// ---------------------------------------------------------------------------

export interface CreateCarrierWithAssetsInput extends CreateCarrierInput {
  drivers?: CreateDriverInput[];
  vehicles?: CreateVehicleInput[];
}

export interface CarrierWithAssets extends Carrier {
  drivers: Driver[];
  vehicles: Vehicle[];
}

interface WireCarrierWithAssets
  extends Omit<CarrierWithAssets, 'companyMarginPercent' | 'dispatchFeeAmount'> {
  dispatchFeePercent?: number | string | null;
  dispatchFeeAmount?: number | string | null;
}

interface GetCarrierWithAssetsResponse {
  data: WireCarrierWithAssets;
}

export const createCarrierWithAssets = async (
  data: CreateCarrierWithAssetsInput,
): Promise<CarrierWithAssets> => {
  const response = await axiosInstance.post<GetCarrierWithAssetsResponse>(
    '/carriers/with-assets',
    toWireCarrierInput(data),
  );
  return fromWireCarrier(response.data.data) as CarrierWithAssets;
};

// ---------------------------------------------------------------------------
// Carrier Invite
// ---------------------------------------------------------------------------

interface InviteCarrierInput {
  message?: string;
}

export interface InviteCarrierResponse {
  inviteSentAt: string;
  tokenExpiresAt: string;
}

interface InviteCarrierApiResponse {
  data: InviteCarrierResponse;
}

export const inviteCarrier = async (
  carrierId: string,
  data?: InviteCarrierInput,
): Promise<InviteCarrierResponse> => {
  const response = await axiosInstance.post<InviteCarrierApiResponse>(
    `/carriers/${carrierId}/invite`,
    data,
  );
  return response.data.data;
};

export const resendCarrierInvite = async (
  carrierId: string,
  data?: InviteCarrierInput,
): Promise<InviteCarrierResponse> => {
  const response = await axiosInstance.post<InviteCarrierApiResponse>(
    `/carriers/${carrierId}/resend-invite`,
    data,
  );
  return response.data.data;
};

// ---------------------------------------------------------------------------
// Carrier Approve / Reject
// ---------------------------------------------------------------------------

export interface ApproveCarrierResponse {
  id: string;
  status: string;
  minimumRatePerMile: number | null;
}

export interface RejectCarrierResponse {
  id: string;
  status: string;
}

export interface AdminActivateCarrierResponse {
  id: string;
  status: string;
  minimumRatePerMile: number | null;
}

export interface CarrierTabCountsResponse {
  all: number;
  onboarding: number;
  active: number;
  actionRequired: number;
  suspended: number;
  rejected: number;
}

interface ApproveCarrierApiResponse {
  data: ApproveCarrierResponse;
}

interface RejectCarrierApiResponse {
  data: RejectCarrierResponse;
}

export const approveCarrier = async (carrierId: string): Promise<ApproveCarrierResponse> => {
  const response = await axiosInstance.post<ApproveCarrierApiResponse>(
    `/carriers/${carrierId}/approve`,
  );
  return response.data.data;
};

export const rejectCarrier = async (
  carrierId: string,
  reason: string,
): Promise<RejectCarrierResponse> => {
  const response = await axiosInstance.post<RejectCarrierApiResponse>(
    `/carriers/${carrierId}/reject`,
    { reason },
  );
  return response.data.data;
};

interface AdminActivateApiResponse {
  data: AdminActivateCarrierResponse;
}

export const adminActivateCarrier = async (
  carrierId: string,
  body: { reason: string; evidenceDocumentId?: string },
): Promise<AdminActivateCarrierResponse> => {
  const response = await axiosInstance.post<AdminActivateApiResponse>(
    `/carriers/${carrierId}/admin-activate`,
    body,
  );
  return response.data.data;
};

export const suspendCarrier = async (
  carrierId: string,
  reason: string,
): Promise<{ id: string; status: string }> => {
  const response = await axiosInstance.post<{ data: { id: string; status: string } }>(
    `/carriers/${carrierId}/suspend`,
    { reason },
  );
  return response.data.data;
};

export const unsuspendCarrier = async (
  carrierId: string,
): Promise<{ id: string; status: string }> => {
  const response = await axiosInstance.post<{ data: { id: string; status: string } }>(
    `/carriers/${carrierId}/unsuspend`,
  );
  return response.data.data;
};

export const getCarrierTabCounts = async (): Promise<CarrierTabCountsResponse> => {
  const response = await axiosInstance.get<{ data: CarrierTabCountsResponse }>(
    '/carriers/tab-counts',
  );
  return response.data.data;
};
