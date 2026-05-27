import { useMemo } from 'react';
import { Box } from '@mui/material';

import { NewDataGrid } from '@mocho/ui/components';
import SectionCard from 'components/SectionCard';

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
      <SectionCard title="Load History">
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
      </SectionCard>
    </Box>
  );
};

export default DriverLoadHistoryTab;
