import type { ParsedQs } from 'qs';
import type {
  CreateCustomerInput,
  CustomerListFilters,
  CustomerWithCounts,
  CustomerWithDetails,
  ListCustomersResult,
  UpdateCustomerInput,
} from './customerTypes';

// ---------------------------------------------------------------------------
// Service input types
// ---------------------------------------------------------------------------

export interface CreateCustomerServiceInput {
  organizationId: string;
  role: string;
  input: CreateCustomerInput;
}

export interface ListCustomersServiceInput {
  query: ParsedQs;
  organizationId: string;
  filters: CustomerListFilters;
  role: string;
}

export interface GetCustomerByIdServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

export interface UpdateCustomerServiceInput {
  id: string;
  organizationId: string;
  input: UpdateCustomerInput;
  role: string;
}

export interface DeleteCustomerServiceInput {
  id: string;
  organizationId: string;
  role: string;
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface CustomerService {
  createCustomer(input: CreateCustomerServiceInput): Promise<CustomerWithCounts>;
  listCustomers(input: ListCustomersServiceInput): Promise<ListCustomersResult>;
  getCustomerById(input: GetCustomerByIdServiceInput): Promise<CustomerWithDetails>;
  updateCustomer(input: UpdateCustomerServiceInput): Promise<CustomerWithCounts>;
  deleteCustomer(input: DeleteCustomerServiceInput): Promise<void>;
}
