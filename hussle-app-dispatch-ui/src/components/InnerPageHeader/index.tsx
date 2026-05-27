import { ReactNode } from 'react';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface InnerPageHeaderProps {
  onBack?: () => void;
  backLabel?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  sx?: SxProps<Theme>;
}

export const InnerPageHeader = ({
  onBack,
  backLabel,
  title,
  subtitle,
  actions,
  sx,
}: InnerPageHeaderProps) => {
  return (
    <Box
      sx={{
        backgroundColor: 'primary.900',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        px: { xs: 2, sm: 3 },
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        ...sx,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          // gap: 1,
          flexDirection: 'column',
        }}
      >
        {onBack && backLabel && (
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={onBack}
              size="small"
              sx={{
                justifyContent: 'flex-start',
                color: 'grey.300',
                textDecoration: 'none',
                marginBottom: 1,
                '&:hover': {
                  backgroundColor: 'transparent',
                  color: 'grey.100',
                },
              }}
            >
              {backLabel}
            </Button>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: 'grey.100',
              }}
            />
          </>
        )}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {typeof title === 'string' ? <Typography variant="h5">{title}</Typography> : title}
          </Box>
          {subtitle && <Typography variant="body2">{subtitle}</Typography>}
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
