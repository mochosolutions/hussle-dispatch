// Auto-generated from contract.yaml — DO NOT EDIT MANUALLY

// ── Enums ────────────────────────────────────────────────────

export enum StopType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
  STOP_OFF = 'STOP_OFF',
  DROP_HOOK = 'DROP_HOOK',
  LIVE_UNLOAD = 'LIVE_UNLOAD',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

// ── Stats Responses ──────────────────────────────────────────

export interface CarrierStats {
  lifetimeRevenue: string;
  loadCount: number;
}

export interface ContactRecentLoad {
  id: string;
  loadNumber: string;
  status: string;
  pickupDate?: string | null;
}

export interface ContactStats {
  loadCount: number;
  recentLoads: ContactRecentLoad[];
}

export interface CustomerStats {
  totalRevenue: string;
  avgDaysToPay: number | null;
  outstandingAR: string;
  loadCount: number;
}

export interface PlaceStats {
  visitCount: number;
  lastVisitDate: string | null;
}

// ── Modified Response Fields ─────────────────────────────────

export interface LoadListItemPickupDate {
  pickupDate: string | null;
}

export interface InvoiceLoadStop {
  id: string;
  type: StopType;
  sequence: number;
  facilityName?: string | null;
  city?: string | null;
  state?: string | null;
  appointmentDate?: string | null;
}

export interface InvoiceExpandedLoad {
  stops: InvoiceLoadStop[];
}

export interface InvoiceExpandedCarrier {
  mcNumber?: string | null;
  phone?: string | null;
}

// ── Shared ───────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ErrorBody {
  errors: Array<{
    message: string;
    field?: string;
  }>;
}

// ── API Response Envelopes ───────────────────────────────────

export interface SingleResponse<T> {
  data: T;
}

export interface ListResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
