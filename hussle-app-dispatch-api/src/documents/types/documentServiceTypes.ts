import type { Document } from '@prisma/client';
import type {
  ArchiveDocumentInput,
  BulkDownloadInput,
  BulkDownloadResult,
  ConfirmInput,
  DownloadDocumentInput,
  GetDocumentInput,
  ListDocumentsInput,
  PresignInput,
  PresignResult,
} from './documentTypes';

export interface DocumentService {
  presign(input: PresignInput): Promise<PresignResult>;
  confirm(input: ConfirmInput): Promise<Document>;
  list(input: ListDocumentsInput): Promise<Document[]>;
  getById(input: GetDocumentInput): Promise<Document>;
  getDownloadUrl(input: DownloadDocumentInput): Promise<string>;
  archive(input: ArchiveDocumentInput): Promise<Document>;
  bulkDownload(input: BulkDownloadInput): Promise<BulkDownloadResult>;
}
