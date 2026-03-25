import { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Button,
  Typography,
  Skeleton,
  Box,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'store';
import { currentUserSelector } from 'features/auth/store/selectors/authSelector';
import ConfirmDialog from 'mocho/components/ConfirmDialog';
import {
  changeMemberRoleRequest,
  removeMemberRequest,
} from '../../store/reducers/teamSlice';
import type { Member } from 'utils/api/team/teamApi';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'driver', label: 'Driver' },
];

interface MemberTableProps {
  members: Member[];
  loading: boolean;
  organizationId: string;
}

const SKELETON_ROWS = [0, 1, 2];

const MemberTable: React.FC<MemberTableProps> = ({ members, loading }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(currentUserSelector);
  const currentUserId = currentUser?.id;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const handleRoleChange = useCallback(
    (membershipId: string) => (event: SelectChangeEvent<string>) => {
      dispatch(changeMemberRoleRequest({ membershipId, role: event.target.value }));
    },
    [dispatch],
  );

  const handleRemoveClick = useCallback((member: Member) => {
    setMemberToRemove(member);
    setConfirmOpen(true);
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (memberToRemove) {
      dispatch(removeMemberRequest({ membershipId: memberToRemove.id }));
    }
    setConfirmOpen(false);
    setMemberToRemove(null);
  }, [dispatch, memberToRemove]);

  const handleCloseConfirm = useCallback(() => {
    setConfirmOpen(false);
    setMemberToRemove(null);
  }, []);

  const removeName = memberToRemove
    ? `${memberToRemove.user.firstName} ${memberToRemove.user.lastName}`.trim()
    : '';

  if (loading) {
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">Name</TableCell>
              <TableCell width="25%">Role</TableCell>
              <TableCell width="20%">Joined</TableCell>
              <TableCell width="25%">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {SKELETON_ROWS.map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <Skeleton variant="rectangular" height={48} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" height={48} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" height={48} />
                </TableCell>
                <TableCell>
                  <Skeleton variant="rectangular" height={48} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="30%">Name</TableCell>
              <TableCell width="25%">Role</TableCell>
              <TableCell width="20%">Joined</TableCell>
              <TableCell width="25%">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => {
              const fullName = `${member.user.firstName} ${member.user.lastName}`.trim();
              const isCurrentUser = member.userId === currentUserId;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.user.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={member.role}
                      onChange={handleRoleChange(member.id)}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(member.createdAt), 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser && (
                      <Button
                        variant="text"
                        color="inherit"
                        size="small"
                        onClick={() => handleRemoveClick(member)}
                      >
                        Remove
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmRemove}
        title={`Remove ${removeName}?`}
        content="They will lose access immediately. This action cannot be undone."
        confirmText="Remove"
        severity="error"
      />
    </>
  );
};

export default MemberTable;
