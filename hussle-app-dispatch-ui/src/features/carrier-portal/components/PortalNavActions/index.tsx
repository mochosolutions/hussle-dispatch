import { Box, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

import { Meta } from 'components/Typography';

interface PortalNavActionsProps {
  onSaveExit?: () => void;
  showSaveExit?: boolean;
}

const PortalNavActions: React.FC<PortalNavActionsProps> = ({
  onSaveExit,
  showSaveExit = true,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        <LockOutlined sx={{ fontSize: 12, color: 'secondary.light' }} />
        <Meta sx={{ color: 'grey.300', fontSize: 12 }}>Secure</Meta>
      </Box>

      {showSaveExit ? (
        <>
          <Box
            sx={{
              width: '1px',
              height: 18,
              bgcolor: 'rgba(255, 255, 255, 0.12)',
            }}
          />
          <Button
            onClick={onSaveExit}
            sx={{
              color: 'grey.200',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              fontSize: 12.5,
              fontWeight: 600,
              px: 1.5,
              py: 0.75,
              borderRadius: 0.75,
              textTransform: 'none',
              lineHeight: 1,
              minWidth: 'auto',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
            }}
          >
            Save &amp; exit
          </Button>
        </>
      ) : null}
    </Box>
  );
};

export default PortalNavActions;
