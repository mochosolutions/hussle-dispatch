import axiosInstance from 'utils/axios';
import type {
  BulkDownloadResult,
  ConfirmDocumentInput,
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

export const confirmDocument = async (
  documentId: string,
  input?: ConfirmDocumentInput,
): Promise<{ document: Document }> => {
  const response = await axiosInstance.post<ConfirmApiResponse>(
    `/documents/${documentId}/confirm`,
    input,
  );
  return { document: response.data.data };
};

export const listDocuments = async (
  params: ListDocumentsParams,
): Promise<{ data: Document[]; meta: ListDocumentsResponse['meta'] }> => {
  const response = await axiosInstance.get<ListDocumentsResponse>('/documents', { params });
  return response.data;
};

export const uploadDocumentToS3 = async (presignedUrl: string, file: File): Promise<void> => {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Upload failed with status ${String(response.status)}`);
  }
};

export const bulkDownload = async (
  documentIds: string[],
): Promise<BulkDownloadResult> => {
  const response = await axiosInstance.post<BulkDownloadResult>(
    '/documents/bulk-download',
    { documentIds },
  );
  return response.data;
};

export const archiveDocument = async (
  documentId: string,
): Promise<{ document: Document }> => {
  const response = await axiosInstance.patch<{ data: Document }>(
    `/documents/${documentId}/archive`,
  );
  return { document: response.data.data };
};

