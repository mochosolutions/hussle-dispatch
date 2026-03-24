import { Box, Typography } from '@mui/material';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import type { Carrier } from '../../types';

interface CarrierKPIProps {
  /** Carrier from selectFormattedCarrierById — dates are pre-formatted as MM/dd/yyyy */
  c: Carrier;
}

interface KpiItem {
  label: string;
  primary: string;
  secondary: string;
  color?: 'success.main' | 'error.main' | 'text.primary';
}

const SELECTOR_DATE_FORMAT = 'MM/dd/yyyy';

const buildInsuranceKpi = (insuranceExpiry: string | null): KpiItem => {
  if (!insuranceExpiry) {
    return { label: 'COI EXPIRES', primary: '\u2014', secondary: '' };
  }

  const expiryDate = parse(insuranceExpiry, SELECTOR_DATE_FORMAT, new Date());
  const daysRemaining = differenceInCalendarDays(expiryDate, new Date());
  const formattedDate = format(expiryDate, 'MMM d, yyyy');

  if (daysRemaining < 0) {
    return { label: 'COI EXPIRES', primary: formattedDate, secondary: 'Expired', color: 'error.main' };
  }

  return {
    label: 'COI EXPIRES',
    primary: formattedDate,
    secondary: `${daysRemaining} days remaining`,
    color: daysRemaining > 30 ? 'success.main' : undefined,
  };
};

export const CarrierKPI: React.FC<CarrierKPIProps> = ({ c }) => {
  const kpiItems: KpiItem[] = [
    { label: 'MC / DOT', primary: c.mcNumber ?? '\u2014', secondary: c.dotNumber ?? '\u2014' },
    { label: 'CONTACT', primary: c.phone ?? '\u2014', secondary: c.email ?? '\u2014' },
    {
      label: 'DISPATCH FEE',
      primary: c.dispatchFeePercent ? `${c.dispatchFeePercent}%` : '\u2014',
      secondary: c.partnerSplitPercent ? `${c.partnerSplitPercent}% partner split` : '',
    },
    {
      label: 'DRIVERS',
      primary: '\u2014',
      secondary: '',
    },
    {
      label: 'LIFETIME REVENUE',
      primary: '\u2014',
      secondary: '',
    },
    buildInsuranceKpi(c.insuranceExpiry),
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'grey.50',
      }}
    >
      {kpiItems.map((kpi, i) => (
        <Box
          key={kpi.label}
          sx={{
            px: 2.5,
            py: 1.5,
            borderRight: i < 5 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: 'text.disabled',
              fontSize: '0.625rem',
            }}
          >
            {kpi.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: kpi.color ?? 'text.primary',
              mt: 0.5,
            }}
          >
            {kpi.primary}
          </Typography>
          <Typography variant="caption">{kpi.secondary}</Typography>
        </Box>
      ))}
    </Box>
  );
};
