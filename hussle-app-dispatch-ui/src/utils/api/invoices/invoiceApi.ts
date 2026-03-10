import axiosInstance from 'utils/axios';
import type {
  InvoiceListItem,
  InvoiceDetail,
  InvoiceFilters,
  UpdateInvoiceInput,
  SendInvoiceInput,
  PaymentInput,
  PaginationMeta,
} from 'features/invoices/types';

// ---------------------------------------------------------------------------
// Request / Response types
// ---------------------------------------------------------------------------

interface GetInvoicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceFilters['status'];
  type?: InvoiceFilters['type'];
  overdue?: boolean;
  missingBol?: boolean;
}

interface GetInvoicesResponse {
  data: InvoiceListItem[];
  meta: PaginationMeta;
}

interface GetInvoiceResponse {
  data: InvoiceDetail;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export const getInvoices = async (
  params: GetInvoicesParams,
): Promise<{ data: InvoiceListItem[]; meta: PaginationMeta }> => {
  const response = await axiosInstance.get<GetInvoicesResponse>('/invoices', { params });
  return response.data;
};

export const getInvoice = async (id: string): Promise<{ invoice: InvoiceDetail }> => {
  const response = await axiosInstance.get<GetInvoiceResponse>(`/invoices/${id}`);
  return { invoice: response.data.data };
};

export const updateInvoice = async (
  id: string,
  data: UpdateInvoiceInput,
): Promise<{ invoice: InvoiceDetail }> => {
  const response = await axiosInstance.patch<GetInvoiceResponse>(`/invoices/${id}`, data);
  return { invoice: response.data.data };
};

export const approveInvoice = async (id: string): Promise<{ invoice: InvoiceDetail }> => {
  const response = await axiosInstance.patch<GetInvoiceResponse>(`/invoices/${id}/approve`);
  return { invoice: response.data.data };
};

export const sendInvoice = async (
  id: string,
  input: SendInvoiceInput,
): Promise<{ invoice: InvoiceDetail }> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${id}/send`, input);
  return { invoice: response.data.data };
};

export const markPaid = async (
  id: string,
  data: PaymentInput,
): Promise<{ invoice: InvoiceDetail }> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${id}/payments`, data);
  return { invoice: response.data.data };
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/invoices/${id}`);
};
