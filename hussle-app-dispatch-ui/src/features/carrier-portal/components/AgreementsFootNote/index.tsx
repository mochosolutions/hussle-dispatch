import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { TaskAltOutlined } from '@mui/icons-material';

import { Body } from 'components/Typography';

export interface AgreementsFootNoteProps {
  children: ReactNode;
}

const AgreementsFootNote: React.FC<AgreementsFootNoteProps> = ({ children }) => (
  <Box
    sx={{
      mt: 2,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      px: 1.75,
      py: 1.25,
      bgcolor: 'grey.50',
      border: '1px solid',
      borderColor: 'grey.200',
      borderRadius: 0.75,
    }}
  >
    <Box
      sx={{
        color: 'text.secondary',
        mt: 0.25,
        flexShrink: 0,
        '& svg': { fontSize: 14 },
      }}
    >
      <TaskAltOutlined />
    </Box>
    <Body sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.5 }}>{children}</Body>
  </Box>
);

export default AgreementsFootNote;
