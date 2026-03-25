import { useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  Tooltip,
  Select,
  OutlinedInput,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import TableChartIcon from '@mui/icons-material/TableChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { PageWrapper } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { useSelector, useDispatch } from 'store';
import { fetchLoadsRequest, setBoardView, setLoadFilters } from '../../store/reducers';
import {
  selectLoadListLoading,
  selectLoadsByKanbanGroup,
  selectBoardView,
  selectLoadFilters,
  selectFilteredLoads,
  selectUniqueCarrierNames,
  selectAllLoads,
  selectLastRefreshed,
} from '../../store/selectors/loadSelectors';
import { fetchDashboardRequest } from 'features/dashboard/store/sagas/dashboardSagaWatcher';
import {
  selectWeeklyGross,
  selectWeeklyGrossLoading,
  selectWeeklyGrossFetched,
} from 'features/dashboard/store/selectors/dashboardSelectors';
import { KanbanBoard } from '../../components/KanbanBoard';
import { LoadTable } from '../../components/LoadTable';
import { MapView } from '../../components/MapView';
import { DriverGroupView } from '../../components/DriverGroupView';
import { WeeklyGrossStrip } from '../../components/WeeklyGrossStrip';
import { IntelFeedView } from '../../components/IntelFeedView';
import { LOAD_STATUSES, STATUS_LABELS } from '../../constants';
import type { BoardView, LoadStatus } from '../../types';

// ---------------------------------------------------------------------------
// Board view persistence in localStorage
// ---------------------------------------------------------------------------

const DISPATCH_BOARD_LOAD_LIMIT = 100;
const BOARD_VIEW_STORAGE_KEY = 'dispatch-board-view';

const getPersistedBoardView = (): BoardView | null => {
  try {
    const stored = localStorage.getItem(BOARD_VIEW_STORAGE_KEY);
    if (stored === 'kanban' || stored === 'table' || stored === 'driver' || stored === 'intel') {
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
// Dispatch Board Page
// ---------------------------------------------------------------------------

const DispatchBoardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector(selectLoadListLoading);
  const loadsByGroup = useSelector(selectLoadsByKanbanGroup);
  const boardView = useSelector(selectBoardView);
  const filters = useSelector(selectLoadFilters);
  const weeklyGrossItems = useSelector(selectWeeklyGross);
  const weeklyGrossLoading = useSelector(selectWeeklyGrossLoading);
  const weeklyGrossFetched = useSelector(selectWeeklyGrossFetched);

  // Initialise board view from localStorage on mount
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const persisted = getPersistedBoardView();
    if (persisted && persisted !== boardView) {
      dispatch(setBoardView(persisted));
    }
  }, [boardView, dispatch]);

  // Fetch loads on mount and when filters change
  useEffect(() => {
    dispatch(fetchLoadsRequest({ page: 1, limit: DISPATCH_BOARD_LOAD_LIMIT }));
  }, [dispatch]);

  // Fetch weekly gross data if not already loaded or attempted
  useEffect(() => {
    if (!weeklyGrossLoading && !weeklyGrossFetched) {
      dispatch(fetchDashboardRequest());
    }
  }, [dispatch, weeklyGrossLoading, weeklyGrossFetched]);

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
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      const statusArray = value === 'all' ? undefined : [value as LoadStatus];
      dispatch(setLoadFilters({ ...filters, status: statusArray }));
    },
    [dispatch, filters],
  );

  const handleCarrierFilterChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      dispatch(setLoadFilters({ ...filters, carrierName: value === 'all' ? undefined : value }));
    },
    [dispatch, filters],
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchLoadsRequest({ page: 1, limit: DISPATCH_BOARD_LOAD_LIMIT }));
  }, [dispatch]);

  const handleCreateLoad = useCallback(() => {
    navigate('/loads/new');
  }, [navigate]);

  const filteredLoads = useSelector(selectFilteredLoads);
  const allLoads = useSelector(selectAllLoads);
  const lastRefreshed = useSelector(selectLastRefreshed);

  const uniqueCarriers = useSelector(selectUniqueCarrierNames);

  const currentStatusFilter = filters.status?.[0] ?? 'all';
  const currentCarrierFilter = filters.carrierName ?? 'all';

  return (
    <PageWrapper isLoading={isLoading} errorContext="DispatchBoardPage">
      <ListLayout
        title="Dispatch Board"
        primaryAction={
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
              <ToggleButton value="table" aria-label="Table view">
                <TableChartIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Table
              </ToggleButton>
              <ToggleButton value="kanban" aria-label="Kanban view">
                <ViewKanbanIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Kanban
              </ToggleButton>

              <ToggleButton value="driver" aria-label="Driver view">
                <PeopleIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Driver
              </ToggleButton>
              <ToggleButton value="intel" aria-label="Intel view">
                <InsightsIcon sx={{ fontSize: 16, mr: 0.75 }} />
                Intel
              </ToggleButton>
              <Tooltip title="Coming Soon">
                <span>
                  <ToggleButton value="map" aria-label="Map view" disabled>
                    <MapIcon sx={{ fontSize: 16, mr: 0.75 }} />
                    Map
                  </ToggleButton>
                </span>
              </Tooltip>
            </ToggleButtonGroup>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateLoad}>
              Create Load
            </Button>
          </Stack>
        }
        toolbar={
          boardView !== 'intel' ? (
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                flexWrap: 'wrap',
                px: { xs: 2, sm: 3 },
                py: 1.5,
              }}
            >
              <Stack spacing={1}>
                <InputLabel>Search</InputLabel>
                <OutlinedInput
                  size="small"
                  placeholder="Search loads, drivers, carriers..."
                  value={filters.search ?? ''}
                  onChange={handleSearchChange}
                  sx={{ minWidth: 260 }}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  }
                />
              </Stack>
              <Stack spacing={1}>
                <InputLabel>Status</InputLabel>
                <Select
                  size="small"
                  value={currentStatusFilter}
                  onChange={handleStatusFilterChange}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  {LOAD_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <Stack spacing={1}>
                <InputLabel>Carrier</InputLabel>
                <Select
                  size="small"
                  value={currentCarrierFilter}
                  onChange={handleCarrierFilterChange}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="all">All Carriers</MenuItem>
                  {uniqueCarriers.map((carrier) => (
                    <MenuItem key={carrier} value={carrier}>
                      {carrier}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              {lastRefreshed && (
                <Typography variant="caption" color="text.disabled">
                  Updated {formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}
                </Typography>
              )}
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.disabled">
                {allLoads.length >= DISPATCH_BOARD_LOAD_LIMIT
                  ? `Showing ${filteredLoads.length} of ${DISPATCH_BOARD_LOAD_LIMIT}+ loads`
                  : `${filteredLoads.length} loads`}
              </Typography>
            </Box>
          ) : undefined
        }
      >
        {boardView === 'intel' && <IntelFeedView />}

        {boardView !== 'intel' && (
          <>
            <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <WeeklyGrossStrip items={weeklyGrossItems} isLoading={weeklyGrossLoading} />
            </Box>

            {/* View Content */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                px: { xs: 2, sm: 3 },
                pb: 2,
              }}
            >
              {boardView === 'kanban' && <KanbanBoard loadsByGroup={loadsByGroup} />}
              {boardView === 'table' && (
                <LoadTable
                  loads={filteredLoads}
                  loading={isLoading}
                  totalCount={filteredLoads.length}
                />
              )}
              {boardView === 'map' && <MapView stops={[]} />}
              {boardView === 'driver' && filteredLoads.length > 0 && (
                <DriverGroupView loads={filteredLoads} />
              )}
            </Box>
          </>
        )}
      </ListLayout>
    </PageWrapper>
  );
};

export default DispatchBoardPage;
