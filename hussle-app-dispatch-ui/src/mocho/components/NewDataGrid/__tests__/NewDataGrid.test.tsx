import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NewDataGrid from '../index';

// Mock AG Grid
jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ columnDefs, rowData }: { columnDefs: any[]; rowData: any[] }) => (
    <div data-testid="ag-grid-mock">
      <div data-testid="ag-grid-columns">
        {columnDefs.map((col: any) => (
          <span key={col.field} data-testid={`column-${col.field}`}>
            {col.headerName}
          </span>
        ))}
      </div>
      <div data-testid="ag-grid-rows">
        {rowData.map((row: any, index: number) => (
          <div key={index} data-testid={`row-${index}`}>
            {JSON.stringify(row)}
          </div>
        ))}
      </div>
    </div>
  ),
}));

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('NewDataGrid', () => {
  const columnDefs = [
    { field: 'id', headerName: 'ID' },
    { field: 'name', headerName: 'Name' },
    { field: 'email', headerName: 'Email' },
  ];

  const rowData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
  };

  describe('rendering', () => {
    it('renders AG Grid when there is data', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
        />
      );

      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
        />
      );

      expect(screen.getByTestId('column-id')).toHaveTextContent('ID');
      expect(screen.getByTestId('column-name')).toHaveTextContent('Name');
      expect(screen.getByTestId('column-email')).toHaveTextContent('Email');
    });

    it('renders row data', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
        />
      );

      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.getByTestId('row-1')).toBeInTheDocument();
      expect(screen.getByTestId('row-2')).toBeInTheDocument();
    });

    it('applies ag-theme-material class', () => {
      const { container } = renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
        />
      );

      expect(container.querySelector('.ag-theme-material')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders loading spinner when loading is true', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('does not render AG Grid when loading', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          loading={true}
        />
      );

      expect(screen.queryByTestId('ag-grid-mock')).not.toBeInTheDocument();
    });

    it('renders custom loading component when provided', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
          loadingComponent={<div data-testid="custom-loading">Loading data...</div>}
        />
      );

      expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders error message when error is true', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          error={true}
        />
      );

      expect(screen.getByText('Error loading data')).toBeInTheDocument();
    });

    it('does not render AG Grid when error is true', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          error={true}
        />
      );

      expect(screen.queryByTestId('ag-grid-mock')).not.toBeInTheDocument();
    });

    it('renders custom error component when provided', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          error={true}
          errorComponent={<div data-testid="custom-error">Custom error message</div>}
        />
      );

      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });

    it('prioritizes loading over error state', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
          error={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByText('Error loading data')).not.toBeInTheDocument();
    });
  });

  describe('no data state', () => {
    it('renders default no data message when rowData is empty', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
        />
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not render AG Grid when no data', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
        />
      );

      expect(screen.queryByTestId('ag-grid-mock')).not.toBeInTheDocument();
    });

    it('renders custom no data message when provided', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          noDataMessage="No items found"
        />
      );

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('renders custom no data component when provided', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          noDataComponent={<div data-testid="custom-no-data">Empty state component</div>}
        />
      );

      expect(screen.getByTestId('custom-no-data')).toBeInTheDocument();
      expect(screen.getByText('Empty state component')).toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('transitions from loading to data display', async () => {
      const { rerender } = renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('ag-grid-mock')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={rowData}
            loading={false}
          />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
      });
    });

    it('transitions from loading to error state', async () => {
      const { rerender } = renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={[]}
            loading={false}
            error={true}
          />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByText('Error loading data')).toBeInTheDocument();
      });
    });

    it('transitions from loading to no data state', async () => {
      const { rerender } = renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={[]}
          loading={true}
        />
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={[]}
            loading={false}
          />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        expect(screen.getByText('No data available')).toBeInTheDocument();
      });
    });
  });

  describe('data updates', () => {
    it('updates displayed data when rowData changes', async () => {
      const { rerender } = renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData.slice(0, 1)}
        />
      );

      expect(screen.getByTestId('row-0')).toBeInTheDocument();
      expect(screen.queryByTestId('row-1')).not.toBeInTheDocument();

      rerender(
        <ThemeProvider theme={theme}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={rowData}
          />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('row-0')).toBeInTheDocument();
        expect(screen.getByTestId('row-1')).toBeInTheDocument();
        expect(screen.getByTestId('row-2')).toBeInTheDocument();
      });
    });
  });

  describe('grid options', () => {
    it('passes gridOptions to AG Grid', () => {
      const gridOptions = {
        pagination: true,
        paginationPageSize: 10,
      };

      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          gridOptions={gridOptions}
        />
      );

      // Grid should render with the options (mocked, so just verify it renders)
      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });

    it('passes defaultColDef to AG Grid', () => {
      renderWithTheme(
        <NewDataGrid
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
        />
      );

      expect(screen.getByTestId('ag-grid-mock')).toBeInTheDocument();
    });
  });
});
