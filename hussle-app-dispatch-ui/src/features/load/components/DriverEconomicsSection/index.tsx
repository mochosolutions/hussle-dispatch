import { useMemo } from 'react';
import { Box, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { FormikProps } from 'formik';
import SectionCard from 'components/SectionCard';
import { useSelector } from 'store';
import { selectCarrierById } from 'features/carrier/store/selectors/carrierSelectors';
import type { LoadFormValues } from '../../validators/loadSchema';
import type { SelectedDriverInfo } from '../../types';
import { COMPANY_DRIVER_MPG, FUEL_PPG, formatCurrencyCompact } from '../../constants';

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
  color?: string;
  bold?: boolean;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value, color, bold }) => (
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
  const selectedCarrier = useSelector(
    carrierId ? selectCarrierById(carrierId) : () => undefined,
  );

  const DEFAULT_CARRIER_PERCENT = 80;
  const dispatchFeePercent = selectedCarrier?.dispatchFeePercent;
  const carrierPercent =
    dispatchFeePercent !== undefined && dispatchFeePercent !== null
      ? 100 - dispatchFeePercent
      : DEFAULT_CARRIER_PERCENT;

  const customerRate = Number(values.customerRate) || 0;
  const apiMiles = values.calculatedTotalMiles ?? 0;
  const totalMiles = values.totalMiles ?? apiMiles;
  const carrierRate = customerRate > 0 ? Math.round((customerRate * carrierPercent) / 100) : 0;

  const driverEconomics = useMemo(() => {
    if (!selectedDriver || totalMiles === 0 || carrierRate === 0) {
      return null;
    }

    if (selectedDriver.type === 'owner_operator') {
      const driverMpg = selectedDriver.mpg ?? 6.5;
      const driverMinRpm = selectedDriver.minRpm ?? 3.2;
      const rpm = carrierRate / totalMiles;
      const fuelCost = totalMiles * (FUEL_PPG / driverMpg);
      const net = carrierRate - fuelCost;
      const belowMin = rpm < driverMinRpm;
      const highFuel = fuelCost / carrierRate > 0.2;

      return {
        type: 'owner_operator' as const,
        carrierPay: carrierRate,
        rpm,
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
    const shortLoad = totalMiles < 300;
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
  }, [selectedDriver, totalMiles, carrierRate]);

  if (!driverEconomics) {
    return null;
  }

  const title =
    driverEconomics.type === 'owner_operator'
      ? 'Owner Operator Economics'
      : 'Company Driver Economics';

  const headerBg =
    driverEconomics.type === 'owner_operator' ? 'success.50' : 'primary.50';

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
                label="Carrier Pay"
                value={formatCurrencyCompact(driverEconomics.carrierPay)}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <MetricItem
                label="Rate/Mile"
                value={`$${driverEconomics.rpm.toFixed(2)}`}
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
              <MetricItem
                label="Driver Pay Rate"
                value={`$${driverEconomics.cpm.toFixed(2)}/mi`}
              />
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
