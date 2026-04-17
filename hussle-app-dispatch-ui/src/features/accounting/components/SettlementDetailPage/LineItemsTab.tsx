import { useCallback, useMemo, useState } from 'react';
import { Box, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MainCard, NewDataGrid } from '@mocho/ui/components';
import { AddAdjustmentDrawer } from '../../../components/AddAdjustmentDrawer';
import type { SettlementDetail, SettlementLineItem } from '../../../types';

interface LineItemsTabProps {
  settlement: SettlementDetail;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const TypeCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    <Chip label={value} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
  </Box>
);

const CurrencyCellRenderer = ({ value }: { value: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
    {currencyFormatter.format(Number(value))}
  </Box>
);

const DateCellRenderer = ({ value }: { value: string }) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
    </Box>
  );
};

export const LineItemsTab: React.FC<LineItemsTabProps> = ({ settlement }) => {
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  const handleOpenAdjustment = useCallback(() => {
    setAdjustmentOpen(true);
  }, []);

  const handleCloseAdjustment = useCallback(() => {
    setAdjustmentOpen(false);
  }, []);

  const columnDefs = useMemo(
    () => [
      {
        headerName: 'Type',
        field: 'type',
        minWidth: 130,
        cellRenderer: TypeCellRenderer,
      },
      {
        headerName: 'Description',
        field: 'description',
        minWidth: 200,
        flex: 2,
      },
      {
        headerName: 'Load #',
        field: 'loadNumber',
        minWidth: 120,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        minWidth: 130,
        cellRenderer: CurrencyCellRenderer,
      },
      {
        headerName: 'Date',
        field: 'date',
        minWidth: 140,
        cellRenderer: DateCellRenderer,
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
    <>
      <MainCard
        title="Line Items"
        secondary={
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenAdjustment}
          >
            Add Adjustment
          </Button>
        }
        content={false}
      >
        <Box sx={{ minHeight: 300 }}>
          <NewDataGrid
            columnDefs={columnDefs}
            rowData={settlement.lineItems}
            defaultColDef={defaultColDef}
            showRowCountFooter
            totalRowCount={settlement.lineItems.length}
            rowCountLabel="line items"
            noDataMessage="No line items"
            gridOptions={{
              domLayout: 'autoHeight',
              suppressCellFocus: true,
              headerHeight: 44,
              rowHeight: 48,
            }}
          />
        </Box>
      </MainCard>

      {adjustmentOpen && (
        <AddAdjustmentDrawer
          settlementId={settlement.id}
          onClose={handleCloseAdjustment}
        />
      )}
    </>
  );
};
