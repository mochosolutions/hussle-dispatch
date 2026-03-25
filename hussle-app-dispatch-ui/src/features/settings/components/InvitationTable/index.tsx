import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';

import type { Invitation } from 'utils/api/team/teamApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getExpiryText = (expiresAt: string): { text: string; isExpired: boolean } => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true };
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { text: `in ${days} day${days === 1 ? '' : 's'}`, isExpired: false };
};

const capitalizeFirst = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InvitationTableProps {
  invitations: Invitation[];
}

export const InvitationTable: React.FC<InvitationTableProps> = ({ invitations }) => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell sx={{ width: '30%' }}>Name</TableCell>
          <TableCell sx={{ width: '30%' }}>Email</TableCell>
          <TableCell sx={{ width: '15%' }}>Role</TableCell>
          <TableCell sx={{ width: '15%' }}>Sent</TableCell>
          <TableCell sx={{ width: '10%' }}>Expires</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {invitations.map((invitation) => {
          const { text, isExpired } = getExpiryText(invitation.expiresAt);
          const formattedSent = format(new Date(invitation.createdAt), 'MMM d, yyyy');

          return (
            <TableRow key={invitation.id}>
              <TableCell>{`${invitation.firstName} ${invitation.lastName}`}</TableCell>
              <TableCell>{invitation.email}</TableCell>
              <TableCell>
                <Chip label={capitalizeFirst(invitation.role)} size="small" variant="outlined" />
              </TableCell>
              <TableCell>{formattedSent}</TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={isExpired ? { color: 'error.main' } : undefined}
                >
                  {text}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);
