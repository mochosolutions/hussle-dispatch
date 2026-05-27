import type {
  ArchiveDocumentInput,
  BulkDownloadInput,
  BulkDownloadResult,
  ConfirmInput,
  DocumentWithUploader,
  DownloadDocumentInput,
  GetDocumentInput,
  ListDocumentsInput,
  PresignInput,
  PresignResult,
} from './documentTypes';

export interface DocumentService {
  presign(input: PresignInput): Promise<PresignResult>;
  confirm(input: ConfirmInput): Promise<DocumentWithUploader>;
  list(input: ListDocumentsInput): Promise<DocumentWithUploader[]>;
  getById(input: GetDocumentInput): Promise<DocumentWithUploader>;
  getDownloadUrl(input: DownloadDocumentInput): Promise<string>;
  archive(input: ArchiveDocumentInput): Promise<DocumentWithUploader>;
  bulkDownload(input: BulkDownloadInput): Promise<BulkDownloadResult>;
}
