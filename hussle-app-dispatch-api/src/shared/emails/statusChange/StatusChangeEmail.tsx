import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import DataTable from '../shared/DataTable';
import { textBody } from '../shared/emailStyles';
import type { StatusChangeEmailData } from './renderStatusChangeEmail';

const StatusChangeEmail = ({
  loadNumber,
  fromStatus,
  toStatus,
  trackingUrl,
}: StatusChangeEmailData) => {
  const rows = [];
  if (fromStatus) {
    rows.push({ label: 'Previous Status', value: fromStatus });
  }
  rows.push({ label: 'New Status', value: toStatus, highlight: true });

  return (
    <EmailLayout
      preview={`Load ${loadNumber} status changed to ${toStatus}`}
      headerTitle="Load Status Update"
      headerSubtitle={`Load ${loadNumber}`}
    >
      <Text style={textBody}>The status of your load has been updated.</Text>

      <DataTable rows={rows} />

      {trackingUrl ? <CtaButton href={trackingUrl}>View live tracking</CtaButton> : null}
    </EmailLayout>
  );
};

export default StatusChangeEmail;
