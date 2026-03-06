import React, { useEffect, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ClientSideRowModelModule, ModuleRegistry } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import { useTheme } from '@mui/material/styles';
import { Box, CircularProgress, Typography } from '@mui/material';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

interface AgGridTableProps {
  columnDefs: any[];
  rowData: any[];
  defaultColDef?: any;
  gridOptions?: any;
  loading?: boolean; // New prop for loading state
  error?: boolean; // New prop for error state
  noDataMessage?: string; // Custom no data message
  loadingComponent?: React.ReactNode; // Custom loading component
  errorComponent?: React.ReactNode; // Custom error component
  noDataComponent?: React.ReactNode; // Custom no data component
  footerComponent?: React.ReactNode; // Optional footer rendered below grid
  showRowCountFooter?: boolean; // Show built-in row count footer
  totalRowCount?: number; // Total rows available (for filtered views)
  rowCountLabel?: string; // Label suffix (e.g. carriers, rows)
}

const AgGridTable: React.FC<AgGridTableProps> = ({
  columnDefs,
  rowData,
  defaultColDef,
  gridOptions,
  loading = false, // default state
  error = false, // default state
  noDataMessage = 'No data available', // default message
  loadingComponent, // optional custom loading component
  errorComponent, // optional custom error component
  noDataComponent, // optional custom no data component
  footerComponent, // optional footer component
  showRowCountFooter = false,
  totalRowCount,
  rowCountLabel = 'rows',
}) => {
  const theme = useTheme();
  const [displayData, setDisplayData] = useState(rowData);
  const resolvedDomLayout = gridOptions?.domLayout ?? 'normal';
  const resolvedGridOptions = {
    ...gridOptions,
    domLayout: resolvedDomLayout,
  };

  useEffect(() => {
    // Automatically handle "no data" state if there's no row data provided
    if (!loading && !error && rowData.length === 0) {
      setDisplayData([]);
    } else {
      setDisplayData(rowData);
    }
  }, [rowData, loading, error]);

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
          <AgGridReact
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
