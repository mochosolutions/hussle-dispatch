import { ReactNode } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface InnerPageHeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export const InnerPageHeader = ({
  onBack,
  backLabel,
  title,
  subtitle,
  actions,
}: InnerPageHeaderProps) => {
  return (
    <Box
      sx={{
        backgroundColor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 1,
        mb: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {backLabel && (
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              size="small"
              sx={{ color: 'primary.main' }}
            >
              {backLabel}
            </Button>
            <Divider orientation="vertical" flexItem />
          </>
        )}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {typeof title === 'string' ? (
              <Typography variant="h5" color="text.primary">
                {title}
              </Typography>
            ) : (
              title
            )}
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>

      {actions && (
        <Stack direction="row" spacing={1}>
          {actions}
        </Stack>
      )}
    </Box>
  );
};
