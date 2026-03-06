import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  MenuItem,
  Select,
  Stack,
  TextField,
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import type { SelectChangeEvent } from '@mui/material';
import { ActionsCell, MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { CarrierListItem } from '../../types';
import { fetchCarriersRequest, setTypeFilter } from '../../store/reducers/carrierPageSlice';
import { carrierPageSlice } from '../../store/reducers/carrierNewPageSlice';

export const { actions: carrierPageActions } = carrierPageSlice;

import {
  selectAllCarriers,
  selectCarrierListLoading,
  selectCarrierCreateLoading,
  selectCarrierPagination,
  selectCarrierTypeFilter,
} from '../../store/selectors/carrierSelectors';
import {
  CarrierNameCellRenderer,
  CarrierOnboardingTypeCellRenderer,
  CarrierTypeCellRenderer,
  CarrierContactCellRenderer,
  CarrierStatusCellRenderer,
} from '../../components/CarrierCellRenderers';

// OWNER_OPERATOR excluded per decision L-010
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
];

type CarrierTab = 'all' | 'company' | 'external';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const CarrierListPage = () => {
  const [activeTab, setActiveTab] = useState<CarrierTab>('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const carriers = useSelector(selectAllCarriers);
  const isLoading = useSelector(selectCarrierListLoading);
  // const isCreateLoading = useSelector(selectCarrierCreateLoading);
  const pagination = useSelector(selectCarrierPagination);
  const typeFilter = useSelector(selectCarrierTypeFilter);

  const [searchQuery, setSearchQuery] = useState('');

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    // dispatch(({ page: 1, limit: 25 }));
    // dispatch();
  }, [dispatch]);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const query = event.target.value;
      setSearchQuery(query);

      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      searchDebounceRef.current = setTimeout(() => {
        dispatch(
          fetchCarriersRequest({
            page: 1,
            limit: pagination.limit,
            search: query,
            type: typeFilter,
          }),
        );
      }, 300);
    },
    [dispatch, pagination.limit, typeFilter],
  );

  const handleTypeFilterChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newFilter = event.target.value;
      dispatch(setTypeFilter(newFilter));
      dispatch(
        fetchCarriersRequest({
          page: 1,
          limit: pagination.limit,
          search: searchQuery,
          type: newFilter,
        }),
      );
    },
    [dispatch, pagination.limit, searchQuery],
  );

  const handleOpenCreate = useCallback(() => {
    navigate('/carriers/create');
  }, [navigate]);

  const handleOpenCreateCompanyAsset = useCallback(() => {
    navigate('/carriers/create?type=COMPANY_ASSET');
  }, [navigate]);

  const handleOpenCreateExternalCarrier = useCallback(() => {
    navigate('/carriers/create?type=EXTERNAL_CARRIER');
  }, [navigate]);

  const actionsConfig = useMemo<ActionsCellConfig<CarrierListItem>>(
    () => ({
      showView: true,
      getViewRoute: (carrier) => `/carriers/${carrier.id}`,
      showEdit: false,
      customActionTooltip: 'Edit',
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Carrier',
        field: 'name',
        minWidth: 120,
        flex: 1,
        cellRenderer: CarrierNameCellRenderer,
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 160,
        cellRenderer: CarrierTypeCellRenderer,
      },
      {
        headerName: 'Contact',
        field: 'email',
        minWidth: 140,
        cellRenderer: CarrierContactCellRenderer,
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 140,
        cellRenderer: CarrierStatusCellRenderer,
      },
      {
        headerName: 'Drivers',
        field: 'driverCount',
        minWidth: 100,
        maxWidth: 120,
        cellStyle: { textAlign: 'center' as const },
      },
      {
        headerName: 'Vehicles',
        field: 'vehicleCount',
        minWidth: 100,
        maxWidth: 120,
        cellStyle: { textAlign: 'center' as const },
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

  console.log('Carriers:', { carriers });

  const kpiData = useMemo(() => {
    const activeCount = carriers.filter((carrier) => carrier.onboardingComplete).length;
    const totalDrivers = carriers.reduce((sum, carrier) => sum + carrier.driverCount, 0);
    const totalVehicles = carriers.reduce((sum, carrier) => sum + carrier.vehicleCount, 0);
    const totalRevenue = carriers.reduce((sum, carrier) => sum + 0, 0);

    return [
      {
        label: 'Total Carriers',
        value: String(carriers.length),
        subtitle: `${activeCount} active`,
      },
      {
        label: 'Total Drivers',
        value: String(totalDrivers),
        subtitle: 'Across all carriers',
      },
      {
        label: 'Total Vehicles',
        value: String(totalVehicles),
        subtitle: 'Across all carriers',
      },
      {
        label: 'Lifetime Revenue',
        value: currencyFormatter.format(totalRevenue),
        subtitle: 'All carriers combined',
      },
    ];
  }, [carriers]);

  const tabOptions = useMemo(
    () => [
      {
        key: 'all',
        label: 'All',
        count: carriers.length,
      },
      {
        key: 'active',
        label: 'Active',
        count: carriers.filter((carrier) => carrier.type === 'COMPANY_ASSET').length,
      },
      {
        key: 'inactive',
        label: 'Inactive',
        count: carriers.filter((carrier) => carrier.type === 'COMPANY_ASSET').length,
      },
      {
        key: 'onboarding',
        label: 'Onboarding Pending',
        count: carriers.filter((carrier) => carrier.type === 'EXTERNAL_CARRIER').length,
      },
    ],
    [carriers],
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
    <PageWrapper isLoading={false} errorContext="CarrierListPage" sx={{ gap: 2 }}>
      <PageHeader
        title="Carriers"
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Carrier
            </Button>
          </Stack>
          // <SplitButton
          //   options={headerActionOptions}
          //   buttonGroupAriaLabel="Carrier actions"
          //   menuAriaLabel="Select carrier action"
          //   buttonVariant="contained"
          //   buttonSize="small"
          //   primaryButtonIcon={<AddIcon fontSize="small" />}
          //   showOptionIcons
          // />
        }
      />

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {kpiData.map((kpiItem) => (
          <Grid key={kpiItem.label} item xs={12} md={6} xl={3}>
            <MainCard sx={{ height: '100%' }}>
              <Typography variant="caption" color="text.secondary">
                {kpiItem.label}
              </Typography>
              <Typography variant="h4" color="text.primary" sx={{ mt: 0.5 }}>
                {kpiItem.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {kpiItem.subtitle}
              </Typography>
            </MainCard>
          </Grid>
        ))}
      </Grid>

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value: CarrierTab) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ minHeight: 40 }}
          >
            {tabOptions.map((tabOption) => (
              <Tab
                key={tabOption.key}
                value={tabOption.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2">{tabOption.label}</Typography>
                    <Chip label={tabOption.count} size="small" />
                  </Stack>
                }
                sx={{ minHeight: 40 }}
              />
            ))}
          </Tabs>
          <Box>
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, MC#, email..."
              size="small"
              sx={{ width: { xs: '100%', lg: 320 } }}
            />
          </Box>
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
              rowData={carriers}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={carriers.length}
              rowCountLabel="carriers"
              noDataMessage="No carriers found"
              gridOptions={{
                domLayout: 'normal',
                pagination: false,
                // paginationPageSize: pagination.limit,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 62,
              }}
              loading={isLoading}
            />
          </Box>
        </Box>
      </MainCard>
    </PageWrapper>
  );
};

export default CarrierListPage;
