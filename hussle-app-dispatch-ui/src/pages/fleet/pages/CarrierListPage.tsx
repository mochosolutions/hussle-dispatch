import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Chip, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  ActionsCell,
  ConfirmDeleteDialog,
  MainCard,
  NewDataGrid,
  PageHeader,
  PageWrapper,
} from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import type { Carrier, CreateCarrierInput, UpdateCarrierInput } from '../types';
import type { CarrierFormValues } from '../validators/carrierSchema';
import {
  fetchCarriersRequest,
  createCarrierRequest,
  updateCarrierRequest,
  deleteCarrierRequest,
  setTypeFilter,
} from '../store/reducers/carrierPageSlice';
import {
  selectAllCarriers,
  selectCarrierListLoading,
  selectCarrierCreateLoading,
  selectCarrierPagination,
  selectCarrierTypeFilter,
} from '../store/selectors/carrierSelectors';
import { CarrierFormDialog } from '../components/CarrierFormDialog';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'COMPANY_ASSET', label: 'Company Asset' },
  { value: 'OWNER_OPERATOR', label: 'Owner Operator' },
  { value: 'EXTERNAL_CARRIER', label: 'External Carrier' },
];

const STATUS_CHIP_COLOR: Record<
  string,
  'success' | 'warning' | 'info' | 'default' | 'error'
> = {
  active: 'success',
  pending: 'warning',
  onboarding: 'info',
  inactive: 'error',
};

const ONBOARDING_COMPLETE = ['COMPANY_ASSET', 'OWNER_OPERATOR'];

const CarrierListPage = () => {
  const dispatch = useDispatch();

  const carriers = useSelector(selectAllCarriers);
  const isLoading = useSelector(selectCarrierListLoading);
  const isCreateLoading = useSelector(selectCarrierCreateLoading);
  const pagination = useSelector(selectCarrierPagination);
  const typeFilter = useSelector(selectCarrierTypeFilter);

  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Carrier | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch
  useEffect(() => {
    dispatch(fetchCarriersRequest({ page: 1, limit: 25 }));
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
          fetchCarriersRequest({
            page: 1,
            limit: pagination.limit,
            search: query,
            type: typeFilter,
          }),
        );
      }, 300);
    },
    [dispatch, pagination.limit, typeFilter],
  );

  const handleTypeFilterChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const newFilter = event.target.value;
      dispatch(setTypeFilter(newFilter));
      dispatch(
        fetchCarriersRequest({
          page: 1,
          limit: pagination.limit,
          search: searchQuery,
          type: newFilter,
        }),
      );
    },
    [dispatch, pagination.limit, searchQuery],
  );

  const handleOpenCreate = useCallback(() => {
    setEditingCarrier(null);
    setFormDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setFormDialogOpen(false);
    setEditingCarrier(null);
  }, []);

  const handleFormSubmit = useCallback(
    (values: CarrierFormValues) => {
      const insuranceExpiry =
        values.insuranceExpiry instanceof Date ? values.insuranceExpiry.toISOString() : null;

      if (editingCarrier) {
        const data: UpdateCarrierInput = { ...values, insuranceExpiry };
        dispatch(updateCarrierRequest({ id: editingCarrier.id, data }));
      } else {
        const data: CreateCarrierInput = {
          ...values,
          managedByOrgId: 'org-mock-0001',
          insuranceExpiry,
        };
        dispatch(createCarrierRequest({ data }));
      }
      handleCloseDialog();
    },
    [dispatch, editingCarrier, handleCloseDialog],
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      dispatch(deleteCarrierRequest({ id: deleteTarget.id }));
    }
    setDeleteTarget(null);
  }, [dispatch, deleteTarget]);

  const actionsConfig = useMemo<ActionsCellConfig<Carrier>>(
    () => ({
      showView: true,
      getViewRoute: (carrier) => `/fleet/carriers/${carrier.id}`,
      showEdit: false,
      showDelete: true,
      onDelete: (carrier) => setDeleteTarget(carrier),
      onCustomAction: (carrier) => {
        setEditingCarrier(carrier);
        setFormDialogOpen(true);
      },
      customActionTooltip: 'Edit',
    }),
    [],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Name',
        field: 'name',
        minWidth: 240,
        flex: 1.5,
        cellRenderer: ({ data }: { data: Carrier }) => (
          <Stack direction="column" justifyContent="center" sx={{ height: '100%' }}>
            <Typography
              variant="subtitle2"
              color="primary.main"
              sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {data.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {data.mcNumber ?? '—'}
            </Typography>
          </Stack>
        ),
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 160,
        cellRenderer: ({ value }: { value: Carrier['type'] }) => {
          const isCompanyAsset = value === 'COMPANY_ASSET';
          const label = isCompanyAsset ? 'Company Asset' : 'External Carrier';
          const color = isCompanyAsset ? 'secondary' : 'info';

          return (
            <Chip
              label={label}
              size="small"
              color={color}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        headerName: 'MC Number',
        field: 'mcNumber',
        minWidth: 140,
        valueFormatter: ({ value }: { value: string | null }) => value ?? '—',
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 130,
        cellRenderer: ({ value }: { value: string }) => {
          const chipColor = STATUS_CHIP_COLOR[value] ?? 'default';
          const label = value.charAt(0).toUpperCase() + value.slice(1);

          return (
            <Chip label={label} size="small" color={chipColor} variant="filled" />
          );
        },
      },
      {
        headerName: 'Onboarding',
        field: 'onboardingStatus',
        minWidth: 140,
        cellRenderer: ({ data }: { data: Carrier }) => {
          if (ONBOARDING_COMPLETE.includes(data.type)) {
            return null;
          }

          const isComplete = data.onboardingStatus === 'complete';

          return (
            <Chip
              label={isComplete ? 'Complete' : 'Incomplete'}
              size="small"
              color={isComplete ? 'success' : 'warning'}
              variant="outlined"
            />
          );
        },
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
      <PageHeader
        title="Carriers"
        headerActions={
          <Button variant="contained" onClick={handleOpenCreate}>
            Add Carrier
          </Button>
        }
      />

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          spacing={1.5}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Select
            value={typeFilter}
            onChange={handleTypeFilterChange}
            size="small"
            sx={{ minWidth: 180 }}
          >
            {TYPE_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          <TextField
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name, MC#, email..."
            size="small"
            sx={{ flexGrow: 1, maxWidth: { md: 360 } }}
          />
        </Stack>

        <NewDataGrid
          columnDefs={columnDefs}
          rowData={carriers}
          defaultColDef={defaultColDef}
          showRowCountFooter
          totalRowCount={pagination.total}
          rowCountLabel="carriers"
          noDataMessage="No carriers found"
          gridOptions={{
            domLayout: 'normal',
            pagination: true,
            paginationPageSize: pagination.limit,
            suppressCellFocus: true,
            headerHeight: 44,
            rowHeight: 62,
          }}
          loading={isLoading}
        />
      </MainCard>

      <CarrierFormDialog
        open={formDialogOpen}
        onClose={handleCloseDialog}
        carrier={editingCarrier ?? undefined}
        isLoading={isCreateLoading}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Delete Carrier"
        message={`Are you sure you want to delete ${deleteTarget?.name ?? 'this carrier'}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageWrapper>
  );
};

export default CarrierListPage;
