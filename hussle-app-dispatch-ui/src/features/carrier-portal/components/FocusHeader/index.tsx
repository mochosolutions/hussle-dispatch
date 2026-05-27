import { Box, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';

import DotTrail, { type DotTrailItem } from '../DotTrail';

interface FocusHeaderProps {
  backLabel?: string;
  onBack?: () => void;
  eyebrow: string;
  title: string;
  trail?: DotTrailItem[];
}

const FocusHeader: React.FC<FocusHeaderProps> = ({
  backLabel = 'All documents',
  onBack,
  eyebrow,
  title,
  trail,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
      <Button
        onClick={onBack}
        variant="text"
        startIcon={<ArrowBack sx={{ fontSize: 14 }} />}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 13,
          color: 'text.secondary',
          px: 1.25,
          py: 0.75,
          ml: -0.75,
          borderRadius: 0.75,
          flexShrink: 0,
          '&:hover': { color: 'text.primary', bgcolor: 'grey.100' },
        }}
      >
        {backLabel}
      </Button>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
        <Meta
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: 'text.secondary',
            mb: 0.125,
          }}
        >
          {eyebrow}
        </Meta>
        <BodyStrong
          sx={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}
        >
          {title}
        </BodyStrong>
      </Box>

      {trail && trail.length > 0 ? <DotTrail items={trail} /> : null}
    </Box>
  );
};

export default FocusHeader;
