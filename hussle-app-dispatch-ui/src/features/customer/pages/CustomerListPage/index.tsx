import { useCallback, useEffect, useMemo } from 'react';
import { Stack, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ActionsCell,
  MainCard,
  NewDataGrid,
  PageWrapper,
} from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { EmptyState } from 'mocho/components/EmptyState';
import { ListLayout } from 'components/ListLayout';
import ListKpiBar from 'components/ListKpiBar';
import FilterBar from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import { useStore } from 'react-redux';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import type { Customer, CustomerFilters } from '../../types';
import {
  fetchCustomersRequest,
  setCustomerFilters,
} from '../../store/reducers/customerPageSlice';
import {
  selectCustomerFilters,
  selectCustomerKpis,
  selectFilteredCustomers,
} from '../../store/selectors/customerSelectors';
import {
  CustomerNameCellRenderer,
  CustomerTypeCellRenderer,
  CustomerContactCellRenderer,
  CustomerStatusCellRenderer,
} from '../../components/CustomerCellRenderers';
import {
  RevenueCellRenderer,
  AvgDaysToPayCellRenderer,
  PrimaryContactCellRenderer,
} from '../../components/CustomerListPage/CustomerListCellRenderers';

const PAGE_LIMIT = 25;

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'BROKER', label: 'Brokers' },
  { value: 'DIRECT_SHIPPER', label: 'Direct Shippers' },
  { value: 'THREE_PL', label: '3PLs' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const CustomerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const filters = useSelector(selectCustomerFilters);
  const filteredCustomers = useSelector(selectFilteredCustomers);
  const kpiItems = useSelector(selectCustomerKpis);
  const hasLoadedOnce = useSelector((state: RootState) => state.pages.customers.hasLoadedOnce);
  const store = useStore<RootState>();

  const typeValue = filters.type ?? 'all';
  const statusValue = filters.status ?? 'all';
  const searchValue = filters.search ?? '';

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.customers;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchCustomersRequest({ page: 1, limit: PAGE_LIMIT }));
    }
  }, [dispatch, store]);

  const handleTypeChange = useCallback(
    (value: string) => {
      const type = value === 'all' ? undefined : (value as CustomerFilters['type']);
      const nextFilters: CustomerFilters = { ...filters, type };
      dispatch(setCustomerFilters(nextFilters));
      dispatch(
        fetchCustomersRequest({
          page: 1,
          limit: PAGE_LIMIT,
          search: nextFilters.search,
          type: nextFilters.type,
          status: nextFilters.status,
        }),
      );
    },
    [dispatch, filters],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const status = value === 'all' ? undefined : (value as CustomerFilters['status']);
      const nextFilters: CustomerFilters = { ...filters, status };
      dispatch(setCustomerFilters(nextFilters));
      dispatch(
        fetchCustomersRequest({
          page: 1,
          limit: PAGE_LIMIT,
          search: nextFilters.search,
          type: nextFilters.type,
          status: nextFilters.status,
        }),
      );
    },
    [dispatch, filters],
  );

  const handleSearchChange = useCallback(
    (value: string | number) => {
      const query = String(value);
      const nextFilters: CustomerFilters = { ...filters, search: query || undefined };
      dispatch(setCustomerFilters(nextFilters));
      dispatch(
        fetchCustomersRequest({
          page: 1,
          limit: PAGE_LIMIT,
          search: query || undefined,
          type: nextFilters.type,
          status: nextFilters.status,
        }),
      );
    },
    [dispatch, filters],
  );

  const handleRowClicked = useCallback(
    (params: { data: Customer }) => {
      if (params.data) {
        navigate(`/customers/${params.data.id}`);
      }
    },
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    navigate('/customers/create');
  }, [navigate]);

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        options: TYPE_OPTIONS,
        value: typeValue,
        onChange: handleTypeChange,
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: STATUS_OPTIONS,
        value: statusValue,
        onChange: handleStatusChange,
      },
    ],
    [typeValue, statusValue, handleTypeChange, handleStatusChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by company name...',
      value: searchValue,
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [searchValue, handleSearchChange],
  );

  const actionsConfig = useMemo<ActionsCellConfig<Customer>>(
    () => ({
      showView: true,
      getViewRoute: (customer) => `/customers/${customer.id}`,
      showEdit: false,
      showDelete: false,
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Company',
        field: 'companyName',
        minWidth: 180,
        flex: 1.5,
        cellRenderer: CustomerNameCellRenderer,
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 130,
        flex: 0,
        cellRenderer: CustomerTypeCellRenderer,
      },
      {
        headerName: 'Contact',
        field: 'phone',
        minWidth: 150,
        flex: 1,
        cellRenderer: CustomerContactCellRenderer,
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 100,
        flex: 0,
        cellRenderer: CustomerStatusCellRenderer,
      },
      {
        headerName: 'Loads',
        minWidth: 80,
        maxWidth: 90,
        cellStyle: { textAlign: 'center' as const },
        valueGetter: (params: { data: Customer }) => params.data._count?.loads ?? 0,
      },
      {
        headerName: 'Revenue',
        field: 'totalRevenue',
        minWidth: 110,
        maxWidth: 130,
        cellRenderer: RevenueCellRenderer,
        cellStyle: { textAlign: 'right' as const },
      },
      {
        headerName: 'Avg Days to Pay',
        field: 'avgDaysToPay',
        minWidth: 120,
        maxWidth: 140,
        cellRenderer: AvgDaysToPayCellRenderer,
        cellStyle: { textAlign: 'right' as const },
      },
      {
        headerName: 'Primary Contact',
        field: 'primaryContact',
        minWidth: 160,
        flex: 1,
        cellRenderer: PrimaryContactCellRenderer,
      },
      {
        headerName: '',
        field: 'actions',
        minWidth: 80,
        maxWidth: 80,
        sortable: false,
        cellRenderer: ActionsCell,
        cellRendererParams: { config: actionsConfig },
      },
    ],
    [actionsConfig],
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
    <PageWrapper errorContext="CustomerListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Customers"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Customer
            </Button>
          </Stack>
        }
      >
        <ListKpiBar
          items={kpiItems}
          loading={!hasLoadedOnce}
          sx={{ px: { xs: 2, sm: 3 }, pt: 2 }}
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
            <FilterBar
              filters={filterConfigs}
              search={searchConfig}
              sx={{ px: 2, py: 1.5 }}
            />

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredCustomers}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredCustomers.length}
                  rowCountLabel="customers"
                  noDataComponent={<EmptyState variant="no-results" entityName="Customers" compact />}
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

export default CustomerListPage;
