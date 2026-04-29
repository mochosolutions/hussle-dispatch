import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import CtaButton from '../shared/CtaButton';
import DataTable from '../shared/DataTable';
import { textBody } from '../shared/emailStyles';
import type { CheckCallEmailData } from './renderCheckCallEmail';

const CheckCallEmail = ({
  loadNumber,
  location,
  status,
  eta,
  trackingUrl,
}: CheckCallEmailData) => {
  const rows: Array<{ label: string; value: string }> = [];
  if (location) {
    rows.push({ label: 'Location', value: location });
  }
  if (status) {
    rows.push({ label: 'Status', value: status });
  }
  if (eta) {
    rows.push({ label: 'ETA', value: eta });
  }

  return (
    <EmailLayout
      preview={`Check call update for Load ${loadNumber}`}
      headerTitle="Check Call Update"
      headerSubtitle={`Load ${loadNumber}`}
    >
      <Text style={textBody}>Here is the latest check call update for your load.</Text>

      {rows.length > 0 ? <DataTable rows={rows} /> : null}

      {trackingUrl ? <CtaButton href={trackingUrl}>View live tracking</CtaButton> : null}
    </EmailLayout>
  );
};

export default CheckCallEmail;
