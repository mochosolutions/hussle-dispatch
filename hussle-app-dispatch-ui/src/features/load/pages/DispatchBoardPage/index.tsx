import { useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  LinearProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableChartIcon from '@mui/icons-material/TableChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { PageHeader, PageWrapper, MainCard } from '@mocho/ui/components';
import { useSelector, useDispatch } from 'store';
import { fetchLoadsRequest, setBoardView, setLoadFilters } from '../../store/reducers';
import {
  selectAllLoads,
  selectLoadListLoading,
  selectLoadsByKanbanGroup,
  selectBoardView,
  selectLoadFilters,
} from '../../store/selectors/loadSelectors';
import { KanbanBoard } from '../../components/KanbanBoard';
import { LoadTable } from '../../components/LoadTable';
import { LOAD_STATUSES, STATUS_LABELS } from '../../constants';
import type { BoardView, LoadStatus } from '../../types';

// ---------------------------------------------------------------------------
// Board view persistence in localStorage
// ---------------------------------------------------------------------------

const BOARD_VIEW_STORAGE_KEY = 'dispatch-board-view';

const getPersistedBoardView = (): BoardView | null => {
  try {
    const stored = localStorage.getItem(BOARD_VIEW_STORAGE_KEY);
    if (stored === 'kanban' || stored === 'table') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return null;
};

const persistBoardView = (view: BoardView) => {
  try {
    localStorage.setItem(BOARD_VIEW_STORAGE_KEY, view);
  } catch {
    // localStorage may be unavailable
  }
};

// ---------------------------------------------------------------------------
// Weekly Gross Tracker (ADMIN + DISPATCHER only, placeholder data)
// ---------------------------------------------------------------------------

interface TruckWeekly {
  truckId: string;
  driverName: string;
  gross: number;
  target: number;
  atTarget: boolean;
  underMin: boolean;
}

const PLACEHOLDER_TRUCKS: TruckWeekly[] = [
  {
    truckId: '#133718',
    driverName: 'Marcus',
    gross: 3850,
    target: 5000,
    atTarget: false,
    underMin: false,
  },
  {
    truckId: '#675600',
    driverName: 'Devon',
    gross: 2900,
    target: 5000,
    atTarget: false,
    underMin: false,
  },
  {
    truckId: '#441205',
    driverName: 'James',
    gross: 5200,
    target: 5000,
    atTarget: true,
    underMin: false,
  },
  {
    truckId: '#998877',
    driverName: 'Ray',
    gross: 1800,
    target: 5000,
    atTarget: false,
    underMin: true,
  },
  {
    truckId: '#556644',
    driverName: 'Carlos',
    gross: 3400,
    target: 5000,
    atTarget: false,
    underMin: false,
  },
];

const WeeklyGrossStrip: React.FC<{ trucks: TruckWeekly[] }> = ({ trucks }) => {
  const fleetTotal = trucks.reduce((sum, t) => sum + t.gross, 0);
  const fleetTarget = trucks.reduce((sum, t) => sum + t.target, 0);

  return (
    <MainCard sx={{ mb: 2, px: 3, py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Weekly Gross
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
          const getBarColor = () => {
            if (t.atTarget) return 'success.main';
            if (t.underMin) return 'warning.main';
            return 'primary.main';
          };
          const barColor = getBarColor();

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
                    bgcolor: barColor,
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

// ---------------------------------------------------------------------------
// Dispatch Board Page
// ---------------------------------------------------------------------------

const DispatchBoardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const allLoads = useSelector(selectAllLoads);
  const isLoading = useSelector(selectLoadListLoading);
  const loadsByGroup = useSelector(selectLoadsByKanbanGroup);
  const boardView = useSelector(selectBoardView);
  const filters = useSelector(selectLoadFilters);

  // Initialise board view from localStorage on mount
  useEffect(() => {
    const persisted = getPersistedBoardView();
    if (persisted && persisted !== boardView) {
      dispatch(setBoardView(persisted));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only on mount

  // Fetch loads on mount and when filters change
  useEffect(() => {
    dispatch(fetchLoadsRequest({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleViewChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, value: BoardView | null) => {
      if (value) {
        dispatch(setBoardView(value));
        persistBoardView(value);
      }
    },
    [dispatch],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setLoadFilters({ ...filters, search: event.target.value }));
    },
    [dispatch, filters],
  );

  const handleStatusFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const statusArray = value === 'all' ? undefined : [value as LoadStatus];
      dispatch(setLoadFilters({ ...filters, status: statusArray }));
    },
    [dispatch, filters],
  );

  const handleCarrierFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      dispatch(setLoadFilters({ ...filters, carrierId: value === 'all' ? undefined : value }));
    },
    [dispatch, filters],
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchLoadsRequest({ page: 1, limit: 100 }));
  }, [dispatch]);

  const handleCreateLoad = useCallback(() => {
    navigate('/loads/new');
  }, [navigate]);

  // Client-side filtering for search
  const filteredLoads = useMemo(() => {
    let result = allLoads;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (load) =>
          load.loadNumber.toLowerCase().includes(searchLower) ||
          (load.carrierName ?? '').toLowerCase().includes(searchLower) ||
          (load.driverName ?? '').toLowerCase().includes(searchLower) ||
          (load.originCity ?? '').toLowerCase().includes(searchLower) ||
          (load.destinationCity ?? '').toLowerCase().includes(searchLower),
      );
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((load) => filters.status?.includes(load.status));
    }

    return result;
  }, [allLoads, filters]);

  // Unique carrier names for the filter dropdown
  const uniqueCarriers = useMemo(
    () => [...new Set(allLoads.map((l) => l.carrierName).filter(Boolean))] as string[],
    [allLoads],
  );

  const currentStatusFilter = filters.status?.[0] ?? 'all';
  const currentCarrierFilter = filters.carrierId ?? 'all';

  return (
    <PageWrapper isLoading={false} errorContext="DispatchBoardPage">
      <PageHeader
        title="Dispatch Board"
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={boardView}
              exclusive
              onChange={handleViewChange}
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
              <ToggleButton value="kanban" aria-label="Kanban view">
                <ViewKanbanIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Kanban
              </ToggleButton>
              <ToggleButton value="table" aria-label="Table view">
                <TableChartIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Table
              </ToggleButton>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateLoad}>
              Create Load
            </Button>
          </Stack>
        }
      />

      <WeeklyGrossStrip trucks={PLACEHOLDER_TRUCKS} />

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search loads, drivers, carriers..."
          value={filters.search ?? ''}
          onChange={handleSearchChange}
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
          value={currentStatusFilter}
          onChange={handleStatusFilterChange}
          sx={{ minWidth: 160 }}
          label="Status"
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {LOAD_STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={currentCarrierFilter}
          onChange={handleCarrierFilterChange}
          sx={{ minWidth: 160 }}
          label="Carrier"
        >
          <MenuItem value="all">All Carriers</MenuItem>
          {uniqueCarriers.map((carrier) => (
            <MenuItem key={carrier} value={carrier}>
              {carrier}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={handleRefresh}>
          Refresh
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.disabled">
          {filteredLoads.length} loads
        </Typography>
      </Box>

      {/* View Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {boardView === 'kanban' && <KanbanBoard loadsByGroup={loadsByGroup} />}
        {boardView === 'table' && (
          <LoadTable loads={filteredLoads} loading={isLoading} totalCount={filteredLoads.length} />
        )}
      </Box>
    </PageWrapper>
  );
};

export default DispatchBoardPage;
