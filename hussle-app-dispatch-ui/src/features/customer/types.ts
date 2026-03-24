export type CustomerType = 'BROKER' | 'DIRECT_SHIPPER' | 'THREE_PL';

export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface Customer {
  id: string;
  organizationId: string;
  type: CustomerType;
  companyName: string;
  mcNumber: string | null;
  dotNumber: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  paymentTerms: string;
  paymentTermsDays: number;
  quickPayDiscount: string | null;
  notes: string | null;
  status: CustomerStatus;
  loadCount: number;
  contactCount: number;
  placeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerPayload {
  type: CustomerType;
  companyName: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: string | null;
  notes?: string | null;
  status?: CustomerStatus;
}

export interface UpdateCustomerPayload {
  type?: CustomerType;
  companyName?: string;
  mcNumber?: string | null;
  dotNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: string | null;
  notes?: string | null;
  status?: CustomerStatus;
}

export interface CustomerFilters {
  type?: CustomerType;
  status?: CustomerStatus;
  search?: string;
}

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CustomerListResponse {
  data: Customer[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Notification settings
// ---------------------------------------------------------------------------

export type NotificationTrigger = 'STATUS_CHANGE' | 'CHECK_CALL' | 'DOCUMENT_UPLOADED';

export type NotificationChannel = 'EMAIL' | 'SMS';

export interface NotificationSetting {
  id: string;
  customerId: string;
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
  recipientEmail: string | null;
  recipientPhone: string | null;
  createdAt: string;
  updatedAt: string;
}
