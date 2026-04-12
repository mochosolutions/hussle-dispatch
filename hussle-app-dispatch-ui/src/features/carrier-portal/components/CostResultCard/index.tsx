import { Box, Card, Grid, Typography } from '@mui/material';

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
    <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 600 }}>
      {value}
    </Typography>
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
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
          Minimum Rate Per Mile
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {formatCurrency(minimumRatePerMile)}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
          Break-Even RPM
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {formatCurrency(breakEvenRpm)}
        </Typography>
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
