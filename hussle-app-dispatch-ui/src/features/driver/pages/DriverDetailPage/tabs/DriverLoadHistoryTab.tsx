import { useMemo } from 'react';
import { Box, Card, Stack, Typography } from '@mui/material';

import { NewDataGrid } from '@mocho/ui/components';

const DriverLoadHistoryTab = () => {
  const loadHistoryColumns = useMemo(
    () => [
      { headerName: 'Load #', field: 'loadNumber', minWidth: 120 },
      { headerName: 'Origin', field: 'origin', minWidth: 150 },
      { headerName: 'Destination', field: 'destination', minWidth: 150 },
      { headerName: 'Status', field: 'status', minWidth: 120 },
      { headerName: 'Rate', field: 'rate', minWidth: 100 },
      { headerName: 'Miles', field: 'miles', minWidth: 100 },
      { headerName: 'Delivered', field: 'deliveredAt', minWidth: 130 },
    ],
    [],
  );

  const loadHistoryDefaultColDef = useMemo(
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
    <Box sx={{ p: 3, maxWidth: 1200 }}>
      <Stack spacing={2.5}>
        {/* Performance Metrics */}
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
            >
              Performance Metrics
            </Typography>
          </Box>
          <Box
            sx={{
              px: 3,
              py: 2.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 2,
            }}
          >
            {[
              { value: '\u2014', label: 'Total Loads' },
              { value: '\u2014', label: 'On-Time Delivery' },
              { value: '\u2014', label: 'Avg Rate/Mile' },
              { value: '\u2014', label: 'Total Revenue' },
            ].map((stat) => (
              <Box
                key={stat.label}
                sx={{
                  textAlign: 'center',
                  py: 1.5,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption">{stat.label}</Typography>
              </Box>
            ))}
          </Box>
        </Card>

        {/* Load History DataGrid */}
        <Card>
          <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
            >
              Load History
            </Typography>
          </Box>
          <Box sx={{ minHeight: 300 }}>
            <NewDataGrid
              columnDefs={loadHistoryColumns}
              rowData={[]}
              defaultColDef={loadHistoryDefaultColDef}
              showRowCountFooter
              totalRowCount={0}
              rowCountLabel="loads"
              noDataMessage="No load history available"
              gridOptions={{
                domLayout: 'autoHeight',
                pagination: false,
                suppressCellFocus: true,
                headerHeight: 44,
                rowHeight: 52,
              }}
              loading={false}
            />
          </Box>
        </Card>
      </Stack>
    </Box>
  );
};

export default DriverLoadHistoryTab;
