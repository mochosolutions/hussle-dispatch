import { useCallback, useEffect, useMemo } from 'react';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { NewDataGrid, PageWrapper } from '@mocho/ui/components';
import { ActionsCell } from 'mocho/components/DataGrid';
import { ListLayout } from 'components/ListLayout';
import MainCard from 'components/MainCard';
import ListKpiBar from 'components/ListKpiBar';
import { FilterBar } from 'components/FilterBar';
import { StatusCell } from 'components/Statusbadge';
import { Amount, Body } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import { useModalActions } from 'features/ui/hooks/useModalActions';
import {
  fetchSettlementsRequest,
  setSettlementFilters,
} from '../../store/reducers/settlementPageSlice';
import {
  selectAllSettlements,
  selectSettlementListLoading,
  selectSettlementFilters,
} from '../../store/selectors/settlementSelectors';
import type { SettlementListItem } from '../../types';
import { MissingEstimatedHoursDialog } from '../../components/MissingEstimatedHoursDialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

  const isLoading = useSelector(selectSettlementListLoading);
  const settlements = useSelector(selectAllSettlements);
  const filters = useSelector(selectSettlementFilters);

  useEffect(() => {
    dispatch(fetchSettlementsRequest({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'ALL' ? undefined : value;
      const nextFilters = { ...filters, status };
      dispatch(setSettlementFilters(nextFilters));
      dispatch(fetchSettlementsRequest({ page: 1, limit: 25, ...nextFilters }));
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

  const totalAmount = useMemo(
    () =>
      settlements.reduce((sum, s) => sum + parseFloat(s.netEarnings ?? '0'), 0),
    [settlements],
  );

  const pendingCount = useMemo(
    () => settlements.filter((s) => s.status === 'DRAFT').length,
    [settlements],
  );

  const approvedCount = useMemo(
    () => settlements.filter((s) => s.status === 'APPROVED').length,
    [settlements],
  );

  const kpiItems = useMemo(
    () => [
      { label: 'Total Settlements', value: settlements.length },
      { label: 'Pending', value: pendingCount },
      { label: 'Approved', value: approvedCount },
      {
        label: 'Total Amount',
        value: `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    ],
    [settlements.length, pendingCount, approvedCount, totalAmount],
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
        <ListKpiBar items={kpiItems} sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }} />

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
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={settlements}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={settlements.length}
                  rowCountLabel="settlements"
                  noDataMessage="No settlements found"
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 56,
                    onRowClicked: handleRowClicked,
                  }}
                  loading={isLoading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>
      <MissingEstimatedHoursDialog />
    </PageWrapper>
  );
};

export default SettlementListPage;
