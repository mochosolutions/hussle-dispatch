import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import { Stack, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ActionsCell,
  ActionsCellConfig,
  MainCard,
  NewDataGrid,
  PageWrapper,
} from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { FilterBar } from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import ListKpiBar from 'components/ListKpiBar';
import { EmptyState } from 'mocho/components/EmptyState/EmptyState';
import { useStore } from 'react-redux';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import type { CarrierListItem } from '../../types';
import { fetchCarriersRequest } from '../../store/reducers/carrierNewPageSlice';
import {
  selectCarrierKpis,
  selectFilteredCarriers,
  selectCarrierTabCounts,
} from '../../store/selectors/carrierSelectors';
import type { CarrierTab } from '../../store/selectors/carrierSelectors';
import {
  CarrierNameCellRenderer,
  CarrierTypeCellRenderer,
  CarrierContactCellRenderer,
  CarrierStatusCellRenderer,
} from '../../components/CarrierCellRenderers';

const CarrierListPage = () => {
  const [activeTab, setActiveTab] = useState<CarrierTab>('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hasLoadedOnce = useSelector((state: RootState) => state.pages.carriers.hasLoadedOnce);
  const kpiData = useSelector(selectCarrierKpis);
  const tabCounts = useSelector(selectCarrierTabCounts);
  const filteredSelector = useMemo(() => selectFilteredCarriers(activeTab), [activeTab]);
  const filteredCarriers = useSelector(filteredSelector);
  const store = useStore<RootState>();

  useEffect(() => {
    // Read lastFetchedAt at effect time so the effect deps stay stable
    // (depending on lastFetchedAt would loop: success updates it, which retriggers the fetch).
    const { lastFetchedAt } = store.getState().pages.carriers;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchCarriersRequest({ page: 1, limit: 25 }));
    }
  }, [dispatch, store]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(
        fetchCarriersRequest({
          page: 1,
          limit: 25,
          search: String(value),
        }),
      );
    },
    [dispatch],
  );

  const handleStatusChange = useCallback((value: string) => {
    setActiveTab(value as CarrierTab);
  }, []);

  const handleOpenCreate = useCallback(() => {
    navigate('/carriers/create');
  }, [navigate]);

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<CarrierListItem>) => {
      if (event.data) {
        navigate(`/carriers/${event.data.id}`);
      }
    },
    [navigate],
  );

  const actionsConfig = useMemo<ActionsCellConfig<CarrierListItem>>(
    () => ({
      showView: true,
      getViewRoute: (carrier) => `/carriers/${carrier.id}`,
      showEdit: false,
      customActionTooltip: 'Edit',
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<CarrierListItem>[]>(
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
        minWidth: 180,
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
        colId: 'actions',
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
      { value: 'all', label: `All (${tabCounts.all})` },
      { value: 'active', label: `Active (${tabCounts.active})` },
      { value: 'inactive', label: `Inactive (${tabCounts.inactive})` },
      { value: 'onboarding', label: `Onboarding Pending (${tabCounts.onboarding})` },
    ],
    [tabCounts],
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: tabOptions,
        value: activeTab,
        onChange: handleStatusChange,
      },
    ],
    [tabOptions, activeTab, handleStatusChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by name, MC#, email...',
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
    <PageWrapper errorContext="CarrierListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Carriers"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Add Carrier
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
              <Box
                sx={{
                  minHeight: { xs: 300, md: 420 },
                  flex: 1,
                }}
              >
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredCarriers}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredCarriers.length}
                  rowCountLabel="carriers"
                  noDataMessage="No carriers found"
                  noDataComponent={
                    <EmptyState variant="no-results" entityName="Carriers" compact />
                  }
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

export default CarrierListPage;
