import { NotFoundError } from '@/shared/errors';
import { parsePaginationParams, paginateQuery } from '@/shared/pagination';
import type { ContactRepositoryPort } from '../types/contactTypes';
import type {
  ContactService,
  CreateContactServiceInput,
  DeleteContactServiceInput,
  GetContactByIdServiceInput,
  ListContactsServiceInput,
  UpdateContactServiceInput,
} from '../types/contactServiceTypes';

const listSortableFields = [
  'createdAt',
  'updatedAt',
  'companyName',
  'contactName',
  'type',
] as const;

const getSafeSortField = (field: string): (typeof listSortableFields)[number] => {
  const matched = listSortableFields.find((allowedField) => allowedField === field);
  if (matched !== undefined) {
    return matched;
  }

  return 'createdAt';
};

interface ContactServiceDeps {
  contactRepository: ContactRepositoryPort;
}

const findContactOrThrow = async (id: string, organizationId: string, deps: ContactServiceDeps) => {
  const contact = await deps.contactRepository.findById(id, organizationId);
  if (contact === null) {
    throw new NotFoundError('Contact not found.');
  }

  return contact;
};

export const createContactService = (deps: ContactServiceDeps): ContactService => ({
  createContact: async ({ organizationId, input }: CreateContactServiceInput) =>
    deps.contactRepository.create(organizationId, input),

  listContacts: async ({ organizationId, query, filters }: ListContactsServiceInput) => {
    const params = parsePaginationParams(query);
    const sort = getSafeSortField(params.sort);

    return paginateQuery(
      { ...params, sort },
      {
        findMany: ({ skip, take, orderBy }) =>
          deps.contactRepository.list({
            organizationId,
            filters,
            skip,
            take,
            orderBy,
          }),
        count: () =>
          deps.contactRepository.count({
            organizationId,
            filters,
          }),
      },
    );
  },

  getContactById: async ({ id, organizationId }: GetContactByIdServiceInput) =>
    findContactOrThrow(id, organizationId, deps),

  updateContact: async ({ id, organizationId, input }: UpdateContactServiceInput) => {
    await findContactOrThrow(id, organizationId, deps);
    return deps.contactRepository.update(id, input);
  },

  deleteContact: async ({ id, organizationId }: DeleteContactServiceInput) => {
    await findContactOrThrow(id, organizationId, deps);
    await deps.contactRepository.softDelete(id, new Date());
  },
});
