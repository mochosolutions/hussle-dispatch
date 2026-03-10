import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ActionsCell, MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { Vehicle } from 'features/carrier/types';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { fetchVehiclesRequest } from '../../store/reducers';
import {
  selectAllVehicles,
  selectVehicleKpis,
  selectVehicleListLoading,
} from '../../store/selectors/vehicleSelectors';
import {
  VehicleUnitCellRenderer,
  VehicleTypeCellRenderer,
  VehicleOwnershipCellRenderer,
} from '../../components/VehicleCellRenderers';
import { VehicleCreateDialog } from '../../components/VehicleCreateDialog';

type VehicleTab = 'all' | 'OWNED' | 'LEASED';

const VehicleStatusCellRenderer = ({ data }: { data: Vehicle }) => {
  const color = data.isActive ? 'success' : 'default';
  const label = data.isActive ? 'Active' : 'Inactive';

  return (
    <Chip label={label} size="small" color={color} variant="outlined" sx={{ fontWeight: 600 }} />
  );
};

const VehicleListPage = () => {
  const [activeTab, setActiveTab] = useState<VehicleTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const vehicles = useSelector(selectAllVehicles);
  const isLoading = useSelector(selectVehicleListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchVehiclesRequest({ page: 1, limit: 25 }));
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
          fetchVehiclesRequest({
            page: 1,
            limit: 25,
            search: query,
          }),
        );
      }, 300);
    },
    [dispatch],
  );

  const handleOpenCreate = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleRowClicked = useCallback(
    (params: { data: Vehicle }) => {
      if (params.data) {
        navigate(`/vehicles/${params.data.id}`);
      }
    },
    [navigate],
  );

  const actionsConfig = useMemo<ActionsCellConfig<Vehicle>>(
    () => ({
      showView: true,
      getViewRoute: (vehicle) => `/vehicles/${vehicle.id}`,
      showEdit: false,
      customActionTooltip: 'Edit',
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Unit#',
        field: 'unitNumber',
        minWidth: 120,
        flex: 1.5,
        cellRenderer: VehicleUnitCellRenderer,
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 120,
        cellRenderer: VehicleTypeCellRenderer,
      },
      {
        headerName: 'Carrier',
        field: 'carrierId',
        minWidth: 120,
        valueGetter: () => '\u2014',
      },
      {
        headerName: 'Ownership',
        field: 'ownership',
        minWidth: 120,
        cellRenderer: VehicleOwnershipCellRenderer,
      },
      {
        headerName: 'Assigned Driver',
        field: 'driverId',
        minWidth: 140,
        valueGetter: (params: { data: Vehicle }) => {
          if (!params.data.driverId) {
            return '\u2014';
          }
          return 'Assigned';
        },
      },
      {
        headerName: 'Year/Make/Model',
        field: 'make',
        minWidth: 180,
        valueGetter: (params: { data: Vehicle }) => {
          const { year, make, model } = params.data;
          return [year, make, model].filter(Boolean).join(' ') || '\u2014';
        },
      },
      {
        headerName: 'Status',
        field: 'isActive',
        minWidth: 110,
        cellRenderer: VehicleStatusCellRenderer,
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

  const filteredVehicles = useMemo(() => {
    if (activeTab === 'all') {
      return vehicles;
    }
    return vehicles.filter((vehicle) => vehicle.ownership === activeTab);
  }, [vehicles, activeTab]);

  const kpiData = useSelector(selectVehicleKpis);

  const tabOptions = useMemo(
    () => [
      {
        key: 'all',
        label: 'All',
        count: vehicles.length,
      },
      {
        key: 'OWNED',
        label: 'Owned',
        count: vehicles.filter((vehicle) => vehicle.ownership === 'OWNED').length,
      },
      {
        key: 'LEASED',
        label: 'Leased',
        count: vehicles.filter((vehicle) => vehicle.ownership === 'LEASED').length,
      },
    ],
    [vehicles],
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
    <PageWrapper isLoading={false} errorContext="VehicleListPage" sx={{ gap: 2 }}>
      <PageHeader
        title="Vehicles"
        headerActions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Vehicle
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
            onChange={(_event, value: VehicleTab) => setActiveTab(value)}
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
              placeholder="Search by unit#, make, model..."
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
              rowData={filteredVehicles}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={filteredVehicles.length}
              rowCountLabel="vehicles"
              noDataMessage="No vehicles found"
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

      <VehicleCreateDialog open={createDialogOpen} onClose={handleCloseCreate} />
    </PageWrapper>
  );
};

export default VehicleListPage;
