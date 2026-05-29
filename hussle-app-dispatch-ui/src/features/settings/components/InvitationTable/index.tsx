import { useCallback, useMemo } from 'react';
import { NewDataGrid } from '@mocho/ui/components';
import { EmptyState } from 'mocho/components/EmptyState';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import type { Invitation } from 'utils/api/team/teamApi';
import {
  revokeInvitationRequest,
  resendInvitationRequest,
} from '../../store/reducers/teamSlice';
import {
  InvitationNameCellRenderer,
  InvitationEmailCellRenderer,
  InvitationRoleCellRenderer,
  InvitationSentCellRenderer,
  InvitationExpiryCellRenderer,
  InvitationActionsCellRenderer,
} from '../InvitationCellRenderers';
import type { InvitationGridContext } from '../InvitationCellRenderers';

interface InvitationTableProps {
  invitations: Invitation[];
}

const defaultColDef = {
  flex: 1,
  minWidth: 100,
  sortable: true,
  resizable: true,
  filter: false,
};

export const InvitationTable: React.FC<InvitationTableProps> = ({ invitations }) => {
  const dispatch = useDispatch();
  const loading = useSelector((state: RootState) => state.pages.team?.loading ?? {});

  const handleResend = useCallback(
    (inviteId: string) => {
      dispatch(resendInvitationRequest({ inviteId }));
    },
    [dispatch],
  );

  const handleRevoke = useCallback(
    (inviteId: string) => {
      dispatch(revokeInvitationRequest({ inviteId }));
    },
    [dispatch],
  );

  const gridContext = useMemo<InvitationGridContext>(
    () => ({
      onResend: handleResend,
      onRevoke: handleRevoke,
      loading,
    }),
    [handleResend, handleRevoke, loading],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        minWidth: 150,
        flex: 1.2,
        cellRenderer: InvitationNameCellRenderer,
      },
      {
        headerName: 'Email',
        field: 'email' as const,
        minWidth: 180,
        flex: 1.5,
        cellRenderer: InvitationEmailCellRenderer,
      },
      {
        headerName: 'Role',
        field: 'role' as const,
        minWidth: 120,
        flex: 0.8,
        cellRenderer: InvitationRoleCellRenderer,
      },
      {
        headerName: 'Sent',
        field: 'createdAt' as const,
        minWidth: 130,
        flex: 0.9,
        cellRenderer: InvitationSentCellRenderer,
      },
      {
        headerName: 'Expires',
        field: 'expiresAt' as const,
        minWidth: 120,
        flex: 0.9,
        cellRenderer: InvitationExpiryCellRenderer,
      },
      {
        headerName: 'Actions',
        minWidth: 160,
        maxWidth: 200,
        sortable: false,
        cellRenderer: InvitationActionsCellRenderer,
      },
    ],
    [],
  );

  return (
    <NewDataGrid
      columnDefs={columnDefs}
      rowData={invitations}
      defaultColDef={defaultColDef}
      showRowCountFooter
      totalRowCount={invitations.length}
      rowCountLabel="invitations"
      noDataComponent={<EmptyState variant="no-results" entityName="Invitation" compact />}
      gridOptions={{
        domLayout: 'autoHeight',
        pagination: true,
        paginationPageSize: 25,
        suppressCellFocus: true,
        headerHeight: 44,
        rowHeight: 56,
        context: gridContext,
      }}
    />
  );
};
