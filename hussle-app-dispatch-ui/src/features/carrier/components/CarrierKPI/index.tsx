import { Box, Typography } from '@mui/material';

export const CarrierKPI = (c) => {
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
      {[
        { label: 'MC / DOT', primary: c.mcNumber, secondary: c.dotNumber },
        { label: 'CONTACT', primary: c.phone ?? '—', secondary: c.email ?? '—' },
        {
          label: 'DISPATCH FEE',
          primary: `${c.dispatchFeePercent}%`,
          secondary: c.partnerSplitPercent ? `${c.partnerSplitPercent}% partner split` : '',
        },
        { label: 'DRIVERS', primary: '2', secondary: '1 available, 1 at delivery' },
        {
          label: 'LIFETIME REVENUE',
          primary: '$12,800',
          secondary: '8 loads',
          highlight: true,
        },
        {
          label: 'COI EXPIRES',
          primary: 'Aug 30, 2026',
          secondary: '152 days remaining',
          highlightGreen: true,
        },
      ].map((kpi, i) => (
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
              color: kpi.highlight || kpi.highlightGreen ? 'success.main' : 'text.primary',
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
