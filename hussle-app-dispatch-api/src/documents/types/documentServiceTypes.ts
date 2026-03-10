import type { Document } from '@prisma/client';
import type { ConfirmInput, ListDocumentsInput, PresignInput, PresignResult } from './documentTypes';

export interface DocumentService {
  presign(input: PresignInput): Promise<PresignResult>;
  confirm(input: ConfirmInput): Promise<Document>;
  list(input: ListDocumentsInput): Promise<Document[]>;
}
