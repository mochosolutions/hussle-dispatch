import { useMemo } from 'react';
import { Box } from '@mui/material';
import { MainCard, NewDataGrid, PageHeader, PageWrapper } from '@mocho/ui/components';

interface MockLoad {
  id: string;
  origin: string;
  destination: string;
  status: string;
  rate: number;
  carrier: string;
}

const MOCK_LOADS: MockLoad[] = [
  {
    id: 'L-1001',
    origin: 'Chicago, IL',
    destination: 'Dallas, TX',
    status: 'In Transit',
    rate: 2400,
    carrier: 'ABC Trucking',
  },
  {
    id: 'L-1002',
    origin: 'Atlanta, GA',
    destination: 'Miami, FL',
    status: 'Delivered',
    rate: 1850,
    carrier: 'FastHaul LLC',
  },
  {
    id: 'L-1003',
    origin: 'Los Angeles, CA',
    destination: 'Phoenix, AZ',
    status: 'Pending',
    rate: 975,
    carrier: 'SunState Transport',
  },
  {
    id: 'L-1004',
    origin: 'New York, NY',
    destination: 'Boston, MA',
    status: 'In Transit',
    rate: 620,
    carrier: 'NorthEast Carriers',
  },
  {
    id: 'L-1005',
    origin: 'Houston, TX',
    destination: 'Denver, CO',
    status: 'Cancelled',
    rate: 1700,
    carrier: 'Lone Star Freight',
  },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const LoadIntelligencePage = () => {
  const columnDefs = useMemo(
    () => [
      { headerName: 'Load #', field: 'id', minWidth: 120, maxWidth: 140 },
      { headerName: 'Origin', field: 'origin', minWidth: 160, flex: 1 },
      { headerName: 'Destination', field: 'destination', minWidth: 160, flex: 1 },
      { headerName: 'Carrier', field: 'carrier', minWidth: 160, flex: 1 },
      { headerName: 'Status', field: 'status', minWidth: 120 },
      {
        headerName: 'Rate',
        field: 'rate',
        minWidth: 110,
        maxWidth: 140,
        valueFormatter: ({ value }: { value: number }) => currencyFormatter.format(value),
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

  return (
    <PageWrapper isLoading={false} errorContext="LoadIntelligencePage" sx={{ gap: 2 }}>
      <PageHeader title="Load Intelligence" />

      <MainCard
        content={false}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      >
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <Box sx={{ minHeight: { xs: 300, md: 420 }, flex: 1 }}>
            <NewDataGrid
              columnDefs={columnDefs}
              rowData={MOCK_LOADS}
              defaultColDef={defaultColDef}
              showRowCountFooter
              totalRowCount={MOCK_LOADS.length}
              rowCountLabel="loads"
              noDataMessage="No loads found"
              gridOptions={{
                domLayout: 'normal',
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 62,
              }}
            />
          </Box>
        </Box>
      </MainCard>
    </PageWrapper>
  );
};

export default LoadIntelligencePage;
