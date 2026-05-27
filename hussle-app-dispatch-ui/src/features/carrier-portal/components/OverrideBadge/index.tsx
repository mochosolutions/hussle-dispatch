import { Box } from '@mui/material';

interface OverrideBadgeProps {
  label?: string;
}

const OverrideBadge: React.FC<OverrideBadgeProps> = ({ label = 'Override' }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.04em',
      px: 0.875,
      py: 0.125,
      borderRadius: 0.5,
      bgcolor: 'primary.main',
      color: 'common.white',
      ml: 1,
      lineHeight: 1.2,
    }}
  >
    {label}
  </Box>
);

export default OverrideBadge;
