import { useState, useCallback, useMemo } from 'react';
import { NewDataGrid } from '@mocho/ui/components';
import { EmptyState } from 'mocho/components/EmptyState';
import ConfirmDialog from 'mocho/components/ConfirmDialog';
import { useDispatch, useSelector } from 'store';
import { currentUserSelector } from 'features/auth/store/selectors/authSelector';
import type { Member } from 'utils/api/team/teamApi';
import {
  changeMemberRoleRequest,
  removeMemberRequest,
} from '../../store/reducers/teamSlice';
import {
  MemberNameCellRenderer,
  MemberRoleCellRenderer,
  MemberJoinedCellRenderer,
  MemberActionsCellRenderer,
} from '../MemberCellRenderers';
import type { MemberGridContext } from '../MemberCellRenderers';

interface MemberTableProps {
  members: Member[];
  loading: boolean;
  organizationId: string;
}

const defaultColDef = {
  flex: 1,
  minWidth: 100,
  sortable: true,
  resizable: true,
  filter: false,
};

const MemberTable: React.FC<MemberTableProps> = ({ members, loading }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(currentUserSelector);
  const currentUserId = currentUser?.id;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  const handleRoleChange = useCallback(
    (membershipId: string, role: string) => {
      dispatch(changeMemberRoleRequest({ membershipId, role }));
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

  const gridContext = useMemo<MemberGridContext>(
    () => ({
      onRoleChange: handleRoleChange,
      onRemove: handleRemoveClick,
      currentUserId,
    }),
    [handleRoleChange, handleRemoveClick, currentUserId],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        minWidth: 200,
        flex: 1.5,
        cellRenderer: MemberNameCellRenderer,
      },
      {
        headerName: 'Role',
        field: 'role' as const,
        minWidth: 160,
        flex: 1,
        cellRenderer: MemberRoleCellRenderer,
      },
      {
        headerName: 'Joined',
        field: 'createdAt' as const,
        minWidth: 140,
        flex: 1,
        cellRenderer: MemberJoinedCellRenderer,
      },
      {
        headerName: 'Actions',
        minWidth: 120,
        maxWidth: 140,
        sortable: false,
        cellRenderer: MemberActionsCellRenderer,
      },
    ],
    [],
  );

  const removeName = memberToRemove
    ? `${memberToRemove.user.firstName} ${memberToRemove.user.lastName}`.trim()
    : '';

  return (
    <>
      <NewDataGrid
        columnDefs={columnDefs}
        rowData={members}
        defaultColDef={defaultColDef}
        showRowCountFooter
        totalRowCount={members.length}
        rowCountLabel="members"
        noDataComponent={<EmptyState variant="no-results" entityName="Member" compact />}
        gridOptions={{
          domLayout: 'autoHeight',
          pagination: true,
          paginationPageSize: 25,
          suppressCellFocus: true,
          headerHeight: 44,
          rowHeight: 56,
          context: gridContext,
        }}
        loading={loading}
      />

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
