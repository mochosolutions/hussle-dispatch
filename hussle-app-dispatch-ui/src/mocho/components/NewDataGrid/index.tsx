import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { ColDef, GridOptions } from 'ag-grid-community';

interface AgGridTableProps<TData> {
  columnDefs: ColDef<TData>[];
  rowData: TData[];
  defaultColDef?: ColDef<TData>;
  gridOptions?: GridOptions<TData>;
  loading?: boolean;
  error?: boolean;
  noDataMessage?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  noDataComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
  showRowCountFooter?: boolean;
  totalRowCount?: number;
  rowCountLabel?: string;
}

const AgGridTable = <TData,>({
  columnDefs,
  rowData,
  defaultColDef,
  gridOptions,
  loading = false,
  error = false,
  noDataMessage = 'No data available',
  loadingComponent,
  errorComponent,
  noDataComponent,
  footerComponent,
  showRowCountFooter = false,
  totalRowCount,
  rowCountLabel = 'rows',
}: AgGridTableProps<TData>) => {
  const theme = useTheme();
  const displayData = !loading && !error && rowData.length === 0 ? [] : rowData;
  const resolvedDomLayout = gridOptions?.domLayout ?? 'normal';
  const resolvedGridOptions = {
    ...gridOptions,
    domLayout: resolvedDomLayout,
  };

  const gridStyle = {
    flex: '1 1 0px',
    height: resolvedDomLayout === 'autoHeight' ? 'auto' : '100%',
    minHeight: resolvedDomLayout === 'autoHeight' ? 240 : 0,
    width: '100%',
    '--ag-background-color': theme.palette.background.paper,
    '--ag-foreground-color': theme.palette.text.primary,
    '--ag-header-background-color': theme.palette.background.default,
    '--ag-header-foreground-color': theme.palette.text.secondary,
    '--ag-row-hover-color': theme.palette.action.hover,
    '--ag-border-color': theme.palette.divider,
    '--ag-font-family': theme.typography.fontFamily,
  } as React.CSSProperties;

  // Default loading component if none is provided
  const defaultLoadingComponent = (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <CircularProgress />
    </Box>
  );

  // Default error component if none is provided
  const defaultErrorComponent = (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <Typography color="error">Error loading data</Typography>
    </Box>
  );

  // Default no data component if none is provided
  const defaultNoDataComponent = (
    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
      <Typography>{noDataMessage}</Typography>
    </Box>
  );

  const shouldRenderBuiltInFooter = !footerComponent && showRowCountFooter;
  const resolvedTotalRowCount = totalRowCount ?? displayData.length;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        width: '100%',
      }}
    >
      <div className="ag-theme-material" style={gridStyle}>
        {/* Display loading state */}

        {loading && (loadingComponent || defaultLoadingComponent)}

        {/* Display error state */}
        {error && !loading && (errorComponent || defaultErrorComponent)}

        {/* Display no data state */}
        {!loading &&
          !error &&
          displayData.length === 0 &&
          (noDataComponent || defaultNoDataComponent)}

        {/* Render the grid if there's data */}
        {!loading && !error && displayData.length > 0 && (
          <AgGridReact<TData>
            columnDefs={columnDefs}
            rowData={displayData}
            defaultColDef={defaultColDef}
            {...resolvedGridOptions}
          />
        )}
      </div>

      {!loading && !error && footerComponent}

      {!loading && !error && shouldRenderBuiltInFooter && (
        <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            {`Showing ${displayData.length} of ${resolvedTotalRowCount} ${rowCountLabel}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AgGridTable;
