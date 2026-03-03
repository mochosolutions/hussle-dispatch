import type { ParsedQs } from 'qs';
import type {
  ContactEntity,
  CreateContactInput,
  ListContactsResult,
  ContactListFilters,
  UpdateContactInput,
} from './contactTypes';

export interface CreateContactServiceInput {
  organizationId: string;
  input: CreateContactInput;
}

export interface ListContactsServiceInput {
  organizationId: string;
  query: ParsedQs;
  filters: ContactListFilters;
}

export interface UpdateContactServiceInput {
  id: string;
  organizationId: string;
  input: UpdateContactInput;
}

export interface DeleteContactServiceInput {
  id: string;
  organizationId: string;
}

export interface GetContactByIdServiceInput {
  id: string;
  organizationId: string;
}

export interface ContactService {
  createContact(input: CreateContactServiceInput): Promise<ContactEntity>;
  listContacts(input: ListContactsServiceInput): Promise<ListContactsResult>;
  updateContact(input: UpdateContactServiceInput): Promise<ContactEntity>;
  deleteContact(input: DeleteContactServiceInput): Promise<void>;
  getContactById(input: GetContactByIdServiceInput): Promise<ContactEntity>;
}
