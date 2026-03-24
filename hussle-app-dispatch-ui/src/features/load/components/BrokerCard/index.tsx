import { Link } from '@mui/material';
import SectionCard from 'components/SectionCard';
import { DetailRow } from 'components/Typography';
import type { LoadDetail } from '../../types';

interface BrokerCardProps {
  contact: LoadDetail['contact'];
  externalRefNumber: string | null;
}

export const BrokerCard: React.FC<BrokerCardProps> = ({ contact, externalRefNumber }) => {
  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || '\u2014';
  const hasEmail = Boolean(contact?.email);

  return (
    <SectionCard title="Contact" contentSX={{ p: 0 }}>
      <DetailRow label="Name" value={name} />
      <DetailRow label="Ref #" value={externalRefNumber ?? '\u2014'} />
      {contact?.role && <DetailRow label="Role" value={contact.role} />}
      <DetailRow
        label="Phone"
        value={
          contact?.phone ? (
            <Link href={`tel:${contact.phone}`} sx={{ fontWeight: 600, textDecoration: 'none' }}>
              {contact.phone}
            </Link>
          ) : (
            '\u2014'
          )
        }
        noBorder={!hasEmail}
      />
      {hasEmail && (
        <DetailRow
          label="Email"
          value={
            <Link
              href={`mailto:${contact?.email}`}
              sx={{ fontWeight: 600, textDecoration: 'none' }}
            >
              {contact?.email}
            </Link>
          }
          noBorder
        />
      )}
    </SectionCard>
  );
};
