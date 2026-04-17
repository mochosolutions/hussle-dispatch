import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import AddIcon from '@mui/icons-material/Add';
import { NewDataGrid, PageWrapper } from '@mocho/ui/components';
import { ActionsCell } from 'mocho/components/DataGrid';
import { ListLayout } from 'components/ListLayout';
import MainCard from 'components/MainCard';
import { FilterBar } from 'components/FilterBar';
import { Body } from 'components/Typography';
import { getExpenses } from 'utils/api/accounting/expenseApi';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import type { ExpenseListItem } from '../../types';
import {
  DateCellRenderer,
  CurrencyCellRenderer,
  CategoryCellRenderer,
  CATEGORY_LABEL_MAP,
} from '../../components/ExpenseListPage/ExpenseCellRenderers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABEL_MAP).map(([value, label]) => ({ value, label })),
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExpenseListPage = () => {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { openDrawer } = useDrawerActions();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const params: Parameters<typeof getExpenses>[0] = { page: 1, limit: 500 };
        if (category !== 'ALL') {
          params.category = category;
        }
        if (debouncedSearch) {
          params.search = debouncedSearch;
        }
        if (dateFrom) {
          params.dateFrom = dateFrom.toISOString().split('T')[0];
        }
        if (dateTo) {
          params.dateTo = dateTo.toISOString().split('T')[0];
        }

        const result = await getExpenses(params);

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

  const handleDrawerSuccess = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
  }, []);

  const handleDateRangeChange = useCallback((from: Date | null, to: Date | null) => {
    setDateFrom(from);
    setDateTo(to);
  }, []);

  const handleSearchChange = useCallback((value: string | number) => {
    setDebouncedSearch(String(value));
  }, []);

  const filterConfig = useMemo(
    () => [
      {
        type: 'select' as const,
        name: 'category',
        label: 'Category',
        options: CATEGORY_OPTIONS,
        value: category,
        onChange: handleCategoryChange,
      },
      {
        type: 'dateRange' as const,
        name: 'dateRange',
        label: 'Date Range',
        from: dateFrom,
        to: dateTo,
        onChange: handleDateRangeChange,
      },
    ],
    [category, dateFrom, dateTo, handleCategoryChange, handleDateRangeChange],
  );

  const searchConfig = useMemo(
    () => ({
      placeholder: 'Search expenses...',
      value: '',
      onChange: handleSearchChange,
      debounce: 300,
    }),
    [handleSearchChange],
  );

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
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
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
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'State',
        field: 'state',
        width: 80,
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'Gallons',
        field: 'gallons',
        minWidth: 100,
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'Actions',
        field: 'actions',
        width: 100,
        sortable: false,
        filter: false,
        cellRenderer: ActionsCell,
        cellRendererParams: {
          config: {
            showView: false,
            showEdit: true,
            showDelete: false,
            getEditRoute: (data: ExpenseListItem) => `/accounting/expenses/${data.id}/edit`,
          },
        },
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
    <PageWrapper errorContext="ExpenseListPage" sx={{ gap: 2 }}>
      <ListLayout
        title="Expenses"
        primaryAction={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openDrawer('expenseQuickAdd', { onSuccess: handleDrawerSuccess })}
          >
            Add Expense
          </Button>
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
            <Box sx={{ px: 2, py: 1.5 }}>
              <FilterBar filters={filterConfig} search={searchConfig} />
            </Box>

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
                    rowHeight: 56,
                  }}
                  loading={loading}
                />
              </Box>
            </Box>
          </MainCard>
        </Box>
      </ListLayout>
    </PageWrapper>
  );
};

export default ExpenseListPage;
