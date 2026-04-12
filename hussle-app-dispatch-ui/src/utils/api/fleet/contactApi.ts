import axiosInstance from 'utils/axios';
import type {
  Contact,
  CreateContactInput,
  UpdateContactInput,
  PaginationMeta,
} from 'features/carrier/types';

interface GetContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  customerId?: string;
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

export const getContact = async (id: string): Promise<Contact> => {
  const response = await axiosInstance.get<GetContactResponse>(`/contacts/${id}`);
  return response.data.data;
};

export const createContact = async (data: CreateContactInput): Promise<Contact> => {
  const response = await axiosInstance.post<GetContactResponse>('/contacts', data);
  return response.data.data;
};

export const updateContact = async (
  id: string,
  data: UpdateContactInput,
): Promise<Contact> => {
  const response = await axiosInstance.patch<GetContactResponse>(`/contacts/${id}`, data);
  return response.data.data;
};

export const deleteContact = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/contacts/${id}`);
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface ContactStats {
  loadCount: number;
  recentLoads: Array<{
    id: string;
    loadNumber: string;
    status: string;
    pickupDate: string | null;
  }>;
}

interface GetContactStatsResponse {
  data: ContactStats;
}

export const getContactStats = async (id: string): Promise<ContactStats> => {
  const response = await axiosInstance.get<GetContactStatsResponse>(`/contacts/${id}/stats`);
  return response.data.data;
};
