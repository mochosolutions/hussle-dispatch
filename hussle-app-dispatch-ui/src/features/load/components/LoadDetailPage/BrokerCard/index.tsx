import { Button, Link } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SectionCard from 'components/SectionCard';
import { DetailRow, Meta } from 'components/Typography';
import type { LoadDetail } from '../../../types';

interface BrokerCardProps {
  customer: LoadDetail['customer'];
  contact: LoadDetail['contact'];
  externalRefNumber: string | null;
  onEdit: () => void;
}

export const BrokerCard: React.FC<BrokerCardProps> = ({
  contact,
  externalRefNumber,
  onEdit,
  customer,
}) => {
  const isEmpty = !contact && !externalRefNumber;

  if (isEmpty) {
    return (
      <SectionCard
        title="Contact"
        actions={
          <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
            Edit
          </Button>
        }
      >
        <Meta sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddOutlinedIcon sx={{ fontSize: 18 }} />
          No contact added
        </Meta>
      </SectionCard>
    );
  }

  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ');

  return (
    <SectionCard
      title="Customer"
      actions={
        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
          Edit
        </Button>
      }
    >
      <DetailRow label="Company" value={customer?.companyName} />
      <DetailRow label="Name" value={name ? name : '-'} />
      <DetailRow label="Ref #" value={externalRefNumber ?? '\u2014'} />
      <DetailRow label="Role" value={contact?.role ? contact.role : '-'} />

      <DetailRow
        label="Phone"
        value={
          contact?.phone ? (
            <Link href={`tel:${contact.phone}`} sx={{ fontWeight: 600, textDecoration: 'none' }}>
              {contact.phone}
            </Link>
          ) : (
            '-'
          )
        }
      />

      <DetailRow
        label="Email"
        value={
          contact?.email ? (
            <Link
              href={`mailto:${contact?.email}`}
              sx={{ fontWeight: 600, textDecoration: 'none' }}
            >
              {contact?.email}
            </Link>
          ) : (
            '-'
          )
        }
        noBorder
      />
      {/* {contact?.email && (
        <DetailRow
          label="Email"
          value={
            <Link href={`mailto:${contact.email}`} sx={{ fontWeight: 600, textDecoration: 'none' }}>
              {contact.email}
            </Link>
          }
          noBorder
        />
      )} */}
    </SectionCard>
  );
};
