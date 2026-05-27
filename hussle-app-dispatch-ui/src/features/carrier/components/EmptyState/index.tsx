import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Timestamp } from 'components/Typography';

interface EmptyStateProps {
  icon: ReactNode;
  label: string;
  buttonLabel: string;
  onAdd: () => void;
}

export const EmptyState = ({ icon, label, buttonLabel, onAdd }: EmptyStateProps) => (
  <Box
    sx={{
      py: 4,
      textAlign: 'center',
      border: 1,
      borderStyle: 'dashed',
      borderColor: 'divider',
      borderRadius: 1,
      bgcolor: 'grey.50',
    }}
  >
    <Box sx={{ mb: 1 }}>{icon}</Box>
    <Timestamp sx={{ mb: 1.5 }}>{label}</Timestamp>
    <Button
      size="small"
      startIcon={<AddIcon />}
      onClick={onAdd}
      sx={{
        bgcolor: 'primary.light',
        color: 'primary.main',
        fontWeight: 600,
        borderRadius: 5,
        px: 2,
        '&:hover': { bgcolor: 'primary.light' },
      }}
    >
      {buttonLabel}
    </Button>
  </Box>
);
