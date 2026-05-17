import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import { BodyMuted, BodyStrong } from 'components/Typography';

interface SectionHeadProps {
  number: number;
  title: string;
  titleSuffix?: ReactNode;
  rightSlot?: ReactNode;
}

const SectionHead: React.FC<SectionHeadProps> = ({ number, title, titleSuffix, rightSlot }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 1.5,
      mb: 1.5,
      flexWrap: 'wrap',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: '50%',
          bgcolor: 'rgba(238, 242, 255, 1)',
          color: 'rgba(55, 48, 163, 1)',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {number}
      </Box>
      <BodyStrong sx={{ fontSize: 15, fontWeight: 700 }}>{title}</BodyStrong>
      {titleSuffix}
    </Box>
    {rightSlot ? (
      <BodyMuted sx={{ fontSize: 12, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>
        {rightSlot}
      </BodyMuted>
    ) : null}
  </Box>
);

export default SectionHead;
