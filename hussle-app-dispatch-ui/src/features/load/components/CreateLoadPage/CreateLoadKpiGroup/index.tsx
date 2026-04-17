import React, { useMemo } from 'react';

import { Box, Stack, Typography, Divider, Fade, styled } from '@mui/material';
import { KpiCell } from 'components/Typography';
import {
  // LOAD_TYPE_OPTIONS,
  formatCurrency,
  formatCurrencyCompact,
  MARGIN_THRESHOLDS,
} from '../../../constants';

interface KpiGroupProps {
  label: string;
  children: React.ReactNode;
}

const StyledKpiCell = (props) => {
  return (
    <KpiCell
      {...props}
      sx={{
        flex: 1,
      }}
    />
  );
};

export const KpiGroup: React.FC<KpiGroupProps> = ({ label, children }) => (
  <Stack
    spacing={1.5}
    sx={{
      flex: 1,
    }}
  >
    <Typography
      variant="overline"
      sx={{ fontSize: '0.625rem', color: 'grey.500', letterSpacing: 1, mb: 10 }}
    >
      {label}
    </Typography>
    <Stack
      direction="row"
      spacing={2}
      sx={{
        display: 'flex',
        flex: 1,
        // border: '1px solid black',
      }}
    >
      {children}
    </Stack>
  </Stack>
);

export const CreateLoadSummaryBar = ({ financials }) => {
  const marginColor = useMemo(() => {
    if (financials.marginPct >= MARGIN_THRESHOLDS.good) {
      return 'success.main';
    }
    if (financials.marginPct >= MARGIN_THRESHOLDS.ok) {
      return 'warning.main';
    }
    return 'error.main';
  }, [financials.marginPct]);
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      divider={
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
      }
      sx={{
        width: '100%',
        // border: '1px solid black'
      }}
    >
      <KpiGroup label="Revenue">
        <StyledKpiCell
          label="Cust Rate"
          value={
            financials.customerRate > 0 ? formatCurrencyCompact(financials.customerRate) : '\u2014'
          }
          // sx={{
          //   flex: 1,
          // }}
        />
        <StyledKpiCell
          label="Margin"
          value={
            financials.customerRate > 0 ? formatCurrencyCompact(financials.grossMargin) : '\u2014'
          }
          valueProps={{ color: financials.customerRate > 0 ? marginColor : undefined }}
          // sx={{
          //   flex: 1,
          // }}
        />
        <StyledKpiCell
          label="Min Book"
          value={financials.minBookRate ? formatCurrency(financials.minBookRate) : '\u2014'}
          // sx={{
          //   flex: 1,
          // }}
        />
      </KpiGroup>

      <KpiGroup label="Route">
        <StyledKpiCell
          label="Trip Mi"
          value={financials.tripMiles > 0 ? financials.tripMiles.toLocaleString() : '\u2014'}
        />
        <StyledKpiCell
          label="RPM"
          value={financials.ratePerMile > 0 ? `$${financials.ratePerMile.toFixed(2)}/mi` : '\u2014'}
        />
        <Stack
          direction="row"
          spacing={2}
          sx={{
            flex: 1,
          }}
        >
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            +{financials.deadheadMiles.toLocaleString()} DH (
            {financials.totalMiles.toLocaleString()} tot)
          </Typography>
          <Typography variant="caption" sx={{ color: 'grey.400' }}>
            Tot RPM ${financials.ratePerTotalMile.toFixed(2)}/mi
          </Typography>
        </Stack>

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={2}></Stack>
          {/* {financials.deadheadMiles > 0 && (
            <Fade in timeout={200}>
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  flex: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  +{financials.deadheadMiles.toLocaleString()} DH (
                  {financials.totalMiles.toLocaleString()} tot)
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                  Tot RPM ${financials.ratePerTotalMile.toFixed(2)}/mi
                </Typography>
              </Stack>
            </Fade>
          )} */}
        </Stack>
      </KpiGroup>
      <KpiGroup label="Carrier">
        <StyledKpiCell
          label="Carrier Pay"
          value={financials.carrierPay > 0 ? formatCurrency(financials.carrierPay) : '\u2014'}
        />
        <StyledKpiCell
          label="Cost/Mi"
          value={
            financials.avgCostPerMile ? `$${financials.avgCostPerMile.toFixed(2)}/mi` : '\u2014'
          }
        />
      </KpiGroup>
    </Stack>
  );
};
