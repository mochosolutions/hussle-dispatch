import React, { useMemo, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { NewDataGrid } from '@mocho/ui/components';
import { STATUS_LABELS, STATUS_COLORS } from '../../constants';
import type { LoadListItem, LoadStatus } from '../../types';

// ---------------------------------------------------------------------------
// Cell Renderers
// ---------------------------------------------------------------------------

const LoadNumberCellRenderer = ({ value }: { value: string }) => (
  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
    {value}
  </Typography>
);

const StatusCellRenderer = ({ value }: { value: LoadStatus }) => {
  const label = STATUS_LABELS[value] ?? value;
  const color = STATUS_COLORS[value] ?? 'text.secondary';

  return (
    <Chip
      label={label}
      size="small"
      variant="outlined"
      sx={{
        fontWeight: 600,
        fontSize: '0.6875rem',
        height: 22,
        color,
        borderColor: color,
      }}
    />
  );
};

const RateCellRenderer = ({ value }: { value: string | null }) => {
  if (!value) {
    return <Typography variant="body2" color="text.disabled">&mdash;</Typography>;
  }

  return (
    <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
      ${Number(value).toLocaleString()}
    </Typography>
  );
};

const DateCellRenderer = ({ value }: { value: string }) => (
  <Typography variant="body2" color="text.disabled">
    {value ? new Date(value).toLocaleDateString() : ''}
  </Typography>
);

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const buildColumnDefs = () => [
  {
    field: 'loadNumber',
    headerName: 'Load #',
    width: 160,
    sort: 'desc' as const,
    cellRenderer: LoadNumberCellRenderer,
    pinned: 'left' as const,
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 160,
    cellRenderer: StatusCellRenderer,
    filter: true,
  },
  {
    field: 'carrierName',
    headerName: 'Carrier',
    width: 170,
    filter: true,
  },
  {
    field: 'originCity',
    headerName: 'Origin',
    width: 150,
    valueGetter: (params: { data: LoadListItem }) => {
      const { originCity, originState } = params.data;
      return [originCity, originState].filter(Boolean).join(', ') || '\u2014';
    },
    filter: true,
  },
  {
    field: 'destinationCity',
    headerName: 'Destination',
    width: 170,
    valueGetter: (params: { data: LoadListItem }) => {
      const { destinationCity, destinationState } = params.data;
      return [destinationCity, destinationState].filter(Boolean).join(', ') || '\u2014';
    },
    filter: true,
  },
  {
    field: 'createdAt',
    headerName: 'Pickup Date',
    width: 120,
    cellRenderer: DateCellRenderer,
  },
  {
    field: 'carrierRate',
    headerName: 'Rate',
    width: 110,
    cellRenderer: RateCellRenderer,
    type: 'numericColumn' as const,
  },
  {
    field: 'equipmentType',
    headerName: 'Equipment',
    width: 130,
    filter: true,
  },
  {
    field: 'updatedAt',
    headerName: 'Created',
    width: 120,
    cellRenderer: DateCellRenderer,
  },
];

const DEFAULT_COL_DEF = {
  sortable: true,
  resizable: true,
  suppressMovable: false,
};

// ---------------------------------------------------------------------------
// Load Table (public export)
// ---------------------------------------------------------------------------

interface LoadTableProps {
  loads: LoadListItem[];
  loading?: boolean;
  totalCount?: number;
}

export const LoadTable: React.FC<LoadTableProps> = ({
  loads,
  loading = false,
  totalCount,
}) => {
  const navigate = useNavigate();

  const columnDefs = useMemo(() => buildColumnDefs(), []);

  const handleRowClicked = useCallback(
    (event: { data?: LoadListItem }) => {
      if (event.data) {
        navigate(`/loads/${event.data.id}`);
      }
    },
    [navigate],
  );

  const gridOptions = useMemo(
    () => ({
      rowHeight: 48,
      headerHeight: 40,
      animateRows: true,
      rowSelection: 'single' as const,
      suppressCellFocus: true,
      pagination: true,
      paginationPageSize: 25,
      onRowClicked: handleRowClicked,
    }),
    [handleRowClicked],
  );

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <NewDataGrid
        columnDefs={columnDefs}
        rowData={loads}
        defaultColDef={DEFAULT_COL_DEF}
        gridOptions={gridOptions}
        loading={loading}
        noDataMessage="No loads match your filters"
        showRowCountFooter
        totalRowCount={totalCount ?? loads.length}
        rowCountLabel="loads"
      />
    </Box>
  );
};
