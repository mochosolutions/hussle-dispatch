import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import type { PlaceListItem, FacilityType } from '../../types';
import { fetchPlacesRequest } from '../../store/reducers/placePageSlice';
import { selectFormattedPlaces } from '../../store/selectors/placeSelectors';
import {
  PlaceNameCellRenderer,
  PlaceFacilityTypeCellRenderer,
  PlaceContactCellRenderer,
  PlaceAppointmentCellRenderer,
  PlaceDockTypeCellRenderer,
  PlaceVisitsCellRenderer,
  PlaceLumperCellRenderer,
} from '../../components/PlaceCellRenderers';
import { FACILITY_TYPE_OPTIONS, FACILITY_TYPE_LABELS } from '../../constants';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

const FILTER_ALL = 'all';

const facilityTypeFilterOptions = [
  { value: FILTER_ALL, label: 'All Facility Types' },
  ...FACILITY_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
];

const PlaceListPage = () => {
  const facilityTypeRef = useRef(FILTER_ALL);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useDrawerActions();

  const places = useSelector(selectFormattedPlaces);
  const hasLoadedOnce = useSelector((state: RootState) => state.pages.places.hasLoadedOnce);
  const store = useStore<RootState>();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.places;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchPlacesRequest({ page: 1, limit: 25 }));
    }
  }, [dispatch, store]);

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(
        fetchPlacesRequest({
          page: 1,
          limit: 25,
          search: String(value),
          facilityType: facilityTypeRef.current === FILTER_ALL ? undefined : facilityTypeRef.current,
        }),
      );
    },
    [dispatch],
  );

  const handleFacilityTypeFilterChange = useCallback(
    (newFilter: string) => {
      facilityTypeRef.current = newFilter;
      dispatch(
        fetchPlacesRequest({
          page: 1,
          limit: 25,
          facilityType: newFilter === FILTER_ALL ? undefined : newFilter,
        }),
      );
    },
    [dispatch],
  );

  const handleRowClicked = useCallback(
    (params: { data: PlaceListItem }) => {
      if (params.data) {
        navigate(`/places/${params.data.id}`);
      }
    },
    [navigate],
  );

  const handleOpenCreate = useCallback(() => {
    openDrawer('placeInfo', { placeId: undefined });
  }, [openDrawer]);

  const kpiItems = useMemo(() => {
    const counts = places.reduce<Partial<Record<FacilityType, number>>>((acc, place) => {
      if (place.facilityType) {
        acc[place.facilityType] = (acc[place.facilityType] ?? 0) + 1;
      }
      return acc;
    }, {});

    const topTypes = Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({
        label: FACILITY_TYPE_LABELS[type as FacilityType],
        value: count,
      }));

    return [{ label: 'Total Places', value: places.length }, ...topTypes];
  }, [places]);

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'select',
        name: 'facilityType',
        label: 'Facility Type',
        options: facilityTypeFilterOptions,
        value: FILTER_ALL,
        onChange: handleFacilityTypeFilterChange,
      },
    ],
    [handleFacilityTypeFilterChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search by name, city, state...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
  );

  const actionsConfig = useMemo<ActionsCellConfig<PlaceListItem>>(
    () => ({
      showView: true,
      getViewRoute: (place) => `/places/${place.id}`,
      showEdit: true,
      onEdit: (place) => openDrawer('placeInfo', { placeId: place.id }),
      customActionTooltip: 'Edit',
    }),
    [openDrawer],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        minWidth: 180,
        flex: 1.5,
        cellRenderer: PlaceNameCellRenderer,
      },
      {
        headerName: 'Facility Type',
        field: 'facilityType',
        minWidth: 160,
        cellRenderer: PlaceFacilityTypeCellRenderer,
      },
      {
        headerName: 'Visits',
        field: 'visitCount',
        minWidth: 90,
        maxWidth: 110,
        cellRenderer: PlaceVisitsCellRenderer,
        cellStyle: { textAlign: 'center' as const },
      },
      {
        headerName: 'Lumper',
        field: 'lumperRequired',
        minWidth: 100,
        maxWidth: 120,
        cellRenderer: PlaceLumperCellRenderer,
      },
      {
        headerName: 'Appointment',
        field: 'appointmentRequired',
        minWidth: 120,
        cellRenderer: PlaceAppointmentCellRenderer,
      },
      {
        headerName: 'Dock Type',
        field: 'dockType',
        minWidth: 120,
        cellRenderer: PlaceDockTypeCellRenderer,
      },
      {
        headerName: 'Contact',
        field: 'contactName',
        minWidth: 160,
        cellRenderer: PlaceContactCellRenderer,
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
    <PageWrapper errorContext="PlaceListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Places"
        primaryAction={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button onClick={handleOpenCreate} variant="contained">
              Create Place
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
            <FilterBar filters={filters} search={searchConfig} />

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box
                sx={{
                  minHeight: { xs: 300, md: 420 },
                  flex: 1,
                }}
              >
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={places}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={places.length}
                  rowCountLabel="places"
                  noDataComponent={<EmptyState variant="no-data" entityName="Places" />}
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

export default PlaceListPage;
