import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { MainCard, NewDataGrid, PageWrapper, ListSkeleton } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { getExpenses } from 'utils/api/accounting/expenseApi';
import { ExpenseQuickAddDrawer } from '../../components/ExpenseQuickAddDrawer';
import type { ExpenseListItem } from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'TOLLS', label: 'Tolls' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'TRUCK_PAYMENT', label: 'Truck Payment' },
  { value: 'TRAILER_RENTAL', label: 'Trailer Rental' },
  { value: 'PERMITS_TAGS', label: 'Permits & Tags' },
  { value: 'SCALES', label: 'Scales' },
  { value: 'LUMPER', label: 'Lumper' },
  { value: 'TIRES', label: 'Tires' },
  { value: 'OIL_CHANGE', label: 'Oil Change' },
  { value: 'DEF_FLUID', label: 'DEF Fluid' },
  { value: 'TRUCK_WASH', label: 'Truck Wash' },
];

const CATEGORY_LABEL_MAP: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.filter((o) => o.value !== 'ALL').map((o) => [o.value, o.label]),
);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: string | number): string =>
  currencyFormatter.format(Number(value));

const formatDate = (value: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

const DateCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatDate(value)}
  </Box>
);

const CurrencyCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatCurrency(value)}
  </Box>
);

const CategoryCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Chip label={CATEGORY_LABEL_MAP[value] ?? value} size="small" variant="outlined" />
  </Box>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExpenseListPage = () => {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch expenses
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page: 1, limit: 500 };
        if (category !== 'ALL') {
          params.category = category;
        }
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        if (dateFrom) {
          params.dateFrom = dateFrom;
        }
        if (dateTo) {
          params.dateTo = dateTo;
        }

        const result = await getExpenses(params as Parameters<typeof getExpenses>[0]);

        if (!cancelled) {
          setExpenses(result.data);
          setTotalCount(result.meta.total);
        }
      } catch {
        if (!cancelled) {
          setExpenses([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [category, debouncedSearch, dateFrom, dateTo, refreshKey]);

  const handleCategoryChange = useCallback((event: SelectChangeEvent) => {
    setCategory(event.target.value);
  }, []);

  const handleDrawerSuccess = useCallback(() => {
    setDrawerOpen(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Column definitions
  const columnDefs = useMemo<ColDef<ExpenseListItem>[]>(
    () => [
      {
        headerName: 'Date',
        field: 'date',
        minWidth: 140,
        sort: 'desc' as const,
        cellRenderer: DateCellRenderer,
      },
      {
        headerName: 'Category',
        field: 'category',
        minWidth: 160,
        cellRenderer: CategoryCellRenderer,
      },
      {
        headerName: 'Description',
        field: 'description',
        minWidth: 200,
        flex: 2,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        minWidth: 120,
        cellRenderer: CurrencyCellRenderer,
      },
      {
        headerName: 'Vehicle',
        field: 'vehicleUnitNumber',
        minWidth: 120,
      },
      {
        headerName: 'State',
        field: 'state',
        width: 80,
      },
      {
        headerName: 'Gallons',
        field: 'gallons',
        minWidth: 100,
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 80,
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  return (
    <PageWrapper
      isLoading={loading && expenses.length === 0}
      loadingComponent={<ListSkeleton rows={8} />}
      errorContext="ExpenseListPage"
      sx={{ gap: 2 }}
    >
      <ListLayout
        title="Expenses"
        primaryAction={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>
            Add Expense
          </Button>
        }
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 3,
            pt: 2,
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
            {/* Filters toolbar */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'flex-end' }}
              spacing={2}
              sx={{ px: 2, py: 1.5 }}
            >
              <Stack spacing={0.5} sx={{ minWidth: 220 }}>
                <InputLabel>Search</InputLabel>
                <OutlinedInput
                  size="small"
                  placeholder="Search expenses..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  startAdornment={<SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} />}
                />
              </Stack>

              <Stack spacing={0.5} sx={{ minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={handleCategoryChange}
                  size="small"
                  sx={{ minWidth: 180 }}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Stack spacing={0.5}>
                <InputLabel>From</InputLabel>
                <TextField
                  type="date"
                  size="small"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack spacing={0.5}>
                <InputLabel>To</InputLabel>
                <TextField
                  type="date"
                  size="small"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </Stack>

            {/* Data grid */}
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid
                  columnDefs={columnDefs}
                  rowData={expenses}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={totalCount}
                  rowCountLabel="expenses"
                  noDataMessage="No expenses found"
                  gridOptions={{
                    domLayout: 'normal',
                    pagination: true,
                    paginationPageSize: 25,
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 52,
                  }}
                  loading={loading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>

      <ExpenseQuickAddDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleDrawerSuccess}
      />
    </PageWrapper>
  );
};

export default ExpenseListPage;
