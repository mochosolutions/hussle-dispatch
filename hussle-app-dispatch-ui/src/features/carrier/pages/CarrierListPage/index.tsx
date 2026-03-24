import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  Stack,
  Box,
  Typography,
  Grid,
  Button,
  MenuItem,
  Select,
  OutlinedInput,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ActionsCell,
  ActionsCellConfig,
  MainCard,
  NewDataGrid,
  PageWrapper,
} from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { useDispatch, useSelector } from 'store';
import type { CarrierListItem } from '../../types';
import { fetchCarriersRequest } from '../../store/reducers/carrierNewPageSlice';
import {
  selectCarrierKpis,
  selectCarrierListLoading,
  selectFilteredCarriers,
  selectCarrierTabCounts,
} from '../../store/selectors/carrierSelectors';
import type { CarrierTab } from '../../store/selectors/carrierSelectors';
import {
  CarrierNameCellRenderer,
  CarrierOnboardingTypeCellRenderer,
  CarrierTypeCellRenderer,
  CarrierContactCellRenderer,
  CarrierStatusCellRenderer,
} from '../../components/CarrierCellRenderers';

const CarrierListPage = () => {
  const [activeTab, setActiveTab] = useState<CarrierTab>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isLoading = useSelector(selectCarrierListLoading);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch(fetchCarriersRequest({ page: 1, limit: 25 }));
  }, []);

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
            limit: 25,
            search: query,
            type: typeFilter,
          }),
        );
      }, 300);
    },
    [dispatch, typeFilter],
  );

  const handleOpenCreate = useCallback(() => {
    navigate('/carriers/create');
  }, [navigate]);

  const handleRowClicked = useCallback(
    (params: { data: CarrierListItem }) => {
      if (params.data) {
        navigate(`/carriers/${params.data.id}`);
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

  const kpiData = useSelector(selectCarrierKpis);

  const filteredSelector = useMemo(() => selectFilteredCarriers(activeTab), [activeTab]);
  const filteredCarriers = useSelector(filteredSelector);

  const tabCounts = useSelector(selectCarrierTabCounts);

  const tabOptions = useMemo(
    () => [
      { key: 'all' as const, label: 'All', count: tabCounts.all },
      { key: 'active' as const, label: 'Active', count: tabCounts.active },
      { key: 'inactive' as const, label: 'Inactive', count: tabCounts.inactive },
      { key: 'onboarding' as const, label: 'Onboarding Pending', count: tabCounts.onboarding },
    ],
    [tabCounts],
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
        <Grid container spacing={2} sx={{ mb: 4, px: { xs: 2, sm: 3 }, pt: 2 }}>
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

        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={activeTab}
                  onChange={(event: SelectChangeEvent) =>
                    setActiveTab(event.target.value as CarrierTab)
                  }
                  size="small"
                  sx={{ minWidth: 200 }}
                >
                  {tabOptions.map((option) => (
                    <MenuItem key={option.key} value={option.key}>
                      {`${option.label} (${option.count})`}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <Stack spacing={1}>
                <InputLabel>Search</InputLabel>
                <OutlinedInput
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, MC#, email..."
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
                  rowData={filteredCarriers}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredCarriers.length}
                  rowCountLabel="carriers"
                  noDataMessage="No carriers found"
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
    </PageWrapper>
  );
};

export default CarrierListPage;
