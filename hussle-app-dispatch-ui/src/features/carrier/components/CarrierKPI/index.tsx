import { Box, CircularProgress, Grid } from '@mui/material';
import { differenceInCalendarDays, format, parse } from 'date-fns';
import type { CarrierListItem } from '../../types';
import type { CarrierStats } from 'utils/api/fleet/carrierApi';
import { BodyMuted, BodyStrong, KpiLabel, LinkText } from 'components/Typography';

interface CarrierKPIProps {
  /** CarrierListItem from selectFormattedCarrierById — dates are pre-formatted as MM/dd/yyyy */
  c: CarrierListItem;
  stats?: CarrierStats | null;
  statsLoading?: boolean;
}

const SELECTOR_DATE_FORMAT = 'MM/dd/yyyy';
const LABEL_SX = { minWidth: 80, flexShrink: 0 } as const;

const formatInsuranceExpiry = (insuranceExpiry: string | null): { display: string; color?: string } => {
  if (!insuranceExpiry) {
    return { display: '\u2014' };
  }

  const expiryDate = parse(insuranceExpiry, SELECTOR_DATE_FORMAT, new Date());
  const daysRemaining = differenceInCalendarDays(expiryDate, new Date());
  const formattedDate = format(expiryDate, 'MMM d, yyyy');

  if (daysRemaining < 0) {
    return { display: formattedDate, color: 'error.main' };
  }

  return {
    display: formattedDate,
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

const formatAddress = (c: CarrierListItem): string => {
  const parts = [c.city, c.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '\u2014';
};

interface KpiRowProps {
  label: string;
  value: string;
  color?: string;
}

const KpiRow: React.FC<KpiRowProps> = ({ label, value, color }) => (
  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
    <BodyMuted sx={LABEL_SX}>{label}</BodyMuted>
    <BodyStrong sx={{ lineHeight: 1.3, color: color ?? 'text.primary' }}>{value}</BodyStrong>
  </Box>
);

interface KpiRowLinkProps {
  label: string;
  value: string;
  href: string;
}

const KpiRowLink: React.FC<KpiRowLinkProps> = ({ label, value, href }) => (
  <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
    <BodyMuted sx={LABEL_SX}>{label}</BodyMuted>
    <LinkText
      sx={{ lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      onClick={() => {
        window.location.href = href;
      }}
    >
      {value}
    </LinkText>
  </Box>
);

export const CarrierKPI: React.FC<CarrierKPIProps> = ({ c, stats, statsLoading }) => {
  const revenueDisplay = statsLoading
    ? '\u2026'
    : stats
      ? formatRevenue(stats.lifetimeRevenue)
      : '\u2014';

  const revenueColor =
    stats && Number(stats.lifetimeRevenue) > 0 ? 'success.main' : undefined;

  const insuranceInfo = formatInsuranceExpiry(c.insuranceExpiry);
  const { driverCount, vehicleCount } = c;

  return (
    <Grid container spacing={2}>
      {/* Column 1 — Company Info */}
      <Grid item sm={6} md={3}>
        <KpiLabel sx={{ mb: 0.5 }}>Company Info</KpiLabel>
        <KpiRow label="MC#:" value={c.mcNumber ?? '\u2014'} />
        <KpiRow label="DOT#:" value={c.dotNumber ?? '\u2014'} />
        <KpiRow label="EIN:" value={c.ein ?? '\u2014'} />
      </Grid>

      {/* Column 2 — Contact */}
      <Grid item sm={6} md={3}>
        <KpiLabel sx={{ mb: 0.5 }}>Contact</KpiLabel>
        <KpiRow label="Phone:" value={c.phone ?? '\u2014'} />
        {c.email ? (
          <KpiRowLink label="Email:" value={c.email} href={`mailto:${c.email}`} />
        ) : (
          <KpiRow label="Email:" value="\u2014" />
        )}
        <KpiRow label="Address:" value={formatAddress(c)} />
      </Grid>

      {/* Column 3 — Fleet */}
      <Grid item sm={6} md={3}>
        <KpiLabel sx={{ mb: 0.5 }}>Fleet</KpiLabel>
        <KpiRow label="Drivers:" value={String(driverCount)} />
        <KpiRow label="Vehicles:" value={String(vehicleCount)} />
      </Grid>

      {/* Column 4 — Financials */}
      <Grid item sm={6} md={3}>
        <KpiLabel sx={{ mb: 0.5 }}>Financials</KpiLabel>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, alignItems: 'center' }}>
          <BodyMuted sx={LABEL_SX}>Revenue:</BodyMuted>
          {statsLoading ? (
            <CircularProgress size={12} />
          ) : (
            <BodyStrong sx={{ lineHeight: 1.3, color: revenueColor ?? 'text.primary' }}>
              {revenueDisplay}
            </BodyStrong>
          )}
        </Box>
        <KpiRow
          label="Margin:"
          value={c.companyMarginPercent ? `${c.companyMarginPercent}%` : '\u2014'}
        />
        <KpiRow
          label="COI Expires:"
          value={insuranceInfo.display}
          color={insuranceInfo.color}
        />
      </Grid>
    </Grid>
  );
};
