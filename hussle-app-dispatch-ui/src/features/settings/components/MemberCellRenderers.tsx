import { MenuItem, Select, Button } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { TwoLineCell, BodyMuted } from 'components/Typography';
import type { Member } from 'utils/api/team/teamApi';

// ---------------------------------------------------------------------------
// Grid context type
// ---------------------------------------------------------------------------

export interface MemberGridContext {
  onRoleChange: (membershipId: string, role: string) => void;
  onRemove: (member: Member) => void;
  currentUserId: string | undefined;
}

// ---------------------------------------------------------------------------
// Role options
// ---------------------------------------------------------------------------

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'driver', label: 'Driver' },
];

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

export const MemberNameCellRenderer = (params: { data?: Member }) => {
  const member = params.data;
  if (!member) return null;
  const fullName = `${member.user.firstName} ${member.user.lastName}`.trim();
  return <TwoLineCell primary={fullName} secondary={member.user.email} />;
};

interface MemberRoleCellParams {
  data?: Member;
  context?: MemberGridContext;
}

export const MemberRoleCellRenderer = (params: MemberRoleCellParams) => {
  const member = params.data;
  const ctx = params.context;
  if (!member || !ctx) return null;

  const handleChange = (event: SelectChangeEvent<string>) => {
    ctx.onRoleChange(member.id, event.target.value);
  };

  return (
    <Select size="small" value={member.role} onChange={handleChange} sx={{ minWidth: 120 }}>
      {ROLE_OPTIONS.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export const MemberJoinedCellRenderer = (params: { data?: Member }) => {
  const member = params.data;
  if (!member) return null;
  return <BodyMuted>{format(new Date(member.createdAt), 'MMM d, yyyy')}</BodyMuted>;
};

interface MemberActionsCellParams {
  data?: Member;
  context?: MemberGridContext;
}

export const MemberActionsCellRenderer = (params: MemberActionsCellParams) => {
  const member = params.data;
  const ctx = params.context;
  if (!member || !ctx) return null;

  const isCurrentUser = member.userId === ctx.currentUserId;
  if (isCurrentUser) return null;

  return (
    <Button
      variant="text"
      color="inherit"
      size="small"
      onClick={() => ctx.onRemove(member)}
    >
      Remove
    </Button>
  );
};
