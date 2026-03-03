import { jsxs, jsx } from "@emotion/react/jsx-runtime";
import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-material.css";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, CircularProgress } from "@mui/material";
ModuleRegistry.registerModules([AllCommunityModule]);
const AgGridTable = ({
  columnDefs,
  rowData,
  defaultColDef,
  gridOptions,
  loading = false,
  // default state
  error = false,
  // default state
  noDataMessage = "No data available",
  // default message
  loadingComponent,
  // optional custom loading component
  errorComponent,
  // optional custom error component
  noDataComponent,
  // optional custom no data component
  footerComponent,
  // optional footer component
  showRowCountFooter = false,
  totalRowCount,
  rowCountLabel = "rows"
}) => {
  const theme = useTheme();
  const [displayData, setDisplayData] = useState(rowData);
  const resolvedDomLayout = gridOptions?.domLayout ?? "normal";
  const resolvedGridOptions = {
    ...gridOptions,
    domLayout: resolvedDomLayout
  };
  useEffect(() => {
    if (!loading && !error && rowData.length === 0) {
      setDisplayData([]);
    } else {
      setDisplayData(rowData);
    }
  }, [rowData, loading, error]);
  const gridStyle = {
    flex: "1 1 0px",
    height: resolvedDomLayout === "autoHeight" ? "auto" : "100%",
    minHeight: resolvedDomLayout === "autoHeight" ? 240 : 0,
    width: "100%",
    "--ag-background-color": theme.palette.background.paper,
    "--ag-foreground-color": theme.palette.text.primary,
    "--ag-header-background-color": theme.palette.background.default,
    "--ag-header-foreground-color": theme.palette.text.secondary,
    "--ag-row-hover-color": theme.palette.action.hover,
    "--ag-border-color": theme.palette.divider,
    "--ag-font-family": theme.typography.fontFamily
  };
  const defaultLoadingComponent = /* @__PURE__ */ jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: /* @__PURE__ */ jsx(CircularProgress, {}) });
  const defaultErrorComponent = /* @__PURE__ */ jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: /* @__PURE__ */ jsx(Typography, { color: "error", children: "Error loading data" }) });
  const defaultNoDataComponent = /* @__PURE__ */ jsx(Box, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", children: /* @__PURE__ */ jsx(Typography, { children: noDataMessage }) });
  const shouldRenderBuiltInFooter = !footerComponent && showRowCountFooter;
  const resolvedTotalRowCount = totalRowCount ?? displayData.length;
  return /* @__PURE__ */ jsxs(Box, { sx: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    width: "100%"
  }, children: [
    /* @__PURE__ */ jsxs("div", { className: "ag-theme-material", style: gridStyle, children: [
      loading && (loadingComponent || defaultLoadingComponent),
      error && !loading && (errorComponent || defaultErrorComponent),
      !loading && !error && displayData.length === 0 && (noDataComponent || defaultNoDataComponent),
      !loading && !error && displayData.length > 0 && /* @__PURE__ */ jsx(AgGridReact, { theme: "legacy", columnDefs, rowData: displayData, defaultColDef, ...resolvedGridOptions })
    ] }),
    !loading && !error && footerComponent,
    !loading && !error && shouldRenderBuiltInFooter && /* @__PURE__ */ jsx(Box, { sx: {
      px: 2,
      py: 1.5,
      borderTop: 1,
      borderColor: "divider"
    }, children: /* @__PURE__ */ jsx(Typography, { variant: "caption", color: "text.secondary", children: `Showing ${displayData.length} of ${resolvedTotalRowCount} ${rowCountLabel}` }) })
  ] });
};
export {
  AgGridTable as default
};
//# sourceMappingURL=index.js.map
