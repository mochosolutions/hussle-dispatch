import { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Map as MapIcon, List } from 'lucide-react';
import { MainCard, NewDataGrid, PageWrapper, ListSkeleton } from '@mocho/ui/components';
import { ListLayout } from 'components/ListLayout';
import { useDispatch, useSelector } from 'store';
import type { RootState } from 'store';
import type { StagedLoad } from '../types/loadBoardTypes';
import { LoadBoardMap } from '../components/LoadBoardMap';
import {
  ingestDatRequest,
  setSourceFilter,
  startPolling,
  stopPolling,
} from '../store/reducers/loadBoardSlice';

type ViewMode = 'table' | 'map';

const formatCurrency = (val: number | null): string => {
  if (val === null) return '—';
  return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDuration = (minutes: number | null): string => {
  if (minutes === null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const SourceCellRenderer = (params: { data: StagedLoad }) => {
  const { source } = params.data;
  return (
    <Chip
      size="small"
      label={source.toUpperCase()}
      color={source === 'relay' ? 'primary' : 'warning'}
      variant="filled"
    />
  );
};

const RouteCellRenderer = (params: { data: StagedLoad }) => {
  const { originCity, originState, destCity, destState } = params.data;
  const origin = originCity && originState ? `${originCity}, ${originState}` : '—';
  const dest = destCity && destState ? `${destCity}, ${destState}` : '—';
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} noWrap>
        {origin}
      </Typography>
      <Typography variant="caption" color="text.secondary" noWrap>
        → {dest}
      </Typography>
    </Box>
  );
};

const sourceOptions = ['all', 'relay', 'dat'] as const;

const LoadBoardPage = () => {
  const dispatch = useDispatch();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { loads, meta, sourceFilter, loading, datIngesting } = useSelector(
    (state: RootState) => state.pages.loadBoard,
  );

  useEffect(() => {
    dispatch(startPolling());
    return () => {
      dispatch(stopPolling());
    };
  }, [dispatch]);

  const filteredLoads = useMemo(
    () => (sourceFilter === 'all' ? loads : loads.filter((l) => l.source === sourceFilter)),
    [loads, sourceFilter],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Source',
        field: 'source',
        minWidth: 100,
        maxWidth: 120,
        cellRenderer: SourceCellRenderer,
      },
      {
        headerName: 'Route',
        field: 'originCity',
        minWidth: 180,
        flex: 1,
        cellRenderer: RouteCellRenderer,
      },
      {
        headerName: 'Payout',
        field: 'payout',
        minWidth: 110,
        maxWidth: 130,
        valueFormatter: (params: { value: number | null }) => formatCurrency(params.value),
      },
      {
        headerName: '$/Mile',
        field: 'ratePerMile',
        minWidth: 100,
        maxWidth: 120,
        valueFormatter: (params: { value: number | null }) => formatCurrency(params.value),
      },
      {
        headerName: 'Miles',
        field: 'totalMiles',
        minWidth: 90,
        maxWidth: 110,
        valueFormatter: (params: { value: number | null }) =>
          params.value !== null ? String(params.value) : '—',
      },
      {
        headerName: 'Equipment',
        field: 'equipmentType',
        minWidth: 120,
        maxWidth: 150,
        valueFormatter: (params: { value: string | null }) => params.value ?? '—',
      },
      {
        headerName: 'Duration',
        field: 'totalDuration',
        minWidth: 100,
        maxWidth: 120,
        valueFormatter: (params: { value: number | null }) => formatDuration(params.value),
      },
      {
        headerName: 'Pickup',
        field: 'firstPickupTime',
        minWidth: 160,
        valueFormatter: (params: { value: string | null }) =>
          params.value ? new Date(params.value).toLocaleString() : '—',
      },
      {
        headerName: 'Stops',
        field: 'stopCount',
        minWidth: 80,
        maxWidth: 100,
        valueFormatter: (params: { value: number | null }) =>
          params.value !== null ? String(params.value) : '—',
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
      isLoading={loading && loads.length === 0}
      loadingComponent={<ListSkeleton rows={10} />}
      errorContext="LoadBoardPage"
      sx={{ gap: 2 }}
    >
      <ListLayout
        title="Load Board"
        primaryAction={
          <Stack direction="row" spacing={1} alignItems="center">
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_e, val) => { if (val !== null) setViewMode(val as ViewMode); }}
              size="small"
            >
              <ToggleButton value="table" aria-label="Table view">
                <List size={18} />
              </ToggleButton>
              <ToggleButton value="map" aria-label="Map view">
                <MapIcon size={18} />
              </ToggleButton>
            </ToggleButtonGroup>
            {sourceOptions.map((src) => (
              <Chip
                key={src}
                label={src === 'all' ? 'All' : `${src.charAt(0).toUpperCase()}${src.slice(1)}`}
                variant={sourceFilter === src ? 'filled' : 'outlined'}
                color={src === 'relay' ? 'primary' : src === 'dat' ? 'warning' : 'default'}
                onClick={() => dispatch(setSourceFilter(src))}
                size="small"
              />
            ))}
            <Button
              variant="outlined"
              size="small"
              onClick={() => dispatch(ingestDatRequest())}
              disabled={datIngesting}
            >
              {datIngesting ? 'Syncing...' : 'Sync DAT'}
            </Button>
          </Stack>
        }
      >
        {meta && (
          <Box sx={{ px: { xs: 2, sm: 3 }, pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {meta.total} loads
              {meta.sources['relay'] !== undefined && ` · Relay: ${meta.sources['relay']}`}
              {meta.sources['dat'] !== undefined && ` · DAT: ${meta.sources['dat']}`}
            </Typography>
          </Box>
        )}

        {viewMode === 'table' && (
          <MainCard sx={{ mx: { xs: 2, sm: 3 }, mb: 3 }}>
            <Box
              sx={{
                height: 'calc(100vh - 260px)',
                '& .ag-root-wrapper': { border: 'none' },
              }}
            >
              <NewDataGrid
                columnDefs={columnDefs}
                rowData={filteredLoads}
                defaultColDef={defaultColDef}
                rowHeight={52}
                headerHeight={44}
                suppressCellFocus
                animateRows
              />
            </Box>
          </MainCard>
        )}

        {viewMode === 'map' && (
          <Box sx={{ mx: { xs: 2, sm: 3 }, mb: 3, height: 'calc(100vh - 260px)', borderRadius: 1, overflow: 'hidden' }}>
            <LoadBoardMap loads={loads} sourceFilter={sourceFilter} />
          </Box>
        )}
      </ListLayout>
    </PageWrapper>
  );
};

export default LoadBoardPage;
