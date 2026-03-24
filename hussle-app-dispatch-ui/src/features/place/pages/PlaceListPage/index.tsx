import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Stack,
  TextField,
  Box,
  Typography,
  Button,
  MenuItem,
  Select,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
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
import { useDispatch, useSelector } from 'store';
import type { PlaceListItem } from '../../types';
import { fetchPlacesRequest } from '../../store/reducers/placePageSlice';
import {
  selectAllPlaces,
  selectPlaceListLoading,
} from '../../store/selectors/placeSelectors';
import {
  PlaceNameCellRenderer,
  PlaceFacilityTypeCellRenderer,
  PlaceContactCellRenderer,
  PlaceAppointmentCellRenderer,
  PlaceDockTypeCellRenderer,
  PlaceVisitsCellRenderer,
  PlaceLumperCellRenderer,
} from '../../components/PlaceCellRenderers';
import { FACILITY_TYPE_OPTIONS } from '../../constants';
import { useDrawerActions } from '../../../ui/hooks/useDrawerActions';

const FILTER_ALL = 'all';

const PlaceListPage = () => {
  const [facilityTypeFilter, setFacilityTypeFilter] = useState(FILTER_ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useDrawerActions();

  const places = useSelector(selectAllPlaces);
  const isLoading = useSelector(selectPlaceListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(fetchPlacesRequest({ page: 1, limit: 25 }));
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
          fetchPlacesRequest({
            page: 1,
            limit: 25,
            search: query,
            facilityType: facilityTypeFilter === FILTER_ALL ? undefined : facilityTypeFilter,
          }),
        );
      }, 300);
    },
    [dispatch, facilityTypeFilter],
  );

  const handleFacilityTypeFilterChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newFilter = event.target.value;
      setFacilityTypeFilter(newFilter);
      dispatch(
        fetchPlacesRequest({
          page: 1,
          limit: 25,
          search: searchQuery,
          facilityType: newFilter === FILTER_ALL ? undefined : newFilter,
        }),
      );
    },
    [dispatch, searchQuery],
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
    <PageWrapper isLoading={false} errorContext="PlaceListPage" sx={{ gap: 2 }}>
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
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              sx={{ px: 2, py: 1.5 }}
            >
              <Stack spacing={1}>
                <InputLabel>Facility Type</InputLabel>
                <Select
                  value={facilityTypeFilter}
                  onChange={handleFacilityTypeFilterChange}
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value={FILTER_ALL}>All Facility Types</MenuItem>
                  {FACILITY_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <Stack spacing={1}>
                <InputLabel>Search</InputLabel>
                <OutlinedInput
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, city, state..."
                  size="small"
                  sx={{ width: { xs: '100%', lg: 320 } }}
                />
              </Stack>
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', alignSelf: 'flex-end', pb: 0.5 }}
              >
                {places.length} places
              </Typography>
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
                  rowData={places}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={places.length}
                  rowCountLabel="places"
                  noDataMessage="No places found"
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
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

export default PlaceListPage;
