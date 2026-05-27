import type { Contact, Prisma } from '@prisma/client';
import type { PaginationMeta } from '@/shared/responseEnvelope';

export interface CreateContactInput {
  customerId?: string | null;
  role?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  ccEmails?: string[];
  notes?: string;
}

export interface UpdateContactInput {
  customerId?: string | null;
  role?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  ccEmails?: string[];
  notes?: string;
}

export interface ContactListFilters {
  customerId?: string;
  search?: string;
}

export interface ContactQueryInput {
  organizationId: string;
  filters: ContactListFilters;
}

export interface ListContactsRepositoryInput extends ContactQueryInput {
  skip: number;
  take: number;
  orderBy: Prisma.ContactOrderByWithRelationInput;
}

export interface ContactRepositoryPort {
  create(organizationId: string, input: CreateContactInput): Promise<Contact>;
  findById(id: string, organizationId: string): Promise<Contact | null>;
  list(input: ListContactsRepositoryInput): Promise<Contact[]>;
  count(input: ContactQueryInput): Promise<number>;
  update(id: string, input: UpdateContactInput): Promise<Contact>;
  softDelete(id: string, deletedAt: Date): Promise<void>;
}

export interface ListContactsResult {
  data: ContactEntity[];
  meta: PaginationMeta;
}

export type ContactEntity = Contact;

export type ContactResponse = ContactEntity;
