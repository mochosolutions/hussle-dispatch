import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ActionsCell, MainCard, NewDataGrid } from '@mocho/ui/components';
import type { ActionsCellConfig } from 'mocho/components/DataGrid/ActionsCell';
import { EmptyState } from 'mocho/components/EmptyState/EmptyState';
import { formatEquipmentType } from 'features/load/constants';
import type { LoadListItem } from 'features/load/types';
import {
  LoadNumberCellRenderer,
  StatusCellRenderer,
  StopsCellRenderer,
  RateCellRenderer,
  AssignmentCellRenderer,
} from './LoadCellRenderers';

interface LoadTableProps {
  loads: LoadListItem[];
  loading?: boolean;
  totalCount?: number;
}

const DEFAULT_COL_DEF = {
  sortable: true,
  resizable: true,
  suppressMovable: false,
};

export const LoadTable: React.FC<LoadTableProps> = ({ loads, loading = false, totalCount }) => {
  const navigate = useNavigate();

  const actionsConfig = useMemo<ActionsCellConfig<LoadListItem>>(
    () => ({
      showView: true,
      showEdit: false,
      showDelete: false,
      getViewRoute: (load) => `/loads/${load.id}`,
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        minWidth: 140,
        cellRenderer: StatusCellRenderer,
      },
      {
        field: 'loadNumber',
        headerName: 'Load #',
        flex: 1,
        minWidth: 100,
        cellRenderer: LoadNumberCellRenderer,
      },
      {
        field: 'route',
        headerName: 'Stops',
        flex: 2,
        minWidth: 300,
        cellRenderer: StopsCellRenderer,
      },
      {
        field: 'assignment',
        headerName: 'Assignment',
        flex: 1,
        minWidth: 150,
        cellRenderer: AssignmentCellRenderer,
      },
      {
        field: 'customer.contactName',
        headerName: 'Contact',
        flex: 1,
        minWidth: 120,
        valueGetter: (params: { data: LoadListItem }) => params.data.customer.contactName ?? '',
      },
      {
        field: 'financials.carrierPayout',
        headerName: 'Rate',
        flex: 1,
        minWidth: 100,
        cellRenderer: RateCellRenderer,
        valueGetter: (params: { data: LoadListItem }) =>
          params.data.financials.carrierPayout ?? null,
      },
      {
        field: 'equipmentType',
        headerName: 'Equipment',
        flex: 1,
        minWidth: 120,
        valueFormatter: (params: { value: string | null }) => formatEquipmentType(params.value),
      },
      {
        headerName: '',
        field: 'actions',
        minWidth: 80,
        maxWidth: 100,
        sortable: false,
        cellRenderer: ActionsCell,
        cellRendererParams: { config: actionsConfig },
      },
    ],
    [actionsConfig],
  );

  const handleRowClicked = useMemo(
    () => (event: { data?: LoadListItem }) => {
      if (event.data) {
        navigate(`/loads/${event.data.id}`);
      }
    },
    [navigate],
  );

  return (
    <MainCard
      content={false}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <Box
          sx={{
            minHeight: { xs: 300, md: 420 },
            flex: 1,
          }}
        >
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={loads}
            defaultColDef={DEFAULT_COL_DEF}
            loading={loading}
            noDataMessage="No loads match your filters"
            noDataComponent={<EmptyState variant="no-results" entityName="Loads" compact />}
            showRowCountFooter
            totalRowCount={totalCount ?? loads.length}
            rowCountLabel="loads"
            gridOptions={{
              domLayout: 'normal',
              pagination: true,
              paginationPageSize: 25,
              suppressCellFocus: true,
              headerHeight: 44,
              rowHeight: 56,
              onRowClicked: handleRowClicked,
            }}
          />
        </Box>
      </Box>
    </MainCard>
  );
};
