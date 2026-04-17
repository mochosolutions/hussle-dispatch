import { useMemo } from 'react';
import { Box, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { FormikProps } from 'formik';
import SectionCard from 'components/SectionCard';
import { useSelector } from 'store';
import { selectCarrierById } from 'features/carrier/store/selectors/carrierSelectors';
import type { LoadFormValues } from '../../../../../../validators/loadSchema';
import type { SelectedDriverInfo } from '../../../../../../types';
import { formatCurrencyCompact } from '../../../../../../constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverEconomicsSectionProps {
  formik: FormikProps<LoadFormValues>;
  selectedDriver: SelectedDriverInfo | null;
}

// ---------------------------------------------------------------------------
// Metric display helper
// ---------------------------------------------------------------------------

interface MetricItemProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  bold?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, subtitle, color, bold }) => (
  <Box>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ textTransform: 'uppercase', fontWeight: 600, fontSize: 10, display: 'block', mb: 0.25 }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{ fontWeight: bold ? 700 : 600, color: color ?? 'text.primary' }}
    >
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" sx={{ color: 'grey.500', display: 'block' }}>
        {subtitle}
      </Typography>
    )}
  </Box>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DriverEconomicsSection: React.FC<DriverEconomicsSectionProps> = ({
  formik,
  selectedDriver,
}) => {
  const { values } = formik;
  const carrierId = values.carrierId as string | undefined;
  const selectedCarrier = useSelector(carrierId ? selectCarrierById(carrierId) : () => undefined);

  const DEFAULT_CARRIER_PERCENT = 80;
  const companyMarginPercent = selectedCarrier?.companyMarginPercent;
  const carrierPercent =
    companyMarginPercent !== undefined && companyMarginPercent !== null
      ? 100 - companyMarginPercent
      : DEFAULT_CARRIER_PERCENT;

  const customerRate = Number(values.customerRate) || 0;
  const apiMiles = values.calculatedTripMiles ?? 0;
  const tripMiles = values.loadedMiles ?? apiMiles;
  const carrierPayout = customerRate > 0 ? Math.round((customerRate * carrierPercent) / 100) : 0;

  const accessorials = values.accessorials as Array<{ amount?: number | string }> | undefined;
  const accTotal = (accessorials ?? []).reduce(
    (sum, a) => sum + (Number(a.amount) || 0),
    0,
  );

  const FUEL_PPG = 4.2;
  const COMPANY_DRIVER_MPG = 7.5;

  const deadheadMiles = Number(values.deadheadMiles) || 0;
  const totalMiles = tripMiles + deadheadMiles;

  const driverEconomics = useMemo(() => {
    if (!selectedDriver || tripMiles === 0 || carrierPayout === 0) {
      return null;
    }

    if (selectedDriver.type === 'owner_operator') {
      const driverMpg = selectedDriver.mpg ?? 6.5;
      const driverMinRpm = selectedDriver.minRpm ?? 3.2;
      const hasDeadhead = deadheadMiles > 0;
      const rpm = hasDeadhead ? carrierPayout / totalMiles : carrierPayout / tripMiles;
      const tripRpm = carrierPayout / tripMiles;
      const fuelCost = totalMiles * (FUEL_PPG / driverMpg);
      const net = carrierPayout - fuelCost;
      const belowMin = (carrierPayout / totalMiles) < driverMinRpm;
      const highFuel = fuelCost / carrierPayout > 0.2;

      return {
        type: 'owner_operator' as const,
        carrierPay: carrierPayout,
        rpm,
        tripRpm,
        hasDeadhead,
        minRpm: driverMinRpm,
        fuelCost: Math.round(fuelCost),
        net: Math.round(net),
        belowMin,
        highFuel,
      };
    }

    const driverCpm = selectedDriver.cpm ?? 0.58;
    const driverMinEarnings = selectedDriver.minEarnings ?? 300;
    const earnings = totalMiles * driverCpm;
    const fuel = totalMiles * (FUEL_PPG / COMPANY_DRIVER_MPG);
    const takeHome = earnings - fuel;
    const shortLoad = tripMiles < 300;
    const belowMin = earnings < driverMinEarnings;

    return {
      type: 'company' as const,
      cpm: driverCpm,
      earnings: Math.round(earnings),
      fuel: Math.round(fuel),
      takeHome: Math.round(takeHome),
      shortLoad,
      belowMin,
      minEarnings: driverMinEarnings,
    };
  }, [selectedDriver, tripMiles, carrierPayout, deadheadMiles, totalMiles]);

  if (!driverEconomics) {
    return null;
  }

  const title =
    driverEconomics.type === 'owner_operator'
      ? 'Owner Operator Economics'
      : 'Company Driver Economics';

  const headerBg = driverEconomics.type === 'owner_operator' ? 'success.50' : 'primary.50';

  return (
    <SectionCard
      title={title}
      subtitle="Estimated driver earnings for this load"
      headerSX={{
        backgroundColor: headerBg,
      }}
    >
      {driverEconomics.type === 'owner_operator' ? (
        <Stack spacing={1.5}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Carrier Payout"
                value={formatCurrencyCompact(driverEconomics.carrierPay)}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Rate/Mile"
                value={
                  driverEconomics.hasDeadhead
                    ? `$${driverEconomics.rpm.toFixed(2)}/tot mi`
                    : `$${driverEconomics.rpm.toFixed(2)}/mi`
                }
                subtitle={
                  driverEconomics.hasDeadhead
                    ? `$${driverEconomics.tripRpm.toFixed(2)}/trip mi`
                    : undefined
                }
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Their Minimum"
                value={`$${driverEconomics.minRpm.toFixed(2)}/mi`}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Est. Fuel Cost"
                value={formatCurrencyCompact(-driverEconomics.fuelCost)}
                color="error.main"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Owner Op Net"
                value={formatCurrencyCompact(driverEconomics.net)}
                color={driverEconomics.net > 0 ? 'success.main' : 'error.main'}
                bold
              />
            </Grid>
          </Grid>
          <Divider />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {driverEconomics.belowMin ? (
              <Chip
                icon={<CancelIcon />}
                label="Below owner op minimum"
                color="error"
                size="small"
              />
            ) : (
              <Chip
                icon={<CheckCircleIcon />}
                label="Rate above minimum"
                color="success"
                size="small"
              />
            )}
            {driverEconomics.highFuel && (
              <Chip
                icon={<WarningAmberIcon />}
                label="High fuel burden"
                color="warning"
                size="small"
              />
            )}
          </Stack>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <MetricItem label="Driver Pay Rate" value={`$${driverEconomics.cpm.toFixed(2)}/mi`} />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Gross Earnings"
                value={formatCurrencyCompact(driverEconomics.earnings)}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Est. Fuel"
                value={formatCurrencyCompact(-driverEconomics.fuel)}
                color="error.main"
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Take-Home"
                value={formatCurrencyCompact(driverEconomics.takeHome)}
                color={driverEconomics.takeHome > 0 ? 'success.main' : 'error.main'}
                bold
              />
            </Grid>
          </Grid>
          <Divider />
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {driverEconomics.shortLoad && (
              <Chip
                icon={<WarningAmberIcon />}
                label="Short load, low driver earnings"
                color="warning"
                size="small"
              />
            )}
            {driverEconomics.belowMin && (
              <Chip
                icon={<WarningAmberIcon />}
                label="Below recommended minimum"
                color="warning"
                size="small"
              />
            )}
            {!driverEconomics.shortLoad && !driverEconomics.belowMin && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Earnings solid"
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Stack>
      )}
    </SectionCard>
  );
};
