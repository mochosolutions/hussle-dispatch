import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ActionsCell, EmptyState, MainCard, PageWrapper, NewDataGrid } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import FilterBar from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import ListKpiBar from 'components/ListKpiBar';
import { useStore } from 'react-redux';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import type { Vehicle } from 'features/carrier/types';
import { carrierSelectors } from 'features/carrier/store/reducers/carrierEntitySlice';
import { fetchSubscriptionUsageRequest } from 'features/settings/store/reducers/teamSlice';
import { selectSubscriptionUsage } from 'features/settings/store/selectors/settingsSelectors';
import { fetchVehiclesRequest } from '../../store/reducers';
import {
  selectVehicleKpis,
  selectFilteredVehicles,
} from '../../store/selectors/vehicleSelectors';
import type { VehicleTab } from '../../store/selectors/vehicleSelectors';
import {
  VehicleUnitCellRenderer,
  VehicleTypeCellRenderer,
  VehicleOwnershipCellRenderer,
} from '../../components/VehicleCellRenderers';
import { VehicleStatusCellRenderer } from '../../components/VehicleListPage/VehicleStatusCellRenderer';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import { useModalActions } from 'features/ui/hooks/useModalActions';

const OWNERSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Vehicles' },
  { value: 'OWNED' as const, label: 'Owned' },
  { value: 'LEASED' as const, label: 'Leased' },
];

const VehicleListPage = () => {
  const [activeTab, setActiveTab] = useState<VehicleTab>('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useDrawerActions();
  const { openModal } = useModalActions();

  const hasLoadedOnce = useSelector((state: RootState) => state.pages.vehicles.hasLoadedOnce);
  const subscriptionUsage = useSelector(selectSubscriptionUsage);
  const store = useStore<RootState>();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.vehicles;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchVehiclesRequest({ page: 1, limit: 25 }));
    }
  }, [dispatch, store]);

  useEffect(() => {
    const { usageLastFetchedAt } = store.getState().pages.team;
    if (isStale(usageLastFetchedAt)) {
      dispatch(fetchSubscriptionUsageRequest());
    }
  }, [dispatch, store]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(fetchVehiclesRequest({ page: 1, limit: 25, search: String(value) }));
    },
    [dispatch],
  );

  const handleOpenCreate = useCallback(() => {
    if (
      subscriptionUsage &&
      subscriptionUsage.vehicles.current >= subscriptionUsage.vehicles.limit
    ) {
      openModal('upgradePlan', {
        resourceType: 'vehicles',
        limit: subscriptionUsage.vehicles.limit,
      });
      return;
    }

    openDrawer('vehicleCreate', { onClose: () => undefined });
  }, [subscriptionUsage, openDrawer, openModal]);

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
          return carrierEntities[params.data.carrierId]?.name ?? '\u2014';
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

  const kpiSelector = useMemo(() => selectVehicleKpis(activeTab), [activeTab]);
  const kpiData = useSelector(kpiSelector);

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'select',
        name: 'tab',
        label: 'Ownership',
        options: OWNERSHIP_FILTER_OPTIONS,
        value: activeTab,
        onChange: (value) => setActiveTab(value as VehicleTab),
      },
    ],
    [activeTab],
  );

  const search = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by unit#, make, model...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
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
    <PageWrapper errorContext="VehicleListPage" sx={{ gap: 2 }}>
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
        <ListKpiBar
          items={kpiData}
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
              <FilterBar filters={filters} search={search} />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredVehicles}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredVehicles.length}
                  rowCountLabel="vehicles"
                  noDataComponent={<EmptyState variant="no-results" entityName="Vehicles" compact />}
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
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

export default VehicleListPage;
