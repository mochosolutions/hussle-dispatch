import axiosInstance from 'utils/axios';
import type {
  Document,
  ListDocumentsParams,
  ListDocumentsResponse,
  PresignInput,
  PresignResponse,
} from 'features/documents/types';

interface PresignApiResponse {
  data: PresignResponse;
}

interface ConfirmApiResponse {
  data: Document;
}

export const presignDocument = async (
  input: PresignInput,
): Promise<{ presign: PresignResponse }> => {
  const response = await axiosInstance.post<PresignApiResponse>('/documents/presign', input);
  return { presign: response.data.data };
};

export const confirmDocument = async (documentId: string): Promise<{ document: Document }> => {
  const response = await axiosInstance.post<ConfirmApiResponse>(
    `/documents/${documentId}/confirm`,
  );
  return { document: response.data.data };
};

export const listDocuments = async (
  params: ListDocumentsParams,
): Promise<{ data: Document[]; meta: ListDocumentsResponse['meta'] }> => {
  const response = await axiosInstance.get<ListDocumentsResponse>('/documents', { params });
  return response.data;
};
