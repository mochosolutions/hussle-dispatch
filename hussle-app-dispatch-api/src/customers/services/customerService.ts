import { ConflictError, NotFoundError, ValidationError } from '@/shared/errors';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type {
  CustomerRepositoryPort,
  CustomerWithCounts,
  CustomerWithDetails,
} from '../types/customerTypes';
import type {
  CreateCustomerServiceInput,
  CustomerService,
  DeleteCustomerServiceInput,
  GetCustomerByIdServiceInput,
  ListCustomersServiceInput,
  UpdateCustomerServiceInput,
} from '../types/customerServiceTypes';

const listSortableFields = ['createdAt', 'updatedAt', 'companyName', 'status'] as const;

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }
  return 'createdAt';
};

interface CustomerServiceDeps {
  customerRepository: CustomerRepositoryPort;
}

const findCustomerOrThrow = async (
  id: string,
  organizationId: string,
  deps: CustomerServiceDeps,
): Promise<CustomerWithCounts> => {
  const customer = await deps.customerRepository.findById(id, organizationId);
  if (customer === null) {
    throw new NotFoundError('Customer not found.');
  }
  return customer;
};

export const createCustomerService = (deps: CustomerServiceDeps): CustomerService => ({
  createCustomer: async ({ organizationId, input }: CreateCustomerServiceInput) => {
    // Check companyName uniqueness within org
    const existing = await deps.customerRepository.list({
      organizationId,
      filters: { search: input.companyName },
      skip: 0,
      take: 1,
      orderBy: { createdAt: 'desc' },
    });

    const duplicate = existing.find(
      (c) => c.companyName.toLowerCase() === input.companyName.toLowerCase(),
    );

    if (duplicate !== undefined) {
      throw new ConflictError(
        `A customer with the name "${input.companyName}" already exists in this organization.`,
      );
    }

    return deps.customerRepository.create(organizationId, input);
  },

  getCustomerById: async ({
    id,
    organizationId,
  }: GetCustomerByIdServiceInput): Promise<CustomerWithDetails> => {
    const customer = await deps.customerRepository.findByIdWithDetails(id, organizationId);
    if (customer === null) {
      throw new NotFoundError('Customer not found.');
    }
    return customer;
  },

  listCustomers: async ({ query, organizationId, filters }: ListCustomersServiceInput) => {
    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.customerRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.customerRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  updateCustomer: async ({ id, organizationId, input }: UpdateCustomerServiceInput) => {
    await findCustomerOrThrow(id, organizationId, deps);

    // If companyName is being changed, check uniqueness
    if (input.companyName !== undefined) {
      const existing = await deps.customerRepository.list({
        organizationId,
        filters: { search: input.companyName },
        skip: 0,
        take: 1,
        orderBy: { createdAt: 'desc' },
      });

      const duplicate = existing.find(
        (c) => c.companyName.toLowerCase() === input.companyName?.toLowerCase() && c.id !== id,
      );

      if (duplicate !== undefined) {
        throw new ConflictError(
          `A customer with the name "${input.companyName}" already exists in this organization.`,
        );
      }
    }

    return deps.customerRepository.update(id, organizationId, input);
  },

  deleteCustomer: async ({ id, organizationId }: DeleteCustomerServiceInput) => {
    await findCustomerOrThrow(id, organizationId, deps);
    await deps.customerRepository.softDelete(id, organizationId, new Date());
  },
});
