import type {
  BillingMethod,
  Contact,
  Customer,
  CustomerType,
  CustomerStatus,
  Load,
  NotificationChannel,
  NotificationTrigger,
} from '@prisma/client';
import type { SortOrder } from '@/shared/pagination';
import type { PaginationMeta } from '@/shared/responseEnvelope';

// ---------------------------------------------------------------------------
// Create / Update inputs
// ---------------------------------------------------------------------------

export interface CreateCustomerInput {
  type: CustomerType;
  companyName: string;
  mcNumber?: string;
  dotNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: number;
  notes?: string;
  billingMethod?: BillingMethod;
  status?: CustomerStatus;
}

export interface UpdateCustomerInput {
  type?: CustomerType;
  companyName?: string;
  mcNumber?: string;
  dotNumber?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  paymentTerms?: string;
  paymentTermsDays?: number;
  quickPayDiscount?: number;
  notes?: string;
  billingMethod?: BillingMethod;
  status?: CustomerStatus;
}

// ---------------------------------------------------------------------------
// Query / filter types
// ---------------------------------------------------------------------------

export interface CustomerListFilters {
  type?: CustomerType;
  status?: CustomerStatus;
  search?: string;
}

export interface CustomerQueryInput {
  organizationId: string;
  filters: CustomerListFilters;
}

export interface ListCustomersRepositoryInput extends CustomerQueryInput {
  skip: number;
  take: number;
  orderBy: Record<string, SortOrder>;
}

// ---------------------------------------------------------------------------
// Loaded relations
// ---------------------------------------------------------------------------

export interface CustomerWithCounts extends Customer {
  _count: {
    loads: number;
    contacts: number;
    places: number;
  };
}

export interface CustomerWithDetails extends CustomerWithCounts {
  loads: Load[];
  contacts: Contact[];
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ListCustomersResult {
  data: CustomerWithCounts[];
  meta: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Repo port
// ---------------------------------------------------------------------------

export interface CustomerRepositoryPort {
  create(organizationId: string, input: CreateCustomerInput): Promise<CustomerWithCounts>;
  findById(id: string, organizationId: string): Promise<CustomerWithCounts | null>;
  findByIdWithDetails(id: string, organizationId: string): Promise<CustomerWithDetails | null>;
  list(input: ListCustomersRepositoryInput): Promise<CustomerWithCounts[]>;
  count(input: CustomerQueryInput): Promise<number>;
  update(id: string, organizationId: string, input: UpdateCustomerInput): Promise<CustomerWithCounts>;
  softDelete(id: string, organizationId: string, deletedAt: Date): Promise<void>;
  countByOrganization(organizationId: string): Promise<number>;
  createNotificationSettings(
    customerId: string,
    settings: CustomerNotificationSettingInput[],
  ): Promise<void>;
}

export interface CustomerNotificationSettingInput {
  trigger: NotificationTrigger;
  channel: NotificationChannel;
  enabled: boolean;
}
