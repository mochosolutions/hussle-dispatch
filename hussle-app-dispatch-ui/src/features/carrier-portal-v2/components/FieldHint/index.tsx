import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

import { Meta } from 'components/Typography';

interface FieldHintProps {
  children: ReactNode;
}

const FieldHint: React.FC<FieldHintProps> = ({ children }) => {
  return (
    <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
      <InfoOutlined sx={{ fontSize: 13, mt: 0.25, color: 'text.secondary', flexShrink: 0 }} />
      <Meta sx={{ fontSize: 12.5, lineHeight: 1.5 }}>{children}</Meta>
    </Box>
  );
};

export default FieldHint;
