import { Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Body, BodyStrong } from 'components/Typography';
import type { Contact } from '../../types';

interface ContactWithCustomer extends Contact {
  customer?: { companyName?: string } | null;
}

const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.charAt(0) ?? '';
  const last = lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
};

export const ContactNameCellRenderer = (params: { data?: Contact }) => {
  const c = params.data;
  if (!c) return null;
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ');
  const initials = getInitials(c.firstName, c.lastName);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {initials}
      </Box>
      <Box>
        <BodyStrong>{fullName}</BodyStrong>
      </Box>
    </Box>
  );
};

export const RoleCellRenderer = (params: { value?: string | null }) => {
  if (!params.value) return null;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'grey.100',
        color: 'text.secondary',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
        textTransform: 'capitalize',
      }}
    >
      {params.value}
    </Box>
  );
};

export const PhoneCellRenderer = (params: { value?: string | null }) => {
  const theme = useTheme();
  if (!params.value) return null;
  return (
    <a
      href={`tel:${params.value}`}
      style={{
        color: theme.palette.primary.main,
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {params.value}
    </a>
  );
};

export const EmailCellRenderer = (params: { value?: string | null }) => {
  const theme = useTheme();
  if (!params.value) return null;
  return (
    <a
      href={`mailto:${params.value}`}
      style={{
        color: theme.palette.primary.main,
        textDecoration: 'none',
      }}
    >
      {params.value}
    </a>
  );
};

export const CustomerCellRenderer = (params: { data?: ContactWithCustomer }) => {
  const contact = params.data;
  if (!contact) return null;

  const companyName = contact.customer?.companyName;

  if (companyName) {
    return <Body sx={{ fontWeight: 500 }}>{companyName}</Body>;
  }

  return (
    <Chip
      label="Independent"
      size="small"
      sx={{
        bgcolor: 'grey.200',
        color: 'text.secondary',
        fontSize: '0.7rem',
        fontWeight: 600,
        height: 22,
      }}
    />
  );
};
