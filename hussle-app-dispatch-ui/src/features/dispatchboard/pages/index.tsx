// DispatchBoardPage.tsx
// Uses @mocho/ui components: NewDataGrid (AG Grid), MainCard, PageHeader, PageWrapper, ActionsCell
// Dependencies: @mocho/ui, @mui/material ^5.18, ag-grid-community, ag-grid-react

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  TextField,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import {
  ActionsCell,
  ActionsCellConfig,
  MainCard,
  NewDataGrid,
  PageHeader,
  PageWrapper,
} from '@mocho/ui/components';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableChartIcon from '@mui/icons-material/TableChart';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';

// ═══════════════════════════════════════════════════════════════════
//  TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════

type LoadStatus =
  | 'Quoted'
  | 'Booked'
  | 'Awaiting Dispatch'
  | 'Dispatched'
  | 'En Route'
  | 'In Transit'
  | 'At Delivery'
  | 'TONU'
  | 'Delivered'
  | 'Awaiting Invoice'
  | 'Invoiced'
  | 'Paid';

interface Load {
  id: string;
  status: LoadStatus;
  carrier: string;
  carrierColor: string;
  origin: string;
  destination: string;
  pickup: string;
  rate: number;
  ratePerMile: number;
  created: string;
  driver: string;
  driverInitials: string;
  miles: number;
}

