import { Box } from '@mui/material';

import { Timestamp } from 'components/Typography';
import config from '../../config';

interface PortalFooterProps {
  note?: string;
}

export const PortalFooter: React.FC<PortalFooterProps> = ({ note }) => (
  <Box component="footer" sx={{ py: 3, textAlign: 'center' }}>
    <Timestamp sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 11 }}>
      {note ?? `Powered by ${config.appName}`}
    </Timestamp>
  </Box>
);

export default PortalFooter;
