import { Box, Stack } from '@mui/material';

import { BodyStrong, Meta } from 'components/Typography';
import { STATUS_COLORS, STATUS_LABELS } from '../../loadStatus';

interface LoadStatusBadgeProps {
  loadNumber: string;
  status: string;
}

// Header right-slot: load number + a translucent status pill with a colored
// dot. Sits on the dark portal header, so all text is white.
export const LoadStatusBadge: React.FC<LoadStatusBadgeProps> = ({ loadNumber, status }) => {
  const color = STATUS_COLORS[status] ?? 'default';
  const dotColor = color === 'default' ? 'grey.400' : `${color}.main`;

  return (
    <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
      <BodyStrong
        sx={{ color: 'common.white', fontSize: 13, whiteSpace: 'nowrap', display: { xs: 'none', sm: 'block' } }}
      >
        {loadNumber}
      </BodyStrong>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          bgcolor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
        <Meta sx={{ color: 'common.white', opacity: 0.9, whiteSpace: 'nowrap' }}>
          {STATUS_LABELS[status] ?? status}
        </Meta>
      </Box>
    </Stack>
  );
};

export default LoadStatusBadge;
