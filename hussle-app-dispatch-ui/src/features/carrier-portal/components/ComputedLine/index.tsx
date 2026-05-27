import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { FunctionsOutlined } from '@mui/icons-material';

import { BodyStrong } from 'components/Typography';

interface ComputedLineProps {
  label: string;
  value: string;
  icon?: ReactNode;
}

const ComputedLine: React.FC<ComputedLineProps> = ({ label, value, icon }) => {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 200px' },
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        mt: 0.75,
        bgcolor: 'rgba(239, 246, 255, 1)',
        border: '1px solid',
        borderColor: 'rgba(191, 219, 254, 1)',
        borderRadius: 0.75,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          fontSize: 12.5,
          fontWeight: 600,
          color: 'rgba(30, 64, 175, 1)',
          '& svg': { fontSize: 14 },
        }}
      >
        {icon ?? <FunctionsOutlined />}
        {label}
      </Box>
      <BodyStrong
        sx={{
          fontSize: 14,
          fontWeight: 700,
          textAlign: 'right',
          color: 'rgba(30, 58, 138, 1)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </BodyStrong>
    </Box>
  );
};

export default ComputedLine;
