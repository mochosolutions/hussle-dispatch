import { Box, Stack } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { BodyMedium } from 'components/Typography';

interface AvatarChipProps {
  name: string;
  size?: 'small' | 'medium';
  sx?: SxProps<Theme>;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
};

export const AvatarChip: React.FC<AvatarChipProps> = ({ name, size = 'medium', sx }) => {
  const isSmall = size === 'small';
  const avatarSize = isSmall ? 24 : 32;
  const fontSize = isSmall ? 10 : 12;

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={sx}>
      <Box
        sx={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
          bgcolor: 'primary.100',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getInitials(name)}
      </Box>
      <BodyMedium>{name}</BodyMedium>
    </Stack>
  );
};
