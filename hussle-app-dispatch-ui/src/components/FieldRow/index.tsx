import { Box, Typography } from '@mui/material';

export const FieldRow: React.FC<{ label: string; value: React.ReactNode; isLink?: boolean }> = ({
  label,
  value,
  isLink,
}) => (
  <Box sx={{ display: 'flex', py: 1 }}>
    <Typography variant="body2" sx={{ color: 'text.disabled', width: 120, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      component="div"
      sx={{ color: isLink ? 'primary.main' : 'text.primary', fontWeight: 500 }}
    >
      {value || '—'}
    </Typography>
  </Box>
);
