import { Button, Link, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import SectionCard from 'components/SectionCard';
import { DetailRow } from 'components/Typography';
import type { LoadDetail } from '../../../types';

interface BrokerCardProps {
  contact: LoadDetail['contact'];
  externalRefNumber: string | null;
  onEdit: () => void;
}

export const BrokerCard: React.FC<BrokerCardProps> = ({ contact, externalRefNumber, onEdit }) => {
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <PersonAddOutlinedIcon sx={{ fontSize: 18 }} />
          No contact added
        </Typography>
      </SectionCard>
    );
  }

  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(' ');

  return (
    <SectionCard
      title="Contact"
      // contentSX={{ p: 0 }}
      actions={
        <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
          Edit
        </Button>
      }
    >
      {name && <DetailRow label="Name" value={name} />}
      <DetailRow label="Ref #" value={externalRefNumber ?? '\u2014'} />
      {contact?.role && <DetailRow label="Role" value={contact.role} />}
      {contact?.phone && (
        <DetailRow
          label="Phone"
          value={
            <Link href={`tel:${contact.phone}`} sx={{ fontWeight: 600, textDecoration: 'none' }}>
              {contact.phone}
            </Link>
          }
        />
      )}
      {contact?.email && (
        <DetailRow
          label="Email"
          value={
            <Link href={`mailto:${contact.email}`} sx={{ fontWeight: 600, textDecoration: 'none' }}>
              {contact.email}
            </Link>
          }
          noBorder
        />
      )}
    </SectionCard>
  );
};
