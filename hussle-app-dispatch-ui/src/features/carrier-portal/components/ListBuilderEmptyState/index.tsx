import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

import { BodyMuted, BodyStrong } from 'components/Typography';

interface ListBuilderEmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCtaClick: () => void;
}

const ListBuilderEmptyState: React.FC<ListBuilderEmptyStateProps> = ({
  icon,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
}) => {
  return (
    <Box
      sx={{
        border: '1.5px dashed',
        borderColor: 'grey.200',
        bgcolor: 'grey.100',
        borderRadius: 1,
        px: 2.5,
        py: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          bgcolor: 'primary.100',
          color: 'primary.main',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1.5,
          '& svg': { fontSize: 26 },
        }}
      >
        {icon}
      </Box>

      <BodyStrong sx={{ fontSize: 15, fontWeight: 700, mb: 0.5, display: 'block' }}>
        {title}
      </BodyStrong>
      <BodyMuted sx={{ fontSize: 12.5, mb: 1.75, display: 'block' }}>{subtitle}</BodyMuted>

      <Button
        variant="contained"
        color="primary"
        onClick={onCtaClick}
        startIcon={<Add sx={{ fontSize: 14 }} />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
          px: 2.25,
          py: 1.125,
          borderRadius: 0.75,
        }}
      >
        {ctaLabel}
      </Button>
    </Box>
  );
};

export default ListBuilderEmptyState;
