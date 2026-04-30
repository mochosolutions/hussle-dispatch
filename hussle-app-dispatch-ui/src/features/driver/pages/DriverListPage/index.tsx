import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ActionsCell, MainCard, NewDataGrid, PageWrapper } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { EmptyState } from 'mocho/components/EmptyState';
import FilterBar from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import ListKpiBar from 'components/ListKpiBar';
import { ListLayout } from 'components/ListLayout';
import { useStore } from 'react-redux';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import type { Driver } from 'features/carrier/types';
import { selectAllCarriers } from 'features/carrier/store/selectors/carrierSelectors';
import { fetchDriversRequest, setCarrierIdFilter, setQuery } from '../../store/reducers';
import {
  selectDriverKpis,
  selectFilteredDrivers,
} from '../../store/selectors/driverSelectors';
import type { DriverTab } from '../../store/selectors/driverSelectors';
import {
  DriverNameCellRenderer,
  DriverStatusCellRenderer,
  DriverLocationCellRenderer,
  DriverCarrierCellRenderer,
} from '../../components/DriverCellRenderers';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';

const DriverListPage = () => {
  const [activeTab, setActiveTab] = useState<DriverTab>('all');
  const [selectedCarrierId, setSelectedCarrierId] = useState('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useDrawerActions();

  const hasLoadedOnce = useSelector((state: RootState) => state.pages.drivers.hasLoadedOnce);
  const carriers = useSelector(selectAllCarriers);
  const kpiSelector = useMemo(() => selectDriverKpis(activeTab, selectedCarrierId), [activeTab, selectedCarrierId]);
  const kpiData = useSelector(kpiSelector);
  const store = useStore<RootState>();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.drivers;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchDriversRequest({ page: 1, limit: 25 }));
    }
  }, [dispatch, store]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      const next = String(value);
      dispatch(setQuery(next));
      dispatch(
        fetchDriversRequest({
          page: 1,
          limit: 25,
          search: next,
          carrierId: selectedCarrierId !== 'all' ? selectedCarrierId : undefined,
        }),
      );
    },
    [dispatch, selectedCarrierId],
  );

  const handleCarrierFilterChange = useCallback(
    (carrierId: string) => {
      setSelectedCarrierId(carrierId);
      dispatch(setCarrierIdFilter(carrierId));
      const currentQuery = store.getState().pages.drivers.query;
      dispatch(
        fetchDriversRequest({
          page: 1,
          limit: 25,
          search: currentQuery,
          carrierId: carrierId !== 'all' ? carrierId : undefined,
        }),
      );
    },
    [dispatch, store],
  );

  const handleStatusFilterChange = useCallback((value: string) => {
    setActiveTab(value as DriverTab);
  }, []);

  const handleOpenCreate = useCallback(() => {
    openDrawer('driverCreate', { onClose: () => undefined });
  }, [openDrawer]);

  const handleRowClicked = useCallback(
    (params: { data: Driver }) => {
      if (params.data) {
        navigate(`/drivers/${params.data.id}`);
      }
    },
    [navigate],
  );

  const filteredSelector = useMemo(
    () => selectFilteredDrivers(activeTab, selectedCarrierId),
    [activeTab, selectedCarrierId],
  );
  const filteredDrivers = useSelector(filteredSelector);

  const actionsConfig = useMemo<ActionsCellConfig<Driver>>(
    () => ({
      showView: true,
      getViewRoute: (driver) => `/drivers/${driver.id}`,
      showEdit: false,
    }),
    [],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Drivers' },
      { value: 'available', label: 'Available' },
      { value: 'unavailable', label: 'Unavailable' },
    ],
    [],
  );

  const carrierOptions = useMemo(
    () => [
      { value: 'all', label: 'All Carriers' },
      ...carriers.map((c) => ({ value: c.id, label: c.name })),
    ],
    [carriers],
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: statusFilterOptions,
        value: activeTab,
        onChange: handleStatusFilterChange,
      },
      {
        type: 'select',
        name: 'carrier',
        label: 'Carrier',
        options: carrierOptions,
        value: selectedCarrierId,
        onChange: handleCarrierFilterChange,
      },
    ],
    [statusFilterOptions, carrierOptions, activeTab, selectedCarrierId, handleStatusFilterChange, handleCarrierFilterChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by name, CDL#, phone...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
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
        field: 'carrierName',
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
    <PageWrapper errorContext="DriverListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Drivers"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Driver
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
              <FilterBar filters={filters} search={searchConfig} />
            </Box>

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredDrivers}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredDrivers.length}
                  rowCountLabel="drivers"
                  noDataComponent={<EmptyState variant="no-results" entityName="Drivers" compact />}
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

export default DriverListPage;
