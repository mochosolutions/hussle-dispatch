import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export const EditableSectionHeader: React.FC<{
  title: string;
  onEdit: () => void;
}> = ({ title, onEdit }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <Typography
      variant="subtitle1"
      sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9375rem' }}
    >
      {title}
    </Typography>
    <Tooltip title={`Edit ${title.toLowerCase()}`}>
      <IconButton
        size="small"
        onClick={onEdit}
        sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}
      >
        <EditIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Tooltip>
  </Box>
);
