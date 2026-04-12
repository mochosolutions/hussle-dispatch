import { Text } from '@react-email/components';
import EmailLayout from '../layout/EmailLayout';
import DataTable from '../shared/DataTable';
import { textBody } from '../shared/emailStyles';
import type { SettlementEmailData } from './renderSettlementEmail';

const SettlementEmail = ({
  settlementNumber,
  periodStart,
  periodEnd,
  recipientName,
  netEarnings,
}: SettlementEmailData) => (
  <EmailLayout
    preview={`Settlement ${settlementNumber} — ${periodStart} to ${periodEnd}`}
    headerTitle={`Settlement ${settlementNumber}`}
    headerSubtitle={`${periodStart} — ${periodEnd}`}
  >
    <Text style={textBody}>
      Your settlement statement is ready. The settlement document is attached to this email.
    </Text>

    <DataTable
      rows={[
        { label: 'Recipient', value: recipientName },
        { label: 'Period', value: `${periodStart} — ${periodEnd}` },
        { label: 'Net Earnings', value: netEarnings },
      ]}
    />
  </EmailLayout>
);

export default SettlementEmail;
