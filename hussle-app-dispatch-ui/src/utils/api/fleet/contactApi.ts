import axiosInstance from 'utils/axios';
import type {
  Contact,
  ContactType,
  CreateContactInput,
  UpdateContactInput,
  PaginationMeta,
} from 'features/carrier/types';

interface GetContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: ContactType | 'all';
  sort?: string;
  order?: 'asc' | 'desc';
}

interface GetContactsResponse {
  data: Contact[];
  meta: PaginationMeta;
}

interface GetContactResponse {
  data: Contact;
}

export const getContacts = async (
  params: GetContactsParams,
): Promise<{ data: Contact[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetContactsResponse>('/contacts', { params });
  return response.data;
};

export const getContact = async (id: string): Promise<{ contact: Contact }> => {
  const response = await axiosInstance.get<GetContactResponse>(`/contacts/${id}`);
  return { contact: response.data.data };
};

export const createContact = async (data: CreateContactInput): Promise<{ contact: Contact }> => {
  const response = await axiosInstance.post<GetContactResponse>('/contacts', data);
  return { contact: response.data.data };
};

export const updateContact = async (
  id: string,
  data: UpdateContactInput,
): Promise<{ contact: Contact }> => {
  const response = await axiosInstance.patch<GetContactResponse>(`/contacts/${id}`, data);
  return { contact: response.data.data };
};

export const deleteContact = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/contacts/${id}`);
};
