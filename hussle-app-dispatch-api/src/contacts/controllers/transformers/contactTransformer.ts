import type { PaginationMeta } from '@/shared/responseEnvelope';
import type { ContactEntity, ContactResponse } from '../../types/contactTypes';

export const toContactResponse = (contact: ContactEntity): ContactResponse => contact;

export const toContactListResponse = (contacts: ContactEntity[]): ContactResponse[] =>
  contacts.map((contact) => toContactResponse(contact));

export const toContactListEnvelope = (
  contacts: ContactEntity[],
  meta: PaginationMeta,
): { data: ContactResponse[]; meta: PaginationMeta } => ({
  data: toContactListResponse(contacts),
  meta,
});
