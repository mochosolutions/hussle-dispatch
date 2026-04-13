import { useEffect, useCallback, useRef } from 'react';
import { Box } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ListSkeleton, PageWrapper } from '@mocho/ui/components';
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
  selectLastRefreshed,
} from '../../store/selectors/loadSelectors';
import { fetchDashboardRequest } from 'features/dashboard/store/sagas/dashboardSagaWatcher';
import {
  selectWeeklyGross,
  selectWeeklyGrossLoading,
  selectWeeklyGrossFetched,
} from 'features/dashboard/store/selectors/dashboardSelectors';
import { KanbanBoard } from '../../components/KanbanBoard';

import { CommandCenterView } from './components/CommandCenterView';
import { DriverGroupView } from '../../components/DriverGroupView';
// import { WeeklyGrossStrip } from '../../components/WeeklyGrossStrip';
import { IntelFeedView } from '../../components/IntelFeedView';
import type { BoardView, LoadStatus } from '../../types';
import { DispatchBoardActions } from './components/DispatchBoardActions';
import { DispatchBoardToolbar } from './components/DispatchBoardToolbar';
import { LoadTable } from './components/LoadTable';

// ---------------------------------------------------------------------------
// Board view persistence in localStorage
// ---------------------------------------------------------------------------

const DISPATCH_BOARD_LOAD_LIMIT = 100;
const BOARD_VIEW_STORAGE_KEY = 'dispatch-board-view';

const getPersistedBoardView = (): BoardView | null => {
  try {
    const stored = localStorage.getItem(BOARD_VIEW_STORAGE_KEY);
    if (
      stored === 'kanban' ||
      stored === 'table' ||
      stored === 'driver' ||
      stored === 'intel' ||
      stored === 'map'
    ) {
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
  const lastRefreshed = useSelector(selectLastRefreshed);

  const uniqueCarriers = useSelector(selectUniqueCarrierNames);

  const currentStatusFilter = filters.status?.[0] ?? 'all';
  const currentCarrierFilter = filters.carrierName ?? 'all';

  return (
    <PageWrapper
      isLoading={isLoading}
      loadingComponent={<ListSkeleton rows={8} />}
      errorContext="DispatchBoardPage"
    >
      <ListLayout
        title="Dispatch Board"
        primaryAction={
          <DispatchBoardActions
            boardView={boardView}
            handleViewChange={handleViewChange}
            handleCreateLoad={handleCreateLoad}
          />
        }
        toolbar={
          <DispatchBoardToolbar
            boardView={boardView}
            filters={filters}
            handleSearchChange={handleSearchChange}
            currentStatusFilter={currentStatusFilter}
            handleStatusFilterChange={handleStatusFilterChange}
            handleCarrierFilterChange={handleCarrierFilterChange}
            uniqueCarriers={uniqueCarriers}
            handleRefresh={handleRefresh}
            lastRefreshed={lastRefreshed}
            currentCarrierFilter={currentCarrierFilter}
          />
        }
      >
        {boardView === 'intel' && <IntelFeedView />}

        {boardView !== 'intel' && (
          <>
            {/* <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
              <WeeklyGrossStrip items={weeklyGrossItems} isLoading={weeklyGrossLoading} />
            </Box> */}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                ...(boardView !== 'map' && { px: { xs: 2, sm: 3 }, pb: 2 }),
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
              {boardView === 'map' && <CommandCenterView />}
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
