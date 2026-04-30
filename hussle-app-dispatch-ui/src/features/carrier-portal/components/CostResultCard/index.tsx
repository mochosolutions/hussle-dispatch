import { Box, Card, Grid } from '@mui/material';

import { AmountDisplay, BodyStrong, Meta } from 'components/Typography';

interface CostResultCardProps {
  breakEvenRpm: number;
  minimumRatePerMile: number;
  totalMonthlyExpenses: number;
  fuelCostPerMile: number;
  projectedNetPerMonth: number;
  revenuePerMile: number;
}

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;

interface MetricItemProps {
  label: string;
  value: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value }) => (
  <Box sx={{ transition: 'all 0.3s ease' }}>
    <Meta sx={{ opacity: 0.8, mb: 0.5, color: 'common.white' }}>{label}</Meta>
    <BodyStrong sx={{ color: 'common.white' }}>{value}</BodyStrong>
  </Box>
);

export const CostResultCard: React.FC<CostResultCardProps> = ({
  breakEvenRpm,
  minimumRatePerMile,
  totalMonthlyExpenses,
  fuelCostPerMile,
  projectedNetPerMonth,
  revenuePerMile,
}) => (
  <Card sx={{ bgcolor: 'primary.dark', color: 'white', p: 3, borderRadius: 2 }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-around',
        mb: 3,
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <Meta sx={{ opacity: 0.8, mb: 0.5, color: 'common.white' }}>
          Minimum Rate Per Mile
        </Meta>
        <AmountDisplay sx={{ color: 'common.white' }}>
          {formatCurrency(minimumRatePerMile)}
        </AmountDisplay>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Meta sx={{ opacity: 0.8, mb: 0.5, color: 'common.white' }}>
          Break-Even RPM
        </Meta>
        <AmountDisplay sx={{ color: 'common.white' }}>
          {formatCurrency(breakEvenRpm)}
        </AmountDisplay>
      </Box>
    </Box>
    <Grid container spacing={2}>
      <Grid item xs={6} sm={3}>
        <MetricItem label="Monthly Expenses" value={formatCurrency(totalMonthlyExpenses)} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <MetricItem label="Fuel Cost / Mile" value={formatCurrency(fuelCostPerMile)} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <MetricItem label="Projected Net / Month" value={formatCurrency(projectedNetPerMonth)} />
      </Grid>
      <Grid item xs={6} sm={3}>
        <MetricItem label="Revenue / Mile" value={formatCurrency(revenuePerMile)} />
      </Grid>
    </Grid>
  </Card>
);
