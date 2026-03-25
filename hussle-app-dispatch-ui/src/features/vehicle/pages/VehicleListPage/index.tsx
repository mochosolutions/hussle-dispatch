import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Stack,
  TextField,
  Box,
  Grid,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ActionsCell, ListSkeleton, MainCard, NewDataGrid, PageWrapper } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { KpiCell } from 'components/Typography';
import { StatusBadge } from 'components/Statusbadge';
import UpgradePlanDialog from 'components/UpgradePlanDialog';
import { useDispatch, useSelector } from 'store';
import { getSubscriptionUsage } from 'utils/api/team/teamApi';
import { organizationIdSelector } from 'features/auth/store/selectors/authSelector';
import type { Vehicle } from 'features/carrier/types';
import { carrierSelectors } from 'features/carrier/store/reducers/carrierEntitySlice';
import { fetchVehiclesRequest } from '../../store/reducers';
import {
  selectVehicleKpis,
  selectVehicleListLoading,
  selectFilteredVehicles,
} from '../../store/selectors/vehicleSelectors';
import type { VehicleTab } from '../../store/selectors/vehicleSelectors';
import {
  VehicleUnitCellRenderer,
  VehicleTypeCellRenderer,
  VehicleOwnershipCellRenderer,
} from '../../components/VehicleCellRenderers';
import { VehicleCreateDrawer } from '../../components/VehicleCreateDialog';


const VehicleStatusCellRenderer = ({ data }: { data: Vehicle }) => {
  const status = data.isActive ? 'VEHICLE_ACTIVE' : 'VEHICLE_INACTIVE';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <StatusBadge status={status} size="small" />
    </Box>
  );
};

const VehicleListPage = () => {
  const [activeTab, setActiveTab] = useState<VehicleTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [vehicleLimit, setVehicleLimit] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const organizationId = useSelector(organizationIdSelector);

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

  const handleOpenCreate = useCallback(async () => {
    if (!organizationId) {
      return;
    }

    try {
      const usage = await getSubscriptionUsage(organizationId);

      if (usage.vehicles.current >= usage.vehicles.limit) {
        setVehicleLimit(usage.vehicles.limit);
        setUpgradeOpen(true);
        return;
      }
    } catch {
      // If usage check fails, allow creation to proceed
    }

    setCreateDialogOpen(true);
  }, [organizationId]);

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

  const carrierEntities = useSelector(carrierSelectors.selectEntities);

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
        valueGetter: (params: { data: Vehicle }) => {
          if (!params.data.carrierId) {
            return '\u2014';
          }
          return carrierEntities[params.data.carrierId]?.name ?? params.data.carrierId;
        },
      },
      {
        headerName: 'Ownership',
        field: 'ownership',
        minWidth: 120,
        cellRenderer: VehicleOwnershipCellRenderer,
      },
      {
        headerName: 'Driver',
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
    [actionsConfig, carrierEntities],
  );

  const filteredSelector = useMemo(() => selectFilteredVehicles(activeTab), [activeTab]);
  const filteredVehicles = useSelector(filteredSelector);

  const kpiData = useSelector(selectVehicleKpis);

  const handleTabChange = useCallback((event: SelectChangeEvent<VehicleTab>) => {
    setActiveTab(event.target.value as VehicleTab);
  }, []);

  const filterOptions = [
    { value: 'all' as const, label: 'All Vehicles' },
    { value: 'OWNED' as const, label: 'Owned' },
    { value: 'LEASED' as const, label: 'Leased' },
  ];

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
    <PageWrapper isLoading={isLoading} loadingComponent={<ListSkeleton rows={8} />} errorContext="VehicleListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Vehicles"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Vehicle
            </Button>
          </Stack>
        }
      >
        <Grid container spacing={2} sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }}>
          {kpiData.map((kpiItem) => (
            <Grid key={kpiItem.label} item xs={12} md={6} xl={3}>
              <MainCard sx={{ height: '100%' }}>
                <KpiCell label={kpiItem.label} value={kpiItem.value} sub={kpiItem.subtitle} />
              </MainCard>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
              <Select<VehicleTab>
                value={activeTab}
                onChange={handleTabChange}
                size="small"
                sx={{ minWidth: 160 }}
              >
                {filterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
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
        </Box>
      </ListLayout>

      {createDialogOpen && <VehicleCreateDrawer onClose={handleCloseCreate} />}

      <UpgradePlanDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        resourceType="vehicles"
        limit={vehicleLimit}
      />
    </PageWrapper>
  );
};

export default VehicleListPage;