interface TruckWeekly {
  truckId: string;
  driverName: string;
  gross: number;
  target: number;
  color: string;
  atTarget: boolean;
  underMin: boolean;
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; kanbanCol: string }
> = {
  Quoted: { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', kanbanCol: 'NEW' },
  Booked: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', kanbanCol: 'BOOKED' },
  'Awaiting Dispatch': { color: '#d97706', bg: '#fffbeb', border: '#fde68a', kanbanCol: 'BOOKED' },
  Dispatched: { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', kanbanCol: 'ACTIVE' },
  'En Route': { color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', kanbanCol: 'ACTIVE' },
  'In Transit': { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', kanbanCol: 'ACTIVE' },
  'At Delivery': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', kanbanCol: 'ACTIVE' },
  TONU: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', kanbanCol: 'ISSUES' },
  Delivered: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', kanbanCol: 'DELIVERED' },
  'Awaiting Invoice': {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    kanbanCol: 'DELIVERED',
  },
  Invoiced: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', kanbanCol: 'COMPLETE' },
  Paid: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', kanbanCol: 'COMPLETE' },
};

const KANBAN_COLUMNS = [
  { key: 'NEW', label: 'New' },
  { key: 'BOOKED', label: 'Booked' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'COMPLETE', label: 'Complete' },
  { key: 'ISSUES', label: 'Issues' },
];

// ─── Mock Data ──────────────────────────────────────────────────────
const TRUCKS: TruckWeekly[] = [
  {
    truckId: '#133718',
    driverName: 'Marcus',
    gross: 3850,
    target: 5000,
    color: '#3b82f6',
    atTarget: false,
    underMin: false,
  },
  {
    truckId: '#675600',
    driverName: 'Devon',
    gross: 2900,
    target: 5000,
    color: '#f59e0b',
    atTarget: false,
    underMin: false,
  },
  {
    truckId: '#441205',
    driverName: 'James',
    gross: 5200,
    target: 5000,
    color: '#16a34a',
    atTarget: true,
    underMin: false,
  },
  {
    truckId: '#998877',
    driverName: 'Ray',
    gross: 1800,
    target: 5000,
    color: '#f59e0b',
    atTarget: false,
    underMin: true,
  },
  {
    truckId: '#556644',
    driverName: 'Carlos',
    gross: 3400,
    target: 5000,
    color: '#3b82f6',
    atTarget: false,
    underMin: false,
  },
];

const LOADS: Load[] = [
  {
    id: 'LD-2026-000047',
    status: 'Booked',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Edison, NJ',
    destination: 'Nashville, TN',
    pickup: 'Mar 2',
    rate: 3100,
    ratePerMile: 3.32,
    created: 'Feb 27',
    driver: 'Ray Thompson',
    driverInitials: 'RT',
    miles: 934,
  },
  {
    id: 'LD-2026-000046',
    status: 'Quoted',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Paterson, NJ',
    destination: 'Savannah, GA',
    pickup: 'Mar 3',
    rate: 3200,
    ratePerMile: 3.41,
    created: 'Feb 27',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 938,
  },
  {
    id: 'LD-2026-000045',
    status: 'Quoted',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Elizabeth, NJ',
    destination: 'Raleigh, NC',
    pickup: 'Mar 2',
    rate: 2400,
    ratePerMile: 3.87,
    created: 'Feb 27',
    driver: 'Devon Williams',
    driverInitials: 'DW',
    miles: 620,
  },
  {
    id: 'LD-2026-000044',
    status: 'Awaiting Dispatch',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Bronx, NY',
    destination: 'Greensboro, NC',
    pickup: 'Mar 1',
    rate: 2200,
    ratePerMile: 3.95,
    created: 'Feb 26',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 557,
  },
  {
    id: 'LD-2026-000043',
    status: 'Booked',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Newark, NJ',
    destination: 'Richmond, VA',
    pickup: 'Mar 1',
    rate: 1800,
    ratePerMile: 5.63,
    created: 'Feb 26',
    driver: 'Devon Williams',
    driverInitials: 'DW',
    miles: 320,
  },
  {
    id: 'LD-2026-000041',
    status: 'Dispatched',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Paterson, NJ',
    destination: 'Tampa, FL',
    pickup: 'Feb 28',
    rate: 4200,
    ratePerMile: 3.65,
    created: 'Feb 26',
    driver: 'Devon Williams',
    driverInitials: 'DW',
    miles: 1151,
  },
  {
    id: 'LD-2026-000040',
    status: 'At Delivery',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Jersey City, NJ',
    destination: 'Pittsburgh, PA',
    pickup: 'Feb 26',
    rate: 1200,
    ratePerMile: 3.87,
    created: 'Feb 24',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 310,
  },
  {
    id: 'LD-2026-000039',
    status: 'En Route',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Newark, NJ',
    destination: 'Atlanta, GA',
    pickup: 'Feb 27',
    rate: 3400,
    ratePerMile: 3.91,
    created: 'Feb 25',
    driver: 'James Davis',
    driverInitials: 'JD',
    miles: 870,
  },
  {
    id: 'LD-2026-000038',
    status: 'In Transit',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Edison, NJ',
    destination: 'Charlotte, NC',
    pickup: 'Feb 27',
    rate: 2800,
    ratePerMile: 4.52,
    created: 'Feb 25',
    driver: 'Marcus Johnson',
    driverInitials: 'MJ',
    miles: 620,
  },
  {
    id: 'LD-2026-000037',
    status: 'TONU',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Bronx, NY',
    destination: 'Detroit, MI',
    pickup: 'Feb 26',
    rate: 2100,
    ratePerMile: 3.33,
    created: 'Feb 24',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 630,
  },
  {
    id: 'LD-2026-000036',
    status: 'Delivered',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Bronx, NY',
    destination: 'Philadelphia, PA',
    pickup: 'Feb 25',
    rate: 950,
    ratePerMile: 8.18,
    created: 'Feb 23',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 116,
  },
  {
    id: 'LD-2026-000035',
    status: 'Awaiting Invoice',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Newark, NJ',
    destination: 'Durham, NC',
    pickup: 'Feb 24',
    rate: 2600,
    ratePerMile: 4.89,
    created: 'Feb 22',
    driver: 'Marcus Johnson',
    driverInitials: 'MJ',
    miles: 532,
  },
  {
    id: 'LD-2026-000030',
    status: 'Invoiced',
    carrier: 'JR Express',
    carrierColor: '#ef4444',
    origin: 'Edison, NJ',
    destination: 'Baltimore, MD',
    pickup: 'Feb 19',
    rate: 1100,
    ratePerMile: 5.79,
    created: 'Feb 16',
    driver: 'Carlos Reyes',
    driverInitials: 'CR',
    miles: 190,
  },
  {
    id: 'LD-2026-000029',
    status: 'Paid',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Paterson, NJ',
    destination: 'Atlanta, GA',
    pickup: 'Feb 18',
    rate: 3200,
    ratePerMile: 3.68,
    created: 'Feb 15',
    driver: 'Marcus Johnson',
    driverInitials: 'MJ',
    miles: 870,
  },
  {
    id: 'LD-2026-000028',
    status: 'Paid',
    carrier: 'Hustle Transport',
    carrierColor: '#3b82f6',
    origin: 'Newark, NJ',
    destination: 'Charlotte, NC',
    pickup: 'Feb 17',
    rate: 2750,
    ratePerMile: 4.44,
    created: 'Feb 14',
    driver: 'Marcus Johnson',
    driverInitials: 'MJ',
    miles: 620,
  },
];

// ═══════════════════════════════════════════════════════════════════
//  STATUS CHIP
// ═══════════════════════════════════════════════════════════════════

const StatusChip: React.FC<{ status: LoadStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        bgcolor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontWeight: 600,
        fontSize: '0.75rem',
        height: 24,
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════
//  AG GRID CELL RENDERERS
// ═══════════════════════════════════════════════════════════════════

const LoadIdCellRenderer = (params: any) => (
  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
    {params.value}
  </Typography>
);

const StatusCellRenderer = (params: any) => <StatusChip status={params.value} />;

const CarrierCellRenderer = (params: any) => (
  <Typography variant="body2" color="text.secondary">
    {params.value}
  </Typography>
);

const RateCellRenderer = (params: any) => (
  <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
    ${params.value?.toLocaleString()}
  </Typography>
);

const RatePerMileCellRenderer = (params: any) => (
  <Typography variant="body2" color="text.secondary">
    ${params.value?.toFixed(2)}
  </Typography>
);

const CreatedCellRenderer = (params: any) => (
  <Typography variant="body2" color="text.disabled">
    {params.value}
  </Typography>
);

// ═══════════════════════════════════════════════════════════════════
//  AG GRID COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

const buildColumnDefs = (onView: (id: string) => void, onEdit: (id: string) => void) => {
  // const actionsConfig: ActionsCellConfig[] = [
  //   {
  //     label: 'View Load Detail',
  //     icon: <VisibilityIcon fontSize="small" />,
  //     onClick: (params: any) => onView(params.data.id),
  //   },
  //   {
  //     label: 'Edit Load',
  //     icon: <EditIcon fontSize="small" />,
  //     onClick: (params: any) => onEdit(params.data.id),
  //   },
  // ];

  return [
    {
      field: 'id',
      headerName: 'Load #',
      width: 170,
      sort: 'desc' as const,
      cellRenderer: LoadIdCellRenderer,
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
      field: 'carrier',
      headerName: 'Carrier',
      width: 170,
      cellRenderer: CarrierCellRenderer,
      filter: true,
    },
    {
      field: 'origin',
      headerName: 'Origin',
      width: 150,
      filter: true,
    },
    {
      field: 'destination',
      headerName: 'Destination',
      width: 170,
      filter: true,
    },
    {
      field: 'pickup',
      headerName: 'Pickup',
      width: 100,
    },
    {
      field: 'rate',
      headerName: 'Rate',
      width: 110,
      cellRenderer: RateCellRenderer,
      type: 'numericColumn' as const,
    },
    {
      field: 'ratePerMile',
      headerName: 'Rate/Mi',
      width: 100,
      cellRenderer: RatePerMileCellRenderer,
      type: 'numericColumn' as const,
    },
    {
      field: 'created',
      headerName: 'Created',
      width: 100,
      cellRenderer: CreatedCellRenderer,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsCell,
      // cellRendererParams: { actions: actionsConfig },
      pinned: 'right' as const,
    },
  ];
};

const defaultColDef = {
  sortable: true,
  resizable: true,
  suppressMovable: false,
};

// ═══════════════════════════════════════════════════════════════════
//  WEEKLY GROSS STRIP
// ═══════════════════════════════════════════════════════════════════

const WeeklyGrossStrip: React.FC<{ trucks: TruckWeekly[] }> = ({ trucks }) => {
  const fleetTotal = trucks.reduce((s, t) => s + t.gross, 0);
  const fleetTarget = 25000;
  return (
    <MainCard sx={{ mb: 2, px: 3, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Weekly Gross{' '}
          <Typography component="span" variant="caption" color="text.disabled">
            Feb 24 – Mar 1
          </Typography>
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          Fleet Total:{' '}
          <Typography component="span" sx={{ color: 'success.main' }}>
            ${fleetTotal.toLocaleString()}
          </Typography>{' '}
          / ${fleetTarget.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0, overflow: 'auto' }}>
        {trucks.map((t, i) => {
          const pct = Math.min((t.gross / t.target) * 100, 100);
          return (
            <Box
              key={t.truckId}
              sx={{
                flex: 1,
                minWidth: 150,
                px: 1.5,
                borderRight: i < trucks.length - 1 ? 1 : 0,
                borderColor: 'divider',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Truck {t.truckId}{' '}
                  <Typography component="span" variant="caption" color="text.disabled">
                    ({t.driverName})
                  </Typography>
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 700, color: t.atTarget ? 'success.main' : 'text.primary' }}
                >
                  ${t.gross.toLocaleString()}
                  {t.atTarget && ' ✓'}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: t.atTarget ? 'success.main' : t.underMin ? 'warning.main' : t.color,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.625rem' }}>
                ${t.target.toLocaleString()}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </MainCard>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  KANBAN VIEW
// ═══════════════════════════════════════════════════════════════════

const KanbanCard: React.FC<{ load: Load }> = ({ load }) => {
  const cfg = STATUS_CONFIG[load.status];
  return (
    <MainCard
      sx={{
        p: 2,
        mb: 1.5,
        cursor: 'pointer',
        borderLeft: `3px solid ${cfg?.color || '#e2e8f0'}`,
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' },
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {load.id}
        </Typography>
        <StatusChip status={load.status} />
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
        {load.origin} → {load.destination}
      </Typography>
      <Chip
        label={load.carrier}
        size="small"
        variant="outlined"
        sx={{
          fontSize: '0.6875rem',
          height: 20,
          mb: 1,
          borderColor: load.carrierColor,
          color: load.carrierColor,
        }}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar
            sx={{
              width: 22,
              height: 22,
              fontSize: '0.625rem',
              fontWeight: 700,
              bgcolor: `${load.carrierColor}20`,
              color: load.carrierColor,
            }}
          >
            {load.driverInitials}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {load.driver.split(' ')[0]}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="text.disabled">
            {load.pickup}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
            ${load.rate.toLocaleString()}
          </Typography>
        </Box>
      </Box>
    </MainCard>
  );
};

const KanbanView: React.FC<{ loads: Load[] }> = ({ loads }) => {
  const columns = KANBAN_COLUMNS.map((col) => ({
    ...col,
    loads: loads.filter((l) => STATUS_CONFIG[l.status]?.kanbanCol === col.key),
  }));

  return (
    <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2, minHeight: 0, flex: 1 }}>
      {columns.map((col) => (
        <Box
          key={col.key}
          sx={{ minWidth: 280, maxWidth: 320, flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, px: 0.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {col.label}
            </Typography>
            <Chip
              label={col.loads.length}
              size="small"
              sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'grey.100' }}
            />
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
            {col.loads.map((load) => (
              <KanbanCard key={load.id} load={load} />
            ))}
            {col.loads.length === 0 && (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  border: 1,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'grey.50',
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  No loads
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  TABLE VIEW (AG Grid via NewDataGrid)
// ═══════════════════════════════════════════════════════════════════

const TableView: React.FC<{
  loads: Load[];
  loading?: boolean;
  onViewLoad: (id: string) => void;
  onEditLoad: (id: string) => void;
}> = ({ loads, loading = false, onViewLoad, onEditLoad }) => {
  const columnDefs = useMemo(
    () => buildColumnDefs(onViewLoad, onEditLoad),
    [onViewLoad, onEditLoad],
  );

  const gridOptions = {
    rowHeight: 48,
    headerHeight: 40,
    animateRows: true,
    rowSelection: 'single' as const,
    suppressCellFocus: true,
    onRowClicked: (event: any) => {
      if (event.data) onViewLoad(event.data.id);
    },
  };

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <NewDataGrid
        columnDefs={columnDefs}
        rowData={loads}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        loading={loading}
        noDataMessage="No loads match your filters"
        showRowCountFooter
        totalRowCount={LOADS.length}
        rowCountLabel="loads"
      />
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  MAP PLACEHOLDER
// ═══════════════════════════════════════════════════════════════════

const MapView: React.FC = () => (
  <Box
    sx={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'grey.100',
      borderRadius: 1,
      border: 1,
      borderColor: 'divider',
    }}
  >
    <Box sx={{ textAlign: 'center' }}>
      <MapIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
        Map View
      </Typography>
      <Typography variant="caption" color="text.disabled">
        Requires mapping library integration (Mapbox / Google Maps)
      </Typography>
    </Box>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════

const DispatchBoardPage: React.FC = () => {
  const [view, setView] = useState<'kanban' | 'table' | 'map'>('kanban');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    let result = LOADS;
    if (carrierFilter !== 'all') result = result.filter((l) => l.carrier === carrierFilter);
    if (statusFilter !== 'all') result = result.filter((l) => l.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.id.toLowerCase().includes(s) ||
          l.origin.toLowerCase().includes(s) ||
          l.destination.toLowerCase().includes(s) ||
          l.driver.toLowerCase().includes(s) ||
          l.carrier.toLowerCase().includes(s),
      );
    }
    return result;
  }, [carrierFilter, statusFilter, search]);

  const uniqueCarriers = [...new Set(LOADS.map((l) => l.carrier))];
  const uniqueStatuses = [...new Set(LOADS.map((l) => l.status))];

  const handleViewLoad = useCallback((loadId: string) => {
    console.log('View load:', loadId);
    // navigate(`/loads/${loadId}`) or open detail drawer
  }, []);

  const handleEditLoad = useCallback((loadId: string) => {
    console.log('Edit load:', loadId);
    // open edit drawer
  }, []);

  return (
    <PageWrapper>
      <PageHeader
        title="Dispatch Board"
        // headerActions
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 2,
                  py: 0.75,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: '#fff',
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                },
              }}
            >
              <ToggleButton value="kanban">
                <ViewKanbanIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Kanban
              </ToggleButton>
              <ToggleButton value="table">
                <TableChartIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Table
              </ToggleButton>
              <ToggleButton value="map">
                <MapIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Map
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Load
            </Button>
          </Stack>
        }
      />

      <WeeklyGrossStrip trucks={TRUCKS} />

      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search loads, drivers, carriers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          label="Carrier"
        >
          <MenuItem value="all">All Carriers</MenuItem>
          {uniqueCarriers.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          label="Status"
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {uniqueStatuses.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.disabled">
          {filtered.length} loads · {new Set(filtered.map((l) => l.driver)).size} drivers
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {view === 'kanban' && <KanbanView loads={filtered} />}
        {view === 'table' && (
          <TableView
            loads={filtered}
            loading={loading}
            onViewLoad={handleViewLoad}
            onEditLoad={handleEditLoad}
          />
        )}
        {view === 'map' && <MapView />}
      </Box>
    </PageWrapper>
  );
};

export default DispatchBoardPage;
