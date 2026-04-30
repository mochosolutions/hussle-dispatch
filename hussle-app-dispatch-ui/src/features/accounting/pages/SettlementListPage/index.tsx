import { useCallback, useEffect, useMemo } from 'react';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useStore } from 'react-redux';
import { NewDataGrid, PageWrapper } from '@mocho/ui/components';
import { ActionsCell } from 'mocho/components/DataGrid';
import { EmptyState } from 'mocho/components/EmptyState';
import { ListLayout } from 'components/ListLayout';
import MainCard from 'components/MainCard';
import ListKpiBar from 'components/ListKpiBar';
import { FilterBar } from 'components/FilterBar';
import { StatusCell } from 'components/Statusbadge';
import { Amount, Body } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import {
  fetchSettlementsRequest,
  setSettlementFilters,
} from '../../store/reducers/settlementPageSlice';
import {
  selectFilteredSettlements,
  selectSettlementFilters,
  selectSettlementKpis,
} from '../../store/selectors/settlementSelectors';
import type { SettlementListItem } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_LIMIT = 25;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'DISPUTED', label: 'Disputed' },
];

const toSettlementStatusKey = (status: string): string => `SETTLEMENT_${status}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SettlementListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openModal } = useModalActions();

  const settlements = useSelector(selectFilteredSettlements);
  const kpiItems = useSelector(selectSettlementKpis);
  const filters = useSelector(selectSettlementFilters);
  const hasLoadedOnce = useSelector(
    (state: RootState) => state.pages.settlements.hasLoadedOnce,
  );
  const store = useStore<RootState>();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.settlements;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchSettlementsRequest({ page: 1, limit: PAGE_LIMIT }));
    }
  }, [dispatch, store]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'ALL' ? undefined : value;
      const nextFilters = { ...filters, status };
      dispatch(setSettlementFilters(nextFilters));
      dispatch(fetchSettlementsRequest({ page: 1, limit: PAGE_LIMIT, ...nextFilters }));
    },
    [dispatch, filters],
  );

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<SettlementListItem>) => {
      if (event.data) {
        navigate(`/accounting/settlements/${event.data.id}`);
      }
    },
    [navigate],
  );

  const filterConfig = useMemo(
    () => [
      {
        type: 'select' as const,
        name: 'status',
        label: 'Status',
        options: STATUS_OPTIONS,
        value: filters.status ?? 'ALL',
        onChange: handleStatusChange,
      },
    ],
    [filters.status, handleStatusChange],
  );

  const columnDefs = useMemo<ColDef<SettlementListItem>[]>(
    () => [
      {
        headerName: 'Settlement #',
        field: 'settlementNumber',
        minWidth: 160,
        pinned: 'left' as const,
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <StatusCell status={toSettlementStatusKey(value)} size="small" />
        ),
      },
      {
        headerName: 'Carrier',
        field: 'carrierName',
        minWidth: 160,
        flex: 1,
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'Driver',
        field: 'driverName',
        minWidth: 140,
        flex: 1,
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'Period Start',
        field: 'periodStart',
        minWidth: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Body>{value}</Body>
          </Box>
        ),
      },
      {
        headerName: 'Period End',
        field: 'periodEnd',
        minWidth: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Body>{value}</Body>
          </Box>
        ),
      },
      {
        headerName: 'Gross Revenue',
        field: 'grossRevenue',
        minWidth: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Amount>{value}</Amount>
          </Box>
        ),
      },
      {
        headerName: 'Net Earnings',
        field: 'netEarnings',
        minWidth: 140,
        cellRenderer: ({ value }: { value: string }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Amount>{value}</Amount>
          </Box>
        ),
      },
      {
        headerName: 'Actions',
        colId: 'actions',
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCell,
        cellRendererParams: {
          config: {
            showView: true,
            showEdit: false,
            showDelete: false,
            getViewRoute: (data: SettlementListItem) => `/accounting/settlements/${data.id}`,
          },
        },
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  return (
    <PageWrapper errorContext="SettlementListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Settlements"
        primaryAction={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openModal('generateSettlement', {})}
          >
            Generate Settlement
          </Button>
        }
      >
        <ListKpiBar
          items={kpiItems}
          loading={!hasLoadedOnce}
          sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }}
        />

        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 3,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <MainCard
            content={false}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <FilterBar filters={filterConfig} />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ flex: 1, minHeight: { xs: 300, md: 420 } }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={settlements}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={settlements.length}
                  rowCountLabel="settlements"
                  noDataComponent={
                    <EmptyState variant="no-results" entityName="Settlements" compact />
                  }
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: PAGE_LIMIT,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 56,
                    onRowClicked: handleRowClicked,
                  }}
                  loading={!hasLoadedOnce}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>
    </PageWrapper>
  );
};

export default SettlementListPage;
