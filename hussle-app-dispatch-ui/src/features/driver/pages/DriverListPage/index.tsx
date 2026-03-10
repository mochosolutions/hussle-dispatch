import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Stack,
  TextField,
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  MenuItem,
} from '@mui/material';
import { ActionsCell, MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { Driver } from 'features/carrier/types';
import { selectAllCarriers } from 'features/carrier/store/selectors/carrierSelectors';
import { fetchDriversRequest, setCarrierIdFilter } from '../../store/reducers';
import {
  selectAllDrivers,
  selectDriverKpis,
  selectDriverListLoading,
} from '../../store/selectors/driverSelectors';
import {
  DriverNameCellRenderer,
  DriverStatusCellRenderer,
  DriverLocationCellRenderer,
  DriverCarrierCellRenderer,
} from '../../components/DriverCellRenderers';
import { DriverCreateDialog } from '../../components/DriverCreateDialog';

type DriverTab = 'all' | 'available' | 'unavailable';

const DriverListPage = () => {
  const [activeTab, setActiveTab] = useState<DriverTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCarrierId, setSelectedCarrierId] = useState('all');
  const dispatch = useDispatch();

  const drivers = useSelector(selectAllDrivers);
  const isLoading = useSelector(selectDriverListLoading);
  const carriers = useSelector(selectAllCarriers);
  const kpiData = useSelector(selectDriverKpis);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchDriversRequest({ page: 1, limit: 25 }));
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
          fetchDriversRequest({
            page: 1,
            limit: 25,
            search: query,
            carrierId: selectedCarrierId !== 'all' ? selectedCarrierId : undefined,
          }),
        );
      }, 300);
    },
    [dispatch, selectedCarrierId],
  );

  const handleCarrierFilterChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const carrierId = event.target.value;
      setSelectedCarrierId(carrierId);
      dispatch(setCarrierIdFilter(carrierId));
      dispatch(
        fetchDriversRequest({
          page: 1,
          limit: 25,
          search: searchQuery,
          carrierId: carrierId !== 'all' ? carrierId : undefined,
        }),
      );
    },
    [dispatch, searchQuery],
  );

  const handleOpenCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const filteredDrivers = useMemo(() => {
    let filtered = drivers;

    if (selectedCarrierId !== 'all') {
      filtered = filtered.filter((driver) => driver.carrierId === selectedCarrierId);
    }

    if (activeTab === 'available') {
      return filtered.filter((driver) => driver.isAvailable === true);
    }
    if (activeTab === 'unavailable') {
      return filtered.filter((driver) => driver.isAvailable === false);
    }
    return filtered;
  }, [drivers, activeTab, selectedCarrierId]);

  const actionsConfig = useMemo<ActionsCellConfig<Driver>>(
    () => ({
      showView: true,
      getViewRoute: (driver) => `/drivers/${driver.id}`,
      showEdit: false,
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Driver',
        field: 'firstName',
        minWidth: 160,
        flex: 1.5,
        cellRenderer: DriverNameCellRenderer,
      },
      {
        headerName: 'Phone',
        field: 'phone',
        minWidth: 130,
      },
      {
        headerName: 'Carrier',
        field: 'carrierId',
        minWidth: 130,
        cellRenderer: DriverCarrierCellRenderer,
      },
      {
        headerName: 'Status',
        field: 'isAvailable',
        minWidth: 120,
        cellRenderer: DriverStatusCellRenderer,
      },
      {
        headerName: 'Location',
        field: 'currentCity',
        minWidth: 150,
        cellRenderer: DriverLocationCellRenderer,
      },
      {
        headerName: 'Home Base',
        field: 'homeBaseCity',
        minWidth: 150,
        valueGetter: (params: { data: Driver }) => {
          const { homeBaseCity, homeBaseState } = params.data;
          if (homeBaseCity && homeBaseState) {
            return `${homeBaseCity}, ${homeBaseState}`;
          }
          return '\u2014';
        },
      },
      {
        headerName: 'Hours Available',
        field: 'availableHours',
        minWidth: 130,
        valueGetter: (params: { data: Driver }) =>
          params.data.availableHours ? `${params.data.availableHours}h` : '\u2014',
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

  const tabOptions = useMemo(
    () => [
      {
        key: 'all',
        label: 'All',
        count: drivers.length,
      },
      {
        key: 'available',
        label: 'Available',
        count: drivers.filter((driver) => driver.isAvailable === true).length,
      },
      {
        key: 'unavailable',
        label: 'Unavailable',
        count: drivers.filter((driver) => driver.isAvailable === false).length,
      },
    ],
    [drivers],
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
    <PageWrapper isLoading={false} errorContext="DriverListPage" sx={{ gap: 2 }}>
      <PageHeader
        title="Drivers"
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Driver
            </Button>
          </Stack>
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
            onChange={(_event, value: DriverTab) => setActiveTab(value)}
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
          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              select
              value={selectedCarrierId}
              onChange={handleCarrierFilterChange}
              label="Carrier"
              size="small"
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All Carriers</MenuItem>
              {carriers.map((carrier) => (
                <MenuItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, CDL#, phone..."
              size="small"
              sx={{ width: { xs: '100%', lg: 320 } }}
            />
          </Stack>
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
              rowData={filteredDrivers}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={filteredDrivers.length}
              rowCountLabel="drivers"
              noDataMessage="No drivers found"
              gridOptions={{
                domLayout: 'normal',
                pagination: false,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 62,
              }}
              loading={isLoading}
            />
          </Box>
        </Box>
      </MainCard>

      <DriverCreateDialog open={createDialogOpen} onClose={handleCloseCreate} />
    </PageWrapper>
  );
};

export default DriverListPage;
