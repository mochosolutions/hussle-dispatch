import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { MainCard, NewDataGrid, PageWrapper, ListSkeleton } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { StatusCell } from 'components/Statusbadge';
import { useDispatch, useSelector } from 'store';
import {
  fetchSettlementsRequest,
  setSettlementFilters,
} from '../../store/reducers/settlementPageSlice';
import {
  selectAllSettlements,
  selectSettlementListLoading,
  selectSettlementFilters,
} from '../../store/selectors/settlementSelectors';
import { GenerateSettlementDialog } from '../../components/GenerateSettlementDialog';
import type { SettlementListItem } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string | number): string =>
  currencyFormatter.format(Number(value));

const formatDate = (value: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const toSettlementStatusKey = (status: string): string => `SETTLEMENT_${status}`;

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const StatusCellRenderer = ({ value }: { value: string }) => (
  <StatusCell status={toSettlementStatusKey(value)} size="small" />
);

const CurrencyCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatCurrency(value)}
  </Box>
);

const DateCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatDate(value)}
  </Box>
);

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PAID', label: 'Paid' },
  { value: 'DISPUTED', label: 'Disputed' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SettlementListPage = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector(selectSettlementListLoading);
  const settlements = useSelector(selectAllSettlements);
  const filters = useSelector(selectSettlementFilters);

  useEffect(() => {
    dispatch(fetchSettlementsRequest({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleStatusChange = useCallback(
    (event: SelectChangeEvent) => {
      const status = event.target.value === 'ALL' ? undefined : event.target.value;
      const nextFilters = { ...filters, status };
      dispatch(setSettlementFilters(nextFilters));
      dispatch(fetchSettlementsRequest({ page: 1, limit: 25, ...nextFilters }));
    },
    [dispatch, filters],
  );

  const handleRowClicked = useCallback(
    (params: { data: SettlementListItem }) => {
      if (params.data) {
        navigate(`/accounting/settlements/${params.data.id}`);
      }
    },
    [navigate],
  );

  const columnDefs = useMemo(
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
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: 'Carrier',
        field: 'carrierName',
        minWidth: 160,
        flex: 1,
      },
      {
        headerName: 'Driver',
        field: 'driverName',
        minWidth: 140,
        flex: 1,
      },
      {
        headerName: 'Period Start',
        field: 'periodStart',
        minWidth: 140,
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: 'Period End',
        field: 'periodEnd',
        minWidth: 140,
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: 'Gross Revenue',
        field: 'grossRevenue',
        minWidth: 140,
        cellRenderer: CurrencyCellRenderer,
      },
      {
        headerName: 'Net Earnings',
        field: 'netEarnings',
        minWidth: 140,
        cellRenderer: CurrencyCellRenderer,
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
    <PageWrapper
      isLoading={isLoading}
      loadingComponent={<ListSkeleton rows={8} />}
      errorContext="SettlementListPage"
      sx={{ gap: 2 }}
    >
      <ListLayout
        title="Settlements"
        primaryAction={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Generate Settlement
          </Button>
        }
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 3,
            pt: 2,
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
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              sx={{ px: 2, py: 1.5 }}
            >
              <Stack spacing={1}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status ?? 'ALL'}
                  onChange={handleStatusChange}
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>

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
                    rowHeight: 52,
                    onRowClicked: handleRowClicked,
                  }}
                  loading={isLoading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>

      <GenerateSettlementDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </PageWrapper>
  );
};

export default SettlementListPage;
