import { Box, Typography } from '@mui/material';

interface PhaseDividerProps {
  phaseName: string;
}

export const PhaseDivider: React.FC<PhaseDividerProps> = ({ phaseName }) => (
  <Box sx={{ my: 5, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Box sx={{ flex: 1, height: '1px', bgcolor: 'grey.200' }} />
    <Box sx={{ bgcolor: 'grey.100', borderRadius: '12px', px: 2, py: 0.5 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '1px' }}>
        {phaseName}
      </Typography>
    </Box>
    <Box sx={{ flex: 1, height: '1px', bgcolor: 'grey.200' }} />
  </Box>
);
