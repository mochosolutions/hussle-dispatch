import type { Contact, Load } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { CustomerWithCounts, CustomerWithDetails } from '../../types/customerTypes';

export interface CustomerResponse {
  id: string;
  organizationId: string;
  type: string;
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
  paymentTerms: string | null;
  paymentTermsDays: number | null;
  quickPayDiscount: number | null;
  notes: string | null;
  billingMethod: string;
  status: string;
  _count: {
    loads: number;
    contacts: number;
    places: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDetailResponse extends CustomerResponse {
  loads: Load[];
  contacts: Contact[];
}

const decimalToNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
};

export const toCustomerResponse = (customer: CustomerWithCounts): CustomerResponse => ({
  ...customer,
  quickPayDiscount: decimalToNumber(customer.quickPayDiscount),
});

export const toCustomerDetailResponse = (
  customer: CustomerWithDetails,
): CustomerDetailResponse => ({
  ...customer,
  quickPayDiscount: decimalToNumber(customer.quickPayDiscount),
});

export const toCustomerListResponse = (
  customers: CustomerWithCounts[],
): CustomerResponse[] => customers.map((customer) => toCustomerResponse(customer));

export const toCustomerListEnvelope = (
  customers: CustomerWithCounts[],
  meta: PaginationMeta,
): { data: CustomerResponse[]; meta: PaginationMeta } => ({
  data: toCustomerListResponse(customers),
  meta,
});
