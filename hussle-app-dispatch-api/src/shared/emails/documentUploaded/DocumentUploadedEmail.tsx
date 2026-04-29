import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import DataTable from '../shared/DataTable';
import { textBody } from '../shared/emailStyles';
import type { DocumentUploadedEmailData } from './renderDocumentUploadedEmail';

const DocumentUploadedEmail = ({
  loadNumber,
  documentType,
  trackingUrl,
}: DocumentUploadedEmailData) => {
  const rows = [{ label: 'Document Type', value: documentType, highlight: true }];

  return (
    <EmailLayout
      preview={`Document uploaded for load ${loadNumber}`}
      headerTitle="Document Uploaded"
      headerSubtitle={`Load ${loadNumber}`}
    >
      <Text style={textBody}>A document has been uploaded for your load.</Text>

      <DataTable rows={rows} />

      {trackingUrl ? <CtaButton href={trackingUrl}>View live tracking</CtaButton> : null}
    </EmailLayout>
  );
};

export default DocumentUploadedEmail;
