import { Chip, Button, Stack } from '@mui/material';
import { format } from 'date-fns';
import { ErrorText, Meta } from 'components/Typography';
import type { Invitation } from 'utils/api/team/teamApi';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const getExpiryText = (expiresAt: string): { text: string; isExpired: boolean } => {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { text: 'Expired', isExpired: true };
  }

  const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { text: `in ${days} day${days === 1 ? '' : 's'}`, isExpired: false };
};

export const capitalizeFirst = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

// ---------------------------------------------------------------------------
// Grid context type
// ---------------------------------------------------------------------------

export interface InvitationGridContext {
  onResend: (inviteId: string) => void;
  onRevoke: (inviteId: string) => void;
  loading: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

export const InvitationNameCellRenderer = (params: { data?: Invitation }) => {
  const inv = params.data;
  if (!inv) return null;
  return <span>{`${inv.firstName} ${inv.lastName}`}</span>;
};

export const InvitationEmailCellRenderer = (params: { data?: Invitation }) => {
  const inv = params.data;
  if (!inv) return null;
  return <span>{inv.email}</span>;
};

export const InvitationRoleCellRenderer = (params: { data?: Invitation }) => {
  const inv = params.data;
  if (!inv) return null;
  return <Chip label={capitalizeFirst(inv.role)} size="small" variant="outlined" />;
};

export const InvitationSentCellRenderer = (params: { data?: Invitation }) => {
  const inv = params.data;
  if (!inv) return null;
  return <Meta sx={{ color: 'text.primary' }}>{format(new Date(inv.createdAt), 'MMM d, yyyy')}</Meta>;
};

export const InvitationExpiryCellRenderer = (params: { data?: Invitation }) => {
  const inv = params.data;
  if (!inv) return null;
  const { text, isExpired } = getExpiryText(inv.expiresAt);
  if (isExpired) {
    return <ErrorText>{text}</ErrorText>;
  }
  return <Meta sx={{ color: 'text.primary' }}>{text}</Meta>;
};

interface InvitationActionsCellParams {
  data?: Invitation;
  context?: InvitationGridContext;
}

export const InvitationActionsCellRenderer = (params: InvitationActionsCellParams) => {
  const inv = params.data;
  const ctx = params.context;
  if (!inv || !ctx) return null;

  const isResending = ctx.loading[`resend:${inv.id}`] === 'Pending';
  const isRevoking = ctx.loading[`revoke:${inv.id}`] === 'Pending';
  const isBusy = isResending || isRevoking;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Button
        size="small"
        variant="text"
        onClick={() => ctx.onResend(inv.id)}
        disabled={isBusy}
      >
        Resend
      </Button>
      <Button
        size="small"
        variant="text"
        color="error"
        onClick={() => ctx.onRevoke(inv.id)}
        disabled={isBusy}
      >
        Revoke
      </Button>
    </Stack>
  );
};
