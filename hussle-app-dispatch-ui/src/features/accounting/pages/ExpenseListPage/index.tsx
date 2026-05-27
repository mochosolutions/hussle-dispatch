import { useCallback, useEffect, useMemo } from 'react';
import { Box, Button } from '@mui/material';
import type { ColDef } from 'ag-grid-community';
import AddIcon from '@mui/icons-material/Add';
import { useStore } from 'react-redux';
import { NewDataGrid, PageWrapper } from '@mocho/ui/components';
import { ActionsCell } from 'mocho/components/DataGrid';
import { EmptyState } from 'mocho/components/EmptyState';
import { ListLayout } from 'components/ListLayout';
import MainCard from 'components/MainCard';
import { FilterBar } from 'components/FilterBar';
import { Body } from 'components/Typography';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import { isStale } from 'utils/redux/staleness';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import {
  fetchExpensesRequest,
  setExpenseFilters,
} from '../../store/reducers/expensePageSlice';
import {
  selectExpenseFilters,
  selectExpenseListLoading,
  selectExpenseTotalCount,
  selectFilteredExpenses,
} from '../../store/selectors/expenseSelectors';
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

const toIsoDate = (date: Date | null): string | null => {
  if (!date) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExpenseListPage = () => {
  const dispatch = useDispatch();
  const store = useStore<RootState>();

  const filters = useSelector(selectExpenseFilters);
  const filteredExpensesSelector = useMemo(
    () => selectFilteredExpenses(filters),
    [filters],
  );
  const expenses = useSelector(filteredExpensesSelector);
  const totalCount = useSelector(selectExpenseTotalCount);
  const loading = useSelector(selectExpenseListLoading);

  const { openDrawer } = useDrawerActions();

  useEffect(() => {
    const { lastFetchedAt } = store.getState().pages.expenses;
    if (isStale(lastFetchedAt)) {
      dispatch(fetchExpensesRequest());
    }
  }, [dispatch, store]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      dispatch(setExpenseFilters({ category: value }));
      dispatch(fetchExpensesRequest());
    },
    [dispatch],
  );

  const handleDateRangeChange = useCallback(
    (from: Date | null, to: Date | null) => {
      dispatch(setExpenseFilters({ dateFrom: toIsoDate(from), dateTo: toIsoDate(to) }));
      dispatch(fetchExpensesRequest());
    },
    [dispatch],
  );

  const handleSearchChange = useCallback(
    (value: string | number) => {
      dispatch(setExpenseFilters({ query: String(value) }));
      dispatch(fetchExpensesRequest());
    },
    [dispatch],
  );

  const handleAddExpenseClick = useCallback(() => {
    openDrawer('expenseQuickAdd', {});
  }, [openDrawer]);

  const dateFromValue = useMemo(
    () => (filters.dateFrom ? new Date(filters.dateFrom) : null),
    [filters.dateFrom],
  );
  const dateToValue = useMemo(
    () => (filters.dateTo ? new Date(filters.dateTo) : null),
    [filters.dateTo],
  );

  const filterConfig = useMemo(
    () => [
      {
        type: 'select' as const,
        name: 'category',
        label: 'Category',
        options: CATEGORY_OPTIONS,
        value: filters.category,
        onChange: handleCategoryChange,
      },
      {
        type: 'dateRange' as const,
        name: 'dateRange',
        label: 'Date Range',
        from: dateFromValue,
        to: dateToValue,
        onChange: handleDateRangeChange,
      },
    ],
    [
      filters.category,
      dateFromValue,
      dateToValue,
      handleCategoryChange,
      handleDateRangeChange,
    ],
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
        colId: 'actions',
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
            onClick={handleAddExpenseClick}
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
                  noDataComponent={
                    <EmptyState variant="no-results" entityName="Expenses" compact />
                  }
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
