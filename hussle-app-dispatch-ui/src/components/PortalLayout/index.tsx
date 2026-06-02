import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import PortalHeader from 'components/PortalHeader';

interface PortalLayoutProps {
  children: ReactNode;
  stepper?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  brandSubtitle?: string;
  // When set, the main content is constrained to this width and centered.
  // Leave unset for full-width layouts whose children manage their own width.
  contentMaxWidth?: number | string;
}

const PortalLayout: React.FC<PortalLayoutProps> = ({
  children,
  stepper,
  footer,
  headerActions,
  brandSubtitle,
  contentMaxWidth,
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
          pt: { xs: 3, md: 4 },
          // Bottom padding clears a sticky footer (~70px) so long content
          // doesn't end up beneath it. In-flow footers don't need the gap.
          pb: footer ? { xs: 12, md: 14 } : { xs: 4, md: 6 },
        }}
      >
        {contentMaxWidth ? (
          <Box sx={{ width: '100%', maxWidth: contentMaxWidth }}>{children}</Box>
        ) : (
          children
        )}
      </Box>

      {footer}
    </Box>
  );
};

export default PortalLayout;
