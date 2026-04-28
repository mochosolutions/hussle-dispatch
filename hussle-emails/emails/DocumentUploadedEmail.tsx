import DocumentUploadedEmail from '../src/documentUploaded/DocumentUploadedEmail';
import type { DocumentUploadedEmailData } from '../src/documentUploaded/renderDocumentUploadedEmail';

DocumentUploadedEmail.PreviewProps = {
  loadNumber: 'LD-1087',
  documentType: 'Bill of Lading',
  trackingUrl: 'https://track.example.com/LD-1087',
} satisfies DocumentUploadedEmailData;

export default DocumentUploadedEmail;
