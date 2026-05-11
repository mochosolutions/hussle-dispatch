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
import { CARRIER_TAB_TO_STATUSES, type CarrierTab } from '../../constants';
import {
  fetchCarriersRequest,
  fetchCarrierTabCountsRequest,
} from '../../store/reducers/carrierNewPageSlice';
import {
  selectCarrierKpis,
  selectFilteredCarriers,
  selectCarrierTabCounts,
} from '../../store/selectors/carrierSelectors';
import {
  CarrierNameCellRenderer,
  CarrierTypeCellRenderer,
  CarrierContactCellRenderer,
  CarrierStatusCellRenderer,
  InvitedAtCellRenderer,
  LastActivityCellRenderer,
  PhaseProgressCellRenderer,
} from '../../components/CarrierCellRenderers';

const CarrierListPage = () => {
  const [activeTab, setActiveTab] = useState<CarrierTab>('all');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const hasLoadedOnce = useSelector((state: RootState) => state.pages.carriers.hasLoadedOnce);
  const kpiSelector = useMemo(() => selectCarrierKpis(activeTab), [activeTab]);
  const kpiData = useSelector(kpiSelector);
  const tabCounts = useSelector(selectCarrierTabCounts);
  const filteredSelector = useMemo(() => selectFilteredCarriers(activeTab), [activeTab]);
  const filteredCarriers = useSelector(filteredSelector);
  const store = useStore<RootState>();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.carriers;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchCarriersRequest({ page: 1, limit: 25 }));
    }
    dispatch(fetchCarrierTabCountsRequest());
  }, [dispatch, store]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      const statuses = CARRIER_TAB_TO_STATUSES[activeTab];
      dispatch(
        fetchCarriersRequest({
          page: 1,
          limit: 25,
          search: String(value),
          ...(statuses !== undefined && { status: statuses }),
        }),
      );
    },
    [dispatch, activeTab],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      const nextTab = value as CarrierTab;
      setActiveTab(nextTab);
      const statuses = CARRIER_TAB_TO_STATUSES[nextTab];
      dispatch(
        fetchCarriersRequest({
          page: 1,
          limit: 25,
          ...(statuses !== undefined && { status: statuses }),
        }),
      );
    },
    [dispatch],
  );

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

  const standardColumns = useMemo<ColDef<CarrierListItem>[]>(
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

  const onboardingColumns = useMemo<ColDef<CarrierListItem>[]>(
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
        headerName: 'Status',
        field: 'status',
        minWidth: 160,
        cellRenderer: CarrierStatusCellRenderer,
      },
      {
        headerName: 'Invited',
        field: 'inviteSentAt',
        minWidth: 130,
        cellRenderer: InvitedAtCellRenderer,
      },
      {
        headerName: 'Last Activity',
        colId: 'lastActivity',
        minWidth: 150,
        cellRenderer: LastActivityCellRenderer,
      },
      {
        headerName: 'Phase Progress',
        colId: 'phaseProgress',
        minWidth: 160,
        cellRenderer: PhaseProgressCellRenderer,
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

  const columnDefs = activeTab === 'onboarding' ? onboardingColumns : standardColumns;

  const tabOptions = useMemo(
    () => [
      { value: 'all', label: `All (${tabCounts.all})` },
      { value: 'onboarding', label: `Onboarding (${tabCounts.onboarding})` },
      { value: 'active', label: `Active (${tabCounts.active})` },
      { value: 'actionRequired', label: `Action Required (${tabCounts.actionRequired})` },
      { value: 'suspended', label: `Suspended (${tabCounts.suspended})` },
      { value: 'rejected', label: `Rejected (${tabCounts.rejected})` },
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
