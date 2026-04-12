import { Box, CircularProgress, Typography } from '@mui/material';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import type { Carrier } from '../../types';
import type { CarrierStats } from 'utils/api/fleet/carrierApi';

interface CarrierKPIProps {
  /** Carrier from selectFormattedCarrierById — dates are pre-formatted as MM/dd/yyyy */
  c: Carrier;
  stats?: CarrierStats | null;
  statsLoading?: boolean;
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

const formatRevenue = (value: string): string => {
  const num = Number(value);
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(1)}K`;
  }
  return `$${num.toLocaleString()}`;
};

export const CarrierKPI: React.FC<CarrierKPIProps> = ({ c, stats, statsLoading }) => {
  const revenueDisplay = statsLoading
    ? '\u2026'
    : stats ? formatRevenue(stats.lifetimeRevenue) : '\u2014';

  const loadCountDisplay = statsLoading
    ? ''
    : stats ? `${stats.loadCount} loads` : '';

  const kpiItems: KpiItem[] = [
    { label: 'MC / DOT', primary: c.mcNumber ?? '\u2014', secondary: c.dotNumber ?? '\u2014' },
    { label: 'CONTACT', primary: c.phone ?? '\u2014', secondary: c.email ?? '\u2014' },
    {
      label: 'COMPANY MARGIN',
      primary: c.companyMarginPercent ? `${c.companyMarginPercent}%` : '\u2014',
      secondary: '',
    },
    {
      label: 'DRIVERS',
      primary: String(c.driverCount ?? 0),
      secondary: c.vehicleCount !== undefined ? `${c.vehicleCount} vehicles` : '',
    },
    {
      label: 'LIFETIME REVENUE',
      primary: revenueDisplay,
      secondary: loadCountDisplay,
      color: stats && Number(stats.lifetimeRevenue) > 0 ? 'success.main' : undefined,
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
