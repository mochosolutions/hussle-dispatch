import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';
import { useDispatch, useSelector } from 'store';
import { fetchInvoicesRequest } from '../store/reducers';
import {
  selectInvoicesWithOverdueFlag,
  selectInvoiceListLoading,
  selectInvoiceStatusCounts,
  selectOverdueInvoiceCount,
} from '../store/selectors/invoiceSelectors';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_TYPE_LABELS,
  INVOICE_STATUS_OPTIONS,
} from '../constants';
import type { InvoiceListItem, InvoiceStatus } from '../types';

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

const StatusCellRenderer = ({ data }: { data: InvoiceListItem & { isOverdue: boolean } }) => (
  <Chip
    label={INVOICE_STATUS_LABELS[data.status]}
    size="small"
    variant="outlined"
    sx={{
      fontWeight: 600,
      color: INVOICE_STATUS_COLORS[data.status],
      borderColor: INVOICE_STATUS_COLORS[data.status],
    }}
  />
);

const TypeCellRenderer = ({ data }: { data: InvoiceListItem }) => (
  <Chip
    label={INVOICE_TYPE_LABELS[data.invoiceType]}
    size="small"
    variant="filled"
    sx={{ fontWeight: 500 }}
  />
);

const BolFlagCellRenderer = ({ data }: { data: InvoiceListItem }) => {
  if (!data.missingBol) {
    return null;
  }
  return (
    <Chip
      label="Missing BOL"
      size="small"
      color="warning"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
};

// ---------------------------------------------------------------------------
// Invoice List Page
// ---------------------------------------------------------------------------

const InvoiceListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const invoices = useSelector(selectInvoicesWithOverdueFlag);
  const isLoading = useSelector(selectInvoiceListLoading);
  const statusCounts = useSelector(selectInvoiceStatusCounts);
  const overdueCount = useSelector(selectOverdueInvoiceCount);

  const [selectedStatuses, setSelectedStatuses] = useState<InvoiceStatus[]>([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [missingBolOnly, setMissingBolOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchInvoicesRequest({ page: 1, limit: 25 }));
  }, [dispatch]);

  const handleRowClicked = useCallback(
    (params: { data: InvoiceListItem }) => {
      if (params.data) {
        navigate(`/invoices/${params.data.id}`);
      }
    },
    [navigate],
  );

  const handleStatusToggle = useCallback((status: InvoiceStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  }, []);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    if (selectedStatuses.length > 0) {
      result = result.filter((inv) => selectedStatuses.includes(inv.status));
    }

    if (overdueOnly) {
      result = result.filter((inv) => inv.isOverdue);
    }

    if (missingBolOnly) {
      result = result.filter((inv) => inv.missingBol);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(query) ||
          (inv.loadNumber?.toLowerCase().includes(query) ?? false) ||
          (inv.carrierName?.toLowerCase().includes(query) ?? false),
      );
    }

    return result;
  }, [invoices, selectedStatuses, overdueOnly, missingBolOnly, searchQuery]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Invoice #',
        field: 'invoiceNumber',
        minWidth: 130,
        flex: 1,
      },
      {
        headerName: 'Type',
        field: 'invoiceType',
        minWidth: 100,
        cellRenderer: TypeCellRenderer,
      },
      {
        headerName: 'Load #',
        field: 'loadNumber',
        minWidth: 120,
        valueGetter: (params: { data: InvoiceListItem }) =>
          params.data.loadNumber ?? '\u2014',
      },
      {
        headerName: 'Carrier',
        field: 'carrierName',
        minWidth: 140,
        valueGetter: (params: { data: InvoiceListItem }) =>
          params.data.carrierName ?? '\u2014',
      },
      {
        headerName: 'Subtotal',
        field: 'subtotal',
        minWidth: 110,
        valueFormatter: (params: { value: number }) => currencyFormatter.format(params.value),
      },
      {
        headerName: 'Total',
        field: 'grandTotal',
        minWidth: 110,
        valueFormatter: (params: { value: number }) => currencyFormatter.format(params.value),
      },
      {
        headerName: 'Status',
        field: 'status',
        minWidth: 130,
        cellRenderer: StatusCellRenderer,
      },
      {
        headerName: 'Due Date',
        field: 'dueDate',
        minWidth: 120,
        valueFormatter: (params: { value: string }) =>
          params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '\u2014',
      },
      {
        headerName: 'BOL',
        field: 'missingBol',
        minWidth: 120,
        cellRenderer: BolFlagCellRenderer,
      },
      {
        headerName: 'Created',
        field: 'createdAt',
        minWidth: 120,
        valueFormatter: (params: { value: string }) =>
          params.value ? format(new Date(params.value), 'MM/dd/yyyy') : '\u2014',
      },
    ],
    [],
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
    (params: { data: InvoiceListItem & { isOverdue: boolean } }) => {
      if (params.data?.isOverdue) {
        return { backgroundColor: 'rgba(211, 47, 47, 0.06)' };
      }
      return undefined;
    },
    [],
  );

  return (
    <PageWrapper isLoading={false} errorContext="InvoiceListPage" sx={{ gap: 2 }}>
      <PageHeader title="Invoices" />

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        {/* Filter bar */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {INVOICE_STATUS_OPTIONS.map((status) => {
              const count = statusCounts[status];
              const isSelected = selectedStatuses.includes(status);
              return (
                <Chip
                  key={status}
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {count}
                      </Typography>
                      <Typography variant="caption">
                        {INVOICE_STATUS_LABELS[status]}
                      </Typography>
                    </Stack>
                  }
                  size="small"
                  variant={isSelected ? 'filled' : 'outlined'}
                  color={isSelected ? 'primary' : 'default'}
                  onClick={() => handleStatusToggle(status)}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
            {overdueCount > 0 && (
              <Chip
                label={`${overdueCount} OVERDUE`}
                size="small"
                color="error"
                variant="outlined"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={overdueOnly}
                  onChange={(_e, checked) => setOverdueOnly(checked)}
                />
              }
              label={<Typography variant="caption">Overdue</Typography>}
              sx={{ mr: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={missingBolOnly}
                  onChange={(_e, checked) => setMissingBolOnly(checked)}
                />
              }
              label={<Typography variant="caption">Missing BOL</Typography>}
              sx={{ mr: 0 }}
            />
            <TextField
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search invoices..."
              size="small"
              sx={{ width: { xs: '100%', lg: 240 } }}
            />
          </Stack>
        </Stack>

        {/* Grid */}
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
            <NewDataGrid
              columnDefs={columnDefs}
              rowData={filteredInvoices}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={filteredInvoices.length}
              rowCountLabel="invoices"
              noDataMessage="No invoices found"
              gridOptions={{
                domLayout: 'normal',
                pagination: true,
                paginationPageSize: 25,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 52,
                onRowClicked: handleRowClicked,
                getRowStyle,
              }}
              loading={isLoading}
            />
          </Box>
        </Box>
      </MainCard>
    </PageWrapper>
  );
};

export default InvoiceListPage;
