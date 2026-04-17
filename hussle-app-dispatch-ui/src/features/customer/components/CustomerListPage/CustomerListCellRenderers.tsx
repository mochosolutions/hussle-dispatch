import { Box } from '@mui/material';
import { TwoLineCell, Amount } from 'components/Typography';
import type { Customer } from '../../../types';

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '\u2014';
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const getDaysToPayColor = (days: number): string => {
  if (days <= 30) {
    return '#4caf50';
  }
  if (days <= 60) {
    return '#ff9800';
  }
  return '#f44336';
};

export const RevenueCellRenderer: React.FC<{ data: Customer }> = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
    <Amount>{formatCurrency(undefined)}</Amount>
  </Box>
);

export const AvgDaysToPayCellRenderer: React.FC<{ data: Customer }> = () => {
  // avgDaysToPay not yet available from the API
  const value: number | undefined = undefined;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
      <Box
        component="span"
        sx={value !== undefined ? { color: getDaysToPayColor(value) } : undefined}
      >
        {value !== undefined ? value : '\u2014'}
      </Box>
    </Box>
  );
};

export const PrimaryContactCellRenderer: React.FC<{ data: Customer }> = () => {
  // Primary contact not yet available from the API
  const contactName: string | undefined = undefined;
  const contactEmail: string | undefined = undefined;

  if (!contactName) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {'\u2014'}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <TwoLineCell primary={contactName} secondary={contactEmail ?? '\u2014'} />
    </Box>
  );
};
