import { Box, Button } from '@mui/material';

import { Body, BodyStrong } from 'components/Typography';

export interface MockSigningPlaceholderProps {
  onMarkSigned: () => void;
  isPending?: boolean;
}

const MockSigningPlaceholder: React.FC<MockSigningPlaceholderProps> = ({
  onMarkSigned,
  isPending = false,
}) => (
  <Box
    sx={{
      width: '100%',
      maxWidth: 420,
      mx: 'auto',
      my: { xs: 4, md: 8 },
      bgcolor: 'background.paper',
      border: '1px dashed',
      borderColor: 'grey.300',
      borderRadius: 1,
      px: { xs: 3, md: 4 },
      py: { xs: 4, md: 5 },
      textAlign: 'center',
    }}
  >
    <Box
      role="img"
      aria-label="Test tube emoji indicating mock mode"
      sx={{ fontSize: 36, mb: 1 }}
    >
      🧪
    </Box>
    <BodyStrong sx={{ display: 'block', fontSize: 15, mb: 0.5 }}>Mock mode</BodyStrong>
    <Body sx={{ color: 'text.secondary', fontSize: 13, mb: 2.5 }}>
      No real signing required. Click below to mark this agreement as signed.
    </Body>
    <Button
      variant="contained"
      color="primary"
      disabled={isPending}
      onClick={onMarkSigned}
      sx={{
        textTransform: 'none',
        fontWeight: 600,
        fontSize: 13,
        px: 2.5,
        py: 1,
        borderRadius: 0.75,
      }}
    >
      {isPending ? 'Marking…' : 'Mark as signed'}
    </Button>
  </Box>
);

export default MockSigningPlaceholder;
