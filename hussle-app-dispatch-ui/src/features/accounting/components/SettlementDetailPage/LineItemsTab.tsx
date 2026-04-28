import { useCallback, useMemo } from 'react';
import { Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SectionCard from 'components/SectionCard';
import { Amount, Body, BodyMuted } from 'components/Typography';
import { useDrawerActions } from 'features/ui/hooks/useDrawerActions';
import type { SettlementDetail, SettlementLineItem } from '../../types';

interface LineItemsTabProps {
  settlement: SettlementDetail;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

// Ordered groups to render; labels shown as section titles.
const GROUP_ORDER: Array<{ type: string; label: string }> = [
  { type: 'LOAD_REVENUE', label: 'Load Revenue' },
  { type: 'DISPATCH_FEE', label: 'Dispatch Fee' },
  { type: 'DRIVER_PAY', label: 'Driver Pay' },
  { type: 'ACCESSORIAL', label: 'Accessorial' },
  { type: 'ADJUSTMENT', label: 'Adjustment' },
  { type: 'EXPENSE', label: 'Expense' },
];

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const LineItemsTable: React.FC<{ items: SettlementLineItem[] }> = ({ items }) => (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell>Description</TableCell>
        <TableCell>Load #</TableCell>
        <TableCell>Date</TableCell>
        <TableCell align="right">Amount</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell>
            <Body>{item.description}</Body>
          </TableCell>
          <TableCell>
            <Body>{item.loadNumber ?? '—'}</Body>
          </TableCell>
          <TableCell>
            <Body>{formatDate(item.date)}</Body>
          </TableCell>
          <TableCell align="right">
            <Amount>{currencyFormatter.format(Number(item.amount))}</Amount>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const LineItemsTab: React.FC<LineItemsTabProps> = ({ settlement }) => {
  const { openDrawer } = useDrawerActions();

  const handleOpenAdjustment = useCallback(() => {
    openDrawer('addAdjustment', { settlementId: settlement.id });
  }, [openDrawer, settlement.id]);

  const grouped = useMemo(() => {
    const map = new Map<string, SettlementLineItem[]>();
    settlement.lineItems.forEach((item) => {
      const existing = map.get(item.type);
      if (existing) {
        existing.push(item);
      } else {
        map.set(item.type, [item]);
      }
    });
    return map;
  }, [settlement.lineItems]);

  return (
    <Stack spacing={3} data-testid="settlement-line-items-groups">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleOpenAdjustment}
        >
          Add Adjustment
        </Button>
      </Box>

      {settlement.lineItems.length === 0 && (
        <SectionCard title="Line Items">
          <BodyMuted sx={{ p: 2 }}>No line items.</BodyMuted>
        </SectionCard>
      )}

      {GROUP_ORDER.map(({ type, label }) => {
        const items = grouped.get(type) ?? [];
        if (items.length === 0) {
          return null;
        }
        return (
          <SectionCard key={type} title={label} data-testid={`line-items-group-${type}`}>
            <LineItemsTable items={items} />
          </SectionCard>
        );
      })}
    </Stack>
  );
};
