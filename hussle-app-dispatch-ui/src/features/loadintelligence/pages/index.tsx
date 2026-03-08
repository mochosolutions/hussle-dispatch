import { useState, useMemo, useCallback } from 'react';
import { Box, Stack, TextField } from '@mui/material';
import { MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';

import type { ColDef, RowClickedEvent } from 'ag-grid-community';
import type { LoadFilters, MockLoad } from '../types';
import { MOCK_DRIVERS, MOCK_LOADS } from '../mockData';
import { getScoreTier } from '../getScoreTier';
import { useDrawerActions } from '../../ui/hooks/useDrawerActions';
import { LoadIntelligenceHeader } from '../components/LoadIntelligenceHeader';
import {
  SingleScoreCellRenderer,
  OriginCellRenderer,
  DestinationCellRenderer,
  EquipmentCellRenderer,
  RateCellRenderer,
  MilesRateCellRenderer,
  CustomerCellRenderer,
  SourceBadgeCellRenderer,
} from '../components/LoadIntelligenceCellRenderers';

const DEFAULT_FILTERS: LoadFilters = { score: 'All', source: 'All', equipment: 'All' };

const columnDefs: ColDef<MockLoad>[] = [
  {
    colId: 'score',
    headerName: 'Score',
    cellRenderer: SingleScoreCellRenderer,
    flex: 1.4,
    minWidth: 120,
  },
  {
    colId: 'origin',
    headerName: 'ORIGIN',
    cellRenderer: OriginCellRenderer,
    flex: 1.8,
    minWidth: 150,
  },
  {
    colId: 'destination',
    headerName: 'DEST',
    cellRenderer: DestinationCellRenderer,
    flex: 1.8,
    minWidth: 150,
  },
  {
    field: 'equipmentType',
    headerName: 'EQUIP',
    cellRenderer: EquipmentCellRenderer,
    flex: 0.8,
    minWidth: 80,
  },
  { colId: 'rate', headerName: 'RATE', cellRenderer: RateCellRenderer, flex: 1.2, minWidth: 100 },
  {
    colId: 'miles',
    headerName: 'MILES',
    cellRenderer: MilesRateCellRenderer,
    flex: 0.8,
    minWidth: 80,
  },
  {
    colId: 'customer',
    headerName: 'CUSTOMER',
    cellRenderer: CustomerCellRenderer,
    flex: 1.8,
    minWidth: 150,
  },
  {
    colId: 'source',
    headerName: 'Load Source',
    cellRenderer: SourceBadgeCellRenderer,
    flex: 1.4,
    minWidth: 120,
  },
];

const defaultColDef: ColDef<MockLoad> = {
  sortable: true,
  resizable: true,
  filter: false,
};

// TODO: Wire to actual logic
const onCreateLoad = () => {
  // placeholder
};
const onAddManually = () => {
  // placeholder
};

const LoadIntelligencePage = () => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [filters, setFilters] = useState<LoadFilters>(DEFAULT_FILTERS);
  const { openDrawer } = useDrawerActions();

  const handleRowClicked = useCallback(
    (event: RowClickedEvent<MockLoad>) => {
      if (event.data) {
        openDrawer('loadDetail', { loadId: event.data.id });
      }
    },
    [openDrawer],
  );

  const filteredLoads = useMemo(() => {
    let result = MOCK_LOADS;

    if (filters.source !== 'All') {
      result = result.filter((load) => load.source.type === filters.source);
    }

    if (filters.score !== 'All') {
      result = result.filter((load) => getScoreTier(load.score).label === filters.score);
    }

    if (filters.equipment !== 'All') {
      result = result.filter((load) => load.equipmentType === filters.equipment);
    }

    // Driver filter is a no-op for now
    return result;
  }, [filters]);

  return (
    <PageWrapper isLoading={false} errorContext="LoadIntelligencePage" sx={{ gap: 2 }}>
      <PageHeader title="Load Intelligence" />
      {/* <LoadIntelligenceHeader
        onCreateLoad={onCreateLoad}
        onAddManually={onAddManually}
        drivers={MOCK_DRIVERS}
        selectedDriverId={selectedDriverId}
        onDriverSelect={setSelectedDriverId}
        loads={filteredLoads}
        filters={filters}
        onFilterChange={setFilters}
      /> */}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          // p: 3,
        }}
      >
        <MainCard
          content={false}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
        >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}
        >
          {/* <Tabs
            value={activeTab}
            onChange={(_event, value: CarrierTab) => setActiveTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ minHeight: 40 }}
          >
            {tabOptions.map((tabOption) => (
              <Tab
                key={tabOption.key}
                value={tabOption.key}
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="body2">{tabOption.label}</Typography>
                    <Chip label={tabOption.count} size="small" />
                  </Stack>
                }
                sx={{ minHeight: 40 }}
              />
            ))}
          </Tabs> */}
          <Box>
            <TextField
              // value={searchQuery}
              // onChange={handleSearchChange}
              placeholder="Search by name, MC#, email..."
              size="small"
              sx={{ width: { xs: '100%', lg: 320 } }}
            />
          </Box>
        </Stack>

          <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
              <NewDataGrid
                columnDefs={columnDefs}
                rowData={filteredLoads}
                defaultColDef={defaultColDef}
                showRowCountFooter
                totalRowCount={filteredLoads.length}
                rowCountLabel="loads"
                noDataMessage="No loads found"
                gridOptions={{
                  domLayout: 'normal',
                  suppressCellFocus: true,
                  headerHeight: 44,
                  rowHeight: 68,
                  onRowClicked: handleRowClicked,
                }}
              />
            </Box>
          </Box>
        </MainCard>
      </Box>
    </PageWrapper>
  );
};

export default LoadIntelligencePage;
