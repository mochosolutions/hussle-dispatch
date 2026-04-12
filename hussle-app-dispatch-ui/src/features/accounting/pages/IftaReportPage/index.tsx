import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { MainCard, NewDataGrid } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { getIftaReport } from 'utils/api/accounting/iftaApi';
import type {
  IftaReportResponse,
  IftaStateEntry,
  IftaVehicleEntry,
} from '../../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const QUARTER_OPTIONS = [
  { value: 1, label: 'Q1 (Jan - Mar)' },
  { value: 2, label: 'Q2 (Apr - Jun)' },
  { value: 3, label: 'Q3 (Jul - Sep)' },
  { value: 4, label: 'Q4 (Oct - Dec)' },
];

const currentYear = new Date().getFullYear();

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number): string => currencyFormatter.format(value);

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
});

const formatNumber = (value: number): string => numberFormatter.format(value);

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const formatWholeNumber = (value: number): string => wholeNumberFormatter.format(value);

// ---------------------------------------------------------------------------
// Grid row type
// ---------------------------------------------------------------------------

interface StateRow {
  state: string;
  milesDriven: number;
  fuelGallons: number;
  fuelCost: number;
}

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

const aggregateStatesByCode = (vehicles: IftaVehicleEntry[]): StateRow[] => {
  const stateMap = new Map<string, StateRow>();

  vehicles.forEach((vehicle) => {
    vehicle.states.forEach((entry) => {
      const existing = stateMap.get(entry.state);
      if (existing) {
        existing.milesDriven += entry.milesDriven;
        existing.fuelGallons += entry.fuelGallons;
        existing.fuelCost += entry.fuelCost;
      } else {
        stateMap.set(entry.state, {
          state: entry.state,
          milesDriven: entry.milesDriven,
          fuelGallons: entry.fuelGallons,
          fuelCost: entry.fuelCost,
        });
      }
    });
  });

  return Array.from(stateMap.values()).sort((a, b) => a.state.localeCompare(b.state));
};

const flattenVehicleStates = (vehicle: IftaVehicleEntry): StateRow[] =>
  vehicle.states.map((entry: IftaStateEntry) => ({
    state: entry.state,
    milesDriven: entry.milesDriven,
    fuelGallons: entry.fuelGallons,
    fuelCost: entry.fuelCost,
  }));

// ---------------------------------------------------------------------------
// Cell renderers
// ---------------------------------------------------------------------------

const MilesCellRenderer = ({ value }: { value: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatWholeNumber(value)}
  </Box>
);

const GallonsCellRenderer = ({ value }: { value: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatNumber(value)}
  </Box>
);

