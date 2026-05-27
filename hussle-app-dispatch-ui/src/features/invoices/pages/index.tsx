import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  ColDef,
  RowClickedEvent,
  RowClassParams,
  ValueFormatterParams,
  ValueGetterParams,
} from 'ag-grid-community';
import { Box, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ActionsCell, EmptyState, NewDataGrid, PageWrapper } from '@mocho/ui/components';
import type { ActionsCellConfig } from '@mocho/ui/components';
import { useStore } from 'react-redux';
import { ListLayout } from 'components/ListLayout';
import MainCard from 'components/MainCard';
import ListKpiBar from 'components/ListKpiBar';
import FilterBar from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import { fetchInvoicesRequest } from '../store/reducers';
import {
  selectFilteredInvoices,
  selectInvoiceKpis,
} from '../store/selectors/invoiceSelectors';
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_OPTIONS, INVOICE_TYPE_LABELS } from '../constants';
import type { InvoiceListItem, InvoiceStatus, InvoiceType } from '../types';
import {
  InvoiceStatusCellRenderer,
  InvoiceTypeCellRenderer,
  InvoiceBolFlagCellRenderer,
} from '../components/InvoiceListPage/InvoiceCellRenderers';

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Invoice List Page
// ---------------------------------------------------------------------------

const InvoiceListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const store = useStore<RootState>();

  const hasLoadedOnce = useSelector((state: RootState) => state.pages.invoices.hasLoadedOnce);

  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [selectedType, setSelectedType] = useState<'' | InvoiceType>('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [missingBolOnly, setMissingBolOnly] = useState(false);

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.invoices;
    if (isStale(lastFetchedAt)) {
      dispatch(
        fetchInvoicesRequest({
          page: 1,
          limit: 25,
          ...(selectedType ? { type: selectedType } : {}),
        }),
      );
    }
  }, [dispatch, store, selectedType]);

  const handleRowClicked = useCallback(
    (params: RowClickedEvent<InvoiceListItem>) => {
      if (params.data) {
        navigate(`/invoices/${params.data.id}`);
      }
    },
    [navigate],
  );

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(fetchInvoicesRequest({ page: 1, limit: 25, search: String(value) }));
    },
    [dispatch],
  );

  const filterArgs = useMemo(
    () => ({ selectedStatuses, overdueOnly, missingBolOnly, searchQuery: '' }),
    [selectedStatuses, overdueOnly, missingBolOnly],
  );
  const filteredSelector = useMemo(() => selectFilteredInvoices(filterArgs), [filterArgs]);
  const kpiSelector = useMemo(() => selectInvoiceKpis(filterArgs), [filterArgs]);
  const filteredInvoicesRaw = useSelector(filteredSelector);
  const kpiItems = useSelector(kpiSelector);
  const filteredInvoices = useMemo(
    () =>
      selectedType ? filteredInvoicesRaw.filter((inv) => inv.type === selectedType) : filteredInvoicesRaw,
    [filteredInvoicesRaw, selectedType],
  );

  const actionsConfig = useMemo<ActionsCellConfig<InvoiceListItem>>(
    () => ({
      showView: true,
      getViewRoute: (invoice) => `/invoices/${invoice.id}`,
      showEdit: false,
      showDelete: false,
      viewTooltip: 'View Invoice',
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<InvoiceListItem>[]>(
    () => [
      {
        headerName: 'Invoice #',
        field: 'invoiceNumber',
        minWidth: 130,
        flex: 1,
      },
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 100,
        cellRenderer: InvoiceTypeCellRenderer,
      },
      {
        headerName: 'Load #',
        field: 'load.loadNumber',
        minWidth: 120,
        valueGetter: (params: ValueGetterParams<InvoiceListItem>) =>
          params.data?.load?.loadNumber ?? '\u2014',
      },
      {
        headerName: 'Carrier',
        field: 'carrier.name',
        minWidth: 140,
        valueGetter: (params: ValueGetterParams<InvoiceListItem>) =>
          params.data?.carrier?.name ?? '\u2014',
      },
      {
        headerName: 'Subtotal',
        field: 'subtotal',
        minWidth: 110,
        valueFormatter: (params: ValueFormatterParams<InvoiceListItem>) =>
          params.value !== null && params.value !== undefined
            ? currencyFormatter.format(Number(params.value))
            : '',
      },
      {
        headerName: 'Total',
        field: 'totalAmount',
        minWidth: 110,
        valueFormatter: (params: ValueFormatterParams<InvoiceListItem>) =>
          params.value !== null && params.value !== undefined
            ? currencyFormatter.format(Number(params.value))
            : '',
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 130,
        cellRenderer: InvoiceStatusCellRenderer,
      },
      {
        headerName: 'Due Date',
        field: 'dueDate',
        minWidth: 120,
        valueFormatter: (params: ValueFormatterParams<InvoiceListItem>) =>
          params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '\u2014',
      },
      {
        headerName: 'BOL',
        field: 'missingSignedBol',
        minWidth: 120,
        cellRenderer: InvoiceBolFlagCellRenderer,
      },
      {
        headerName: 'Created',
        field: 'createdAt',
        minWidth: 120,
        valueFormatter: (params: ValueFormatterParams<InvoiceListItem>) =>
          params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '\u2014',
      },
      {
        headerName: '',
        colId: 'actions',
        minWidth: 80,
        maxWidth: 100,
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

  const getRowStyle = useCallback(
    (params: RowClassParams<InvoiceListItem>) => {
      const data: (InvoiceListItem & { isOverdue?: boolean }) | undefined = params.data;
      if (data?.isOverdue) {
        return { backgroundColor: 'rgba(211, 47, 47, 0.06)' };
      }
      return undefined;
    },
    [],
  );

  const statusOptions = useMemo(
    () =>
      INVOICE_STATUS_OPTIONS.map((status) => ({
        value: status,
        label: INVOICE_STATUS_LABELS[status],
      })),
    [],
  );

  const typeOptions = useMemo(
    () => [
      { value: '', label: 'All Types' },
      { value: 'CUSTOMER', label: INVOICE_TYPE_LABELS.CUSTOMER },
      { value: 'DISPATCH_FEE', label: INVOICE_TYPE_LABELS.DISPATCH_FEE },
    ],
    [],
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'multiSelectChip',
        name: 'status',
        label: 'Status',
        options: statusOptions,
        value: selectedStatuses,
        onChange: (values) => setSelectedStatuses(values as InvoiceStatus[]),
      },
      {
        type: 'select',
        name: 'type',
        label: 'Type',
        options: typeOptions,
        value: selectedType,
        onChange: (value) => setSelectedType(value as '' | InvoiceType),
      },
      {
        type: 'toggle',
        name: 'overdueOnly',
        label: 'Overdue',
        checked: overdueOnly,
        onChange: (checked) => setOverdueOnly(checked),
      },
      {
        type: 'toggle',
        name: 'missingBolOnly',
        label: 'Missing BOL',
        checked: missingBolOnly,
        onChange: (checked) => setMissingBolOnly(checked),
      },
    ],
    [statusOptions, selectedStatuses, typeOptions, selectedType, overdueOnly, missingBolOnly],
  );

  const search = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search invoices...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
  );

  return (
    <PageWrapper errorContext="InvoiceListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Invoices"
        primaryAction={
          <Stack direction="row" spacing={1}>
            {/* <Button variant="outlined">Export</Button>
            <Button variant="contained">Create</Button> */}
          </Stack>
        }
      >
        <ListKpiBar
          items={kpiItems}
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
            <FilterBar
              filters={filters}
              search={search}
              sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
            />

            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ flex: 1, minHeight: { xs: 300, md: 420 } }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={filteredInvoices}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={filteredInvoices.length}
                  rowCountLabel="invoices"
                  noDataComponent={<EmptyState variant="no-results" entityName="Invoices" compact />}
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 56,
                    onRowClicked: handleRowClicked,
                    getRowStyle,
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

export default InvoiceListPage;
