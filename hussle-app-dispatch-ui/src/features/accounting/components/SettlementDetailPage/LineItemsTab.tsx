import { useCallback, useMemo } from 'react';
import { Box, Button, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { MainCard, NewDataGrid } from '@mocho/ui/components';
import { Amount, Body } from 'components/Typography';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import type { SettlementDetail } from '../../types';

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
    <Amount>{currencyFormatter.format(Number(value))}</Amount>
  </Box>
);

const DateCellRenderer = ({ value }: { value: string }) => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <Body>
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Body>
    </Box>
  );
};

export const LineItemsTab: React.FC<LineItemsTabProps> = ({ settlement }) => {
  const { openDrawer } = useDrawerActions();

  const handleOpenAdjustment = useCallback(() => {
    openDrawer('addAdjustment', { settlementId: settlement.id });
  }, [openDrawer, settlement.id]);

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
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
      },
      {
        headerName: 'Load #',
        field: 'loadNumber',
        minWidth: 120,
        cellRenderer: ({ value }: { value: string }) => <Body>{value}</Body>,
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
  );
};