const CurrencyCellRenderer = ({ value }: { value: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {formatCurrency(value)}
  </Box>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const getCurrentQuarter = (): number => Math.ceil((new Date().getMonth() + 1) / 3);

const IftaReportPage = () => {
  const [year, setYear] = useState(currentYear);
  const [quarter, setQuarter] = useState(getCurrentQuarter);
  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const [report, setReport] = useState<IftaReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getIftaReport({ year, quarter, vehicleId });
        setReport(data);
      } catch {
        setError('Failed to load IFTA report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year, quarter, vehicleId]);

  const handleYearChange = useCallback((event: SelectChangeEvent<number>) => {
    setYear(Number(event.target.value));
  }, []);

  const handleQuarterChange = useCallback((event: SelectChangeEvent<number>) => {
    setQuarter(Number(event.target.value));
  }, []);

  const handleVehicleFilterChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.trim();
      setVehicleId(value === '' ? undefined : value);
    },
    [],
  );

  // Build grid rows
  const { rows, totalsRow } = useMemo(() => {
    if (!report) {
      return { rows: [], totalsRow: [] as StateRow[] };
    }

    const selectedVehicle = vehicleId
      ? report.vehicles.find((v) => v.vehicleId === vehicleId)
      : undefined;

    const gridRows = selectedVehicle
      ? flattenVehicleStates(selectedVehicle)
      : aggregateStatesByCode(report.vehicles);

    const totals = selectedVehicle ? selectedVehicle.totals : report.fleetTotals;

    const pinnedRow: StateRow[] = [
      {
        state: 'Total',
        milesDriven: totals.totalMiles,
        fuelGallons: totals.totalGallons,
        fuelCost: totals.totalFuelCost,
      },
    ];

    return { rows: gridRows, totalsRow: pinnedRow };
  }, [report, vehicleId]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'State',
        field: 'state' as const,
        width: 100,
        pinned: 'left' as const,
      },
      {
        headerName: 'Miles Driven',
        field: 'milesDriven' as const,
        minWidth: 140,
        cellRenderer: MilesCellRenderer,
      },
      {
        headerName: 'Fuel (gal)',
        field: 'fuelGallons' as const,
        minWidth: 130,
        cellRenderer: GallonsCellRenderer,
      },
      {
        headerName: 'Fuel Cost',
        field: 'fuelCost' as const,
        minWidth: 130,
        cellRenderer: CurrencyCellRenderer,
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

  const hasData = report !== null && report.vehicles.length > 0;
  const showVehicleSummaries = hasData && !vehicleId;

  return (
    <ListLayout title="IFTA Report">
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
        {/* Filters */}
        <MainCard
          content={false}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'stretch', sm: 'flex-end' }}
            spacing={2}
            sx={{ px: 2, py: 1.5 }}
          >
            <Stack spacing={0.5}>
              <InputLabel>Quarter</InputLabel>
              <Select
                value={quarter}
                onChange={handleQuarterChange}
                size="small"
                sx={{ minWidth: 180 }}
              >
                {QUARTER_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack spacing={0.5}>
              <InputLabel>Year</InputLabel>
              <Select
                value={year}
                onChange={handleYearChange}
                size="small"
                sx={{ minWidth: 120 }}
              >
                {YEAR_OPTIONS.map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    {yr}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack spacing={0.5}>
              <InputLabel>Vehicle</InputLabel>
              <TextField
                size="small"
                placeholder="All Vehicles"
                onChange={handleVehicleFilterChange}
                sx={{ minWidth: 180 }}
              />
            </Stack>
          </Stack>

          {/* Error state */}
          {error && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}

          {/* Empty state */}
          {!loading && !error && report !== null && report.vehicles.length === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {`No IFTA data for Q${quarter} ${year}`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                State mileage is calculated automatically when loads have stops with coordinates.
              </Typography>
            </Box>
          )}

          {/* Data grid */}
          {(loading || hasData) && (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
                <NewDataGrid<StateRow>
                  columnDefs={columnDefs}
                  rowData={rows}
                  defaultColDef={defaultColDef}
                  showRowCountFooter
                  totalRowCount={rows.length}
                  rowCountLabel="states"
                  noDataMessage="No state data"
                  gridOptions={{
                    domLayout: 'normal',
                    suppressCellFocus: true,
                    headerHeight: 44,
                    rowHeight: 48,
                    pinnedBottomRowData: totalsRow,
                    getRowStyle: (params) => {
                      if (params.node.rowPinned === 'bottom') {
                        return { fontWeight: 'bold' };
                      }
                      return undefined;
                    },
                  }}
                  loading={loading}
                />
              </Box>
            </Box>
          )}
        </MainCard>

        {/* Per-vehicle summary cards */}
        {showVehicleSummaries && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Vehicle Summary
            </Typography>
            <Grid container spacing={2}>
              {report.vehicles.map((vehicle: IftaVehicleEntry) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.vehicleId}>
                  <MainCard title={vehicle.unitNumber}>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Total Miles
                        </Typography>
                        <Typography variant="body2">
                          {formatWholeNumber(vehicle.totals.totalMiles)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Total Gallons
                        </Typography>
                        <Typography variant="body2">
                          {formatNumber(vehicle.totals.totalGallons)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Fuel Cost
                        </Typography>
                        <Typography variant="body2">
                          {formatCurrency(vehicle.totals.totalFuelCost)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Avg MPG
                        </Typography>
                        <Typography variant="body2">
                          {formatNumber(vehicle.totals.averageMpg)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </MainCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </ListLayout>
  );
};

export default IftaReportPage;
