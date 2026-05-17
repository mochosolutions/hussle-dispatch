import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

import { Body } from 'components/Typography';

interface EditingCalloutProps {
  message: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

const EditingCallout: React.FC<EditingCalloutProps> = ({ message, actions, icon }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      bgcolor: 'rgba(239, 246, 255, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'primary.main',
      px: 1.75,
      py: 1.25,
      borderRadius: '0 6px 6px 0',
      mb: 2.25,
      flexWrap: 'wrap',
    }}
  >
    <Box sx={{ color: 'primary.dark', display: 'inline-flex', '& svg': { fontSize: 18 } }}>
      {icon ?? <InfoOutlined />}
    </Box>
    <Body sx={{ flex: 1, minWidth: 0, fontSize: 13, color: 'primary.dark', lineHeight: 1.45 }}>
      {message}
    </Body>
    {actions ? (
      <Box sx={{ display: 'inline-flex', gap: 1, ml: 'auto' }}>{actions}</Box>
    ) : null}
  </Box>
);

export default EditingCallout;
