import { useCallback, useEffect, useMemo, useRef, type ChangeEvent } from 'react';
import { Stack, TextField, Box, Button, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ActionsCell,
  MainCard,
  NewDataGrid,
  PageWrapper,
} from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { TwoLineCell } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import type { Customer, CustomerType, CustomerStatus, CustomerFilters } from '../../types';
import {
  fetchCustomersRequest,
  setCustomerFilters,
} from '../../store/reducers/customerPageSlice';
import {
  selectCustomerListLoading,
  selectCustomerFilters,
  selectFilteredCustomers,
} from '../../store/selectors/customerSelectors';
import {
  CustomerNameCellRenderer,
  CustomerTypeCellRenderer,
  CustomerContactCellRenderer,
  CustomerStatusCellRenderer,
} from '../../components/CustomerCellRenderers';

type TypeFilterValue = 'all' | CustomerType;
type StatusFilterValue = 'all' | CustomerStatus;

const TYPE_OPTIONS: { value: TypeFilterValue; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'BROKER', label: 'Brokers' },
  { value: 'DIRECT_SHIPPER', label: 'Direct Shippers' },
  { value: 'THREE_PL', label: '3PLs' },
];

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const PAGE_LIMIT = 25;

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '\u2014';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const getDaysToPayColor = (days: number): string => {
  if (days <= 30) {
    return '#4caf50';
  }
  if (days <= 60) {
    return '#ff9800';
  }
  return '#f44336';
};

const RevenueCellRenderer: React.FC<{ data: Customer }> = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
    <Box
      component="span"
      sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 'bold' }}
    >
      {formatCurrency(undefined)}
    </Box>
  </Box>
);

const AvgDaysToPayCellRenderer: React.FC<{ data: Customer }> = () => {
  // avgDaysToPay not yet available from the API
  const value: number | undefined = undefined;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      <Box
        component="span"
        sx={value !== undefined ? { color: getDaysToPayColor(value) } : undefined}
      >
        {value !== undefined ? value : '\u2014'}
      </Box>
    </Box>
  );
};

const PrimaryContactCellRenderer: React.FC<{ data: Customer }> = () => {
  // Primary contact not yet available from the API
  const contactName: string | undefined = undefined;
  const contactEmail: string | undefined = undefined;

  if (!contactName) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {'\u2014'}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <TwoLineCell primary={contactName} secondary={contactEmail ?? '\u2014'} />
    </Box>
  );
};

const CustomerListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const filters = useSelector(selectCustomerFilters);
  const filteredCustomers = useSelector(selectFilteredCustomers);
  const isLoading = useSelector(selectCustomerListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeValue: TypeFilterValue = filters.type ?? 'all';
  const statusValue: StatusFilterValue = filters.status ?? 'all';
  const searchValue = filters.search ?? '';

  const dispatchFetch = useCallback(
    (overrides: Partial<CustomerFilters> = {}) => {
      const merged = { ...filters, ...overrides };
      dispatch(
        fetchCustomersRequest({
          page: 1,
          limit: PAGE_LIMIT,
          search: merged.search,
          type: merged.type,
          status: merged.status,
        }),
      );
    },
    [dispatch, filters],
  );

  useEffect(() => {
    dispatch(fetchCustomersRequest({ page: 1, limit: PAGE_LIMIT }));
  }, [dispatch]);

  const handleTypeChange = useCallback(
    (event: SelectChangeEvent<TypeFilterValue>) => {
      const value = event.target.value as TypeFilterValue;
      const type = value === 'all' ? undefined : value;
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
    (event: SelectChangeEvent<StatusFilterValue>) => {
      const value = event.target.value as StatusFilterValue;
      const status = value === 'all' ? undefined : value;
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
    (event: ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      const nextFilters: CustomerFilters = { ...filters, search: query || undefined };
      dispatch(setCustomerFilters(nextFilters));

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        dispatchFetch({ search: query || undefined });
      }, 300);
    },
    [dispatch, filters, dispatchFetch],
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

  const actionsConfig = useMemo<ActionsCellConfig<Customer>>(
    () => ({
      showView: true,
      getViewRoute: (customer) => `/customers/${customer.id}`,
      showEdit: false,
      customActionTooltip: 'View',
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
        minWidth: 140,
        cellRenderer: CustomerTypeCellRenderer,
      },
      {
        headerName: 'Contact',
        field: 'phone',
        minWidth: 160,
        cellRenderer: CustomerContactCellRenderer,
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 120,
        cellRenderer: CustomerStatusCellRenderer,
      },
      {
        headerName: 'Loads',
        field: 'loadCount',
        minWidth: 90,
        maxWidth: 110,
        cellStyle: { textAlign: 'center' as const },
      },
      {
        headerName: 'Revenue',
        field: 'totalRevenue',
        minWidth: 120,
        maxWidth: 160,
        cellRenderer: RevenueCellRenderer,
        cellStyle: { textAlign: 'right' as const },
      },
      {
        headerName: 'Avg Days to Pay',
        field: 'avgDaysToPay',
        minWidth: 130,
        maxWidth: 160,
        cellRenderer: AvgDaysToPayCellRenderer,
        cellStyle: { textAlign: 'right' as const },
      },
      {
        headerName: 'Primary Contact',
        field: 'primaryContact',
        minWidth: 180,
        flex: 1,
        cellRenderer: PrimaryContactCellRenderer,
      },
      {
        headerName: '',
        field: 'actions',
        minWidth: 130,
        maxWidth: 150,
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
    <PageWrapper isLoading={false} errorContext="CustomerListPage" sx={{ gap: 2 }}>
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
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, pt: 2, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <MainCard
            content={false}
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              alignItems={{ xs: 'stretch', md: 'center' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Select<TypeFilterValue>
                  value={typeValue}
                  onChange={handleTypeChange}
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  {TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                <Select<StatusFilterValue>
                  value={statusValue}
                  onChange={handleStatusChange}
                  size="small"
                  sx={{ minWidth: 160 }}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <TextField
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search by company name..."
                size="small"
                sx={{ width: { xs: '100%', lg: 280 } }}
              />
            </Stack>

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box
                sx={{
                  minHeight: { xs: 300, md: 420 },
                  flex: 1,
                }}
              >
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredCustomers}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredCustomers.length}
                  rowCountLabel="customers"
                  noDataMessage="No customers found"
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: false,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 62,
                    onRowClicked: handleRowClicked,
                  }}
                  loading={isLoading}
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
