import { useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'react-redux';
import { PageWrapper } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { useSelector, useDispatch } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import { fetchLoadsRequest, setBoardView, setLoadFilters } from '../../store/reducers';
import { fetchDriversRequest } from 'features/driver/store/reducers';
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
  selectWeeklyGrossLoading,
  selectWeeklyGrossFetched,
} from 'features/dashboard/store/selectors/dashboardSelectors';
import { KanbanBoard } from '../../components/DispatchBoardPage/KanbanBoard';
import { CommandCenterView } from '../../components/DispatchBoardPage/CommandCenterView';
import { DriverGroupView } from '../../components/DispatchBoardPage/DriverGroupView';
import { IntelFeedView } from '../../components/DispatchBoardPage/IntelFeedView';
import type { BoardView, LoadStatus } from '../../types';
import { DispatchBoardActions } from '../../components/DispatchBoardPage/DispatchBoardActions';
import { DispatchBoardToolbar } from '../../components/DispatchBoardPage/DispatchBoardToolbar';
import { LoadTable } from '../../components/DispatchBoardPage/LoadTable';

// ---------------------------------------------------------------------------
// Board view persistence is owned by `loadPageSlice` — initial state reads
// from localStorage at slice creation, and `setBoardView` writes to
// localStorage in the reducer. No component-level persistence wiring needed.
// ---------------------------------------------------------------------------

const DISPATCH_BOARD_LOAD_LIMIT = 100;

const DispatchBoardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const store = useStore<RootState>();

  const isLoading = useSelector(selectLoadListLoading);
  const loadsByGroup = useSelector(selectLoadsByKanbanGroup);
  const boardView = useSelector(selectBoardView);
  const filters = useSelector(selectLoadFilters);
  const weeklyGrossLoading = useSelector(selectWeeklyGrossLoading);
  const weeklyGrossFetched = useSelector(selectWeeklyGrossFetched);

  // Fetch loads and drivers on mount, gated by the loads slice's stale-guard
  // so a quick remount within the TTL window reuses the existing data.
  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.loads;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchLoadsRequest({ page: 1, limit: DISPATCH_BOARD_LOAD_LIMIT }));
    }
    dispatch(fetchDriversRequest({ page: 1, limit: 100 }));
  }, [dispatch, store]);

  // Fetch weekly gross data if not already loaded or attempted
  useEffect(() => {
    if (!weeklyGrossLoading && !weeklyGrossFetched) {
      dispatch(fetchDashboardRequest());
    }
  }, [dispatch, weeklyGrossLoading, weeklyGrossFetched]);

  const handleViewChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, value: BoardView | null) => {
      if (value) {
        // Persistence happens inside the reducer.
        dispatch(setBoardView(value));
      }
    },
    [dispatch],
  );

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(setLoadFilters({ ...filters, search: String(value) }));
    },
    [dispatch, filters],
  );

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      const statusArray = value === 'all' ? undefined : [value as LoadStatus];
      dispatch(setLoadFilters({ ...filters, status: statusArray }));
    },
    [dispatch, filters],
  );

  const handleCarrierFilterChange = useCallback(
    (value: string) => {
      dispatch(setLoadFilters({ ...filters, carrierName: value === 'all' ? undefined : value }));
    },
    [dispatch, filters],
  );

  const handleDateRangeChange = useCallback(
    (from: Date | null, to: Date | null) => {
      dispatch(
        setLoadFilters({
          ...filters,
          dateFrom: from ? from.toISOString() : undefined,
          dateTo: to ? to.toISOString() : undefined,
        }),
      );
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
  const currentDateFrom = filters.dateFrom;
  const currentDateTo = filters.dateTo;

  return (
    <PageWrapper errorContext="DispatchBoardPage">
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
            currentStatusFilter={currentStatusFilter}
            onStatusFilterChange={handleStatusFilterChange}
            onCarrierFilterChange={handleCarrierFilterChange}
            uniqueCarriers={uniqueCarriers}
            onRefresh={handleRefresh}
            onSearchChange={handleSearchChange}
            lastRefreshed={lastRefreshed}
            currentCarrierFilter={currentCarrierFilter}
            currentDateFrom={currentDateFrom}
            currentDateTo={currentDateTo}
            onDateRangeChange={handleDateRangeChange}
          />
        }
      >
        {boardView === 'intel' && <IntelFeedView />}

        {boardView !== 'intel' && (
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
              <LoadTable loads={filteredLoads} loading={isLoading} totalCount={filteredLoads.length} />
            )}
            {boardView === 'map' && <CommandCenterView />}
            {boardView === 'driver' && filteredLoads.length > 0 && (
              <DriverGroupView loads={filteredLoads} />
            )}
          </Box>
        )}
      </ListLayout>
    </PageWrapper>
  );
};

export default DispatchBoardPage;
