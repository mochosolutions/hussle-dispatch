import { render } from '@react-email/components';
import DocumentUploadedEmail from './DocumentUploadedEmail';

export interface DocumentUploadedEmailData {
  loadNumber: string;
  documentType: string;
  trackingUrl: string | null;
}

export const renderDocumentUploadedEmail = async (
  data: DocumentUploadedEmailData,
): Promise<{ subject: string; html: string }> => ({
  subject: `Load ${data.loadNumber} — Document uploaded: ${data.documentType}`,
  html: await render(DocumentUploadedEmail(data)),
});
