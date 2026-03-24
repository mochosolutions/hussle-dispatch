import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { GridApi, GridReadyEvent } from 'ag-grid-community';
import { NewDataGrid, MainCard } from '@mocho/ui/components';
import { StatusCell } from 'components/Statusbadge';

import { InvoiceReadinessBadge } from '../InvoiceReadinessBadge';
import { formatEquipmentType } from '../../constants';
import type { LoadListItem, LoadStatus } from '../../types';

// ---------------------------------------------------------------------------
// Cell Renderers
// ---------------------------------------------------------------------------

const LoadNumberCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
      {value}
    </Typography>
  </Box>
);

const StatusCellRenderer = ({ value }: { value: LoadStatus }) => (
  <StatusCell status={value} />
);

const RateCellRenderer = ({ value }: { value: string | null }) => {
  if (!value || Number(value) === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.disabled">
          &mdash;
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
        ${Number(value).toLocaleString()}
      </Typography>
    </Box>
  );
};

const InvoiceCellRenderer = ({ value }: { value: string }) => {
  if (!value || value === 'NOT_READY') {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <InvoiceReadinessBadge readiness={value} />
    </Box>
  );
};

const DateCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Typography variant="body2" color="text.disabled">
      {value ? format(new Date(value), 'MM/dd/yyyy') : ''}
    </Typography>
  </Box>
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
  },
  {
    field: 'carrierName',
    headerName: 'Carrier',
    width: 170,
  },
  {
    field: 'customerName',
    headerName: 'Customer',
    width: 170,
  },
  {
    field: 'contactName',
    headerName: 'Contact',
    width: 150,
  },
  {
    field: 'originCity',
    headerName: 'Origin',
    width: 150,
    valueGetter: (params: { data: LoadListItem }) => {
      const { originCity, originState } = params.data;
      return [originCity, originState].filter(Boolean).join(', ') || '\u2014';
    },
  },
  {
    field: 'destinationCity',
    headerName: 'Destination',
    width: 170,
    valueGetter: (params: { data: LoadListItem }) => {
      const { destinationCity, destinationState } = params.data;
      return [destinationCity, destinationState].filter(Boolean).join(', ') || '\u2014';
    },
  },
  {
    field: 'createdAt',
    headerName: 'Created',
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
    field: 'invoiceReadiness',
    headerName: 'Invoice',
    width: 140,
    cellRenderer: InvoiceCellRenderer,
  },
  {
    field: 'equipmentType',
    headerName: 'Equipment',
    width: 130,
    valueFormatter: (params: { value: string | null }) => formatEquipmentType(params.value),
  },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    width: 120,
    cellRenderer: DateCellRenderer,
  },
];

const DEFAULT_COL_DEF = {
  sortable: true,
  resizable: true,
  suppressMovable: false,
};

const COLUMN_VISIBILITY_KEY = 'dispatch-board-columns';

const loadSavedColumnVisibility = (): Record<string, boolean> => {
  try {
    const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (saved) {
      return JSON.parse(saved) as Record<string, boolean>;
    }
  } catch {
    // Ignore malformed localStorage data
  }
  return {};
};

const saveColumnVisibility = (visibility: Record<string, boolean>): void => {
  localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(visibility));
};

// ---------------------------------------------------------------------------
// Load Table (public export)
// ---------------------------------------------------------------------------

interface LoadTableProps {
  loads: LoadListItem[];
  loading?: boolean;
  totalCount?: number;
}

export const LoadTable: React.FC<LoadTableProps> = ({ loads, loading = false, totalCount }) => {
  const navigate = useNavigate();
  const gridApiRef = useRef<GridApi | null>(null);
  const allColumnDefs = useMemo(() => buildColumnDefs(), []);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const saved = loadSavedColumnVisibility();
    const defaults: Record<string, boolean> = {};
    allColumnDefs.forEach((col) => {
      defaults[col.field] = saved[col.field] ?? true;
    });
    return defaults;
  });

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleOpenColumnPicker = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseColumnPicker = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleToggleColumn = useCallback((field: string) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [field]: !prev[field] };
      saveColumnVisibility(updated);
      return updated;
    });
  }, []);

  const columnDefs = useMemo(
    () => allColumnDefs.filter((col) => columnVisibility[col.field] !== false),
    [allColumnDefs, columnVisibility],
  );

  const handleGridReady = useCallback((params: GridReadyEvent) => {
    gridApiRef.current = params.api;
  }, []);

  const handleExport = useCallback(() => {
    gridApiRef.current?.exportDataAsCsv({ fileName: 'loads-export.csv' });
  }, []);

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
      onGridReady: handleGridReady,
    }),
    [handleRowClicked, handleGridReady],
  );

  return (
    <MainCard
      content={false}
      sx={{
        flex: 1,
        display: 'flex',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: 1, pt: 0.5 }}>
        <Tooltip title="Export CSV">
          <span>
            <IconButton
              size="small"
              onClick={handleExport}
              disabled={loads.length === 0}
              aria-label="Export CSV"
            >
              <FileDownloadOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton
          size="small"
          onClick={handleOpenColumnPicker}
          aria-label="Toggle column visibility"
        >
          <ViewColumnIcon fontSize="small" />
        </IconButton>
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleCloseColumnPicker}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Stack sx={{ p: 2, minWidth: 200 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Columns
            </Typography>
            {allColumnDefs.map((col) => (
              <FormControlLabel
                key={col.field}
                control={
                  <Checkbox
                    size="small"
                    checked={columnVisibility[col.field] !== false}
                    onChange={() => handleToggleColumn(col.field)}
                  />
                }
                label={
                  <Typography variant="body2">{col.headerName}</Typography>
                }
              />
            ))}
          </Stack>
        </Popover>
      </Box>
      <Box sx={{ flex: 1, display: 'flex' }}>
        <Box
          sx={{
            display: 'flex',
            minHeight: { xs: 300, md: 420 },
            flex: 1,
          }}
        >
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
      </Box>
    </MainCard>
  );
};
