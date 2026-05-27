import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import PortalHeader from '../PortalHeader';

interface PortalShellProps {
  children: ReactNode;
  stepper?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  brandSubtitle?: string;
}

const PortalShell: React.FC<PortalShellProps> = ({
  children,
  stepper,
  footer,
  headerActions,
  brandSubtitle,
}) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.100',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PortalHeader brandSubtitle={brandSubtitle} rightSlot={headerActions} />

      {stepper ? (
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'grey.200',
            px: 3,
            py: 1.75,
          }}
        >
          {stepper}
        </Box>
      ) : null}

      <Box
        component="main"
        sx={{
          flex: 1,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          px: { xs: 2, md: 3 },
          pt: { xs: 4, md: 5 },
          // Bottom padding must clear the sticky footer (~70px) so long
          // content (cost-analysis) doesn't end up beneath it.
          pb: footer ? { xs: 12, md: 14 } : { xs: 8, md: 10 },
        }}
      >
        {children}
      </Box>

      {footer}
    </Box>
  );
};

export default PortalShell;
