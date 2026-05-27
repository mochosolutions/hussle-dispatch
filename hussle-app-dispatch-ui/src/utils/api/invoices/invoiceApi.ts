import axiosInstance from 'utils/axios';
import type {
  InvoiceListItem,
  InvoiceDetail,
  InvoiceFilters,
  InvoiceCounts,
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

export const getInvoice = async (id: string): Promise<InvoiceDetail> => {
  const response = await axiosInstance.get<GetInvoiceResponse>(`/invoices/${id}`);
  return response.data.data;
};

export const updateInvoice = async (
  id: string,
  data: UpdateInvoiceInput,
): Promise<InvoiceDetail> => {
  const response = await axiosInstance.patch<GetInvoiceResponse>(`/invoices/${id}`, data);
  return response.data.data;
};

export const approveInvoice = async (id: string): Promise<InvoiceDetail> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${id}/approve`);
  return response.data.data;
};

export const sendInvoice = async (
  id: string,
  input: SendInvoiceInput,
): Promise<InvoiceDetail> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${id}/send`, {
    email: input.recipientEmail,
    ...(input.ccEmails && input.ccEmails.length > 0 ? { ccEmails: input.ccEmails } : {}),
  });
  return response.data.data;
};

export const markPaid = async (
  id: string,
  data: PaymentInput,
): Promise<InvoiceDetail> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${id}/mark-paid`, data);
  return response.data.data;
};

export const deleteInvoice = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/invoices/${id}`);
};

export const createFromLoad = async (loadId: string): Promise<InvoiceDetail> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/from-load/${loadId}`);
  return response.data.data;
};

export const voidInvoice = async (invoiceId: string): Promise<InvoiceDetail> => {
  const response = await axiosInstance.post<GetInvoiceResponse>(`/invoices/${invoiceId}/void`);
  return response.data.data;
};

export const generateInvoicePdf = async (
  invoiceId: string,
): Promise<{ downloadUrl: string }> => {
  const response = await axiosInstance.get<{ data: { downloadUrl: string } }>(
    `/invoices/${invoiceId}/pdf`,
  );
  return response.data.data;
};

export const downloadInvoicePdfUrl = (invoiceId: string): string =>
  `${axiosInstance.defaults.baseURL ?? ''}/invoices/${invoiceId}/pdf-download`;

export const previewInvoicePdf = async (invoiceId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/invoices/${invoiceId}/preview`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const downloadInvoicePacket = async (invoiceId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`/invoices/${invoiceId}/packet`, {
    responseType: 'blob',
  });
  return response.data as Blob;
};

export const getInvoiceCounts = async (): Promise<InvoiceCounts> => {
  const response = await axiosInstance.get<{ data: InvoiceCounts }>('/invoices/counts');
  return response.data.data;
};
