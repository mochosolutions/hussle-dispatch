import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Popover,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { STATUS_OPTIONS } from '../../constants';
import { CarrierData } from '../../types';

export const StatusBadge: React.FC<{
  status: CarrierData['status'];
  onChange: (status: CarrierData['status']) => void;
}> = ({ status, onChange }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = STATUS_OPTIONS.find((s) => s.value === status)!;

  const colorMap: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    approved: 'success',
    pending: 'warning',
    suspended: 'error',
    draft: 'default',
  };

  return (
    <>
      <Chip
        icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important' }} />}
        label={current.label}
        color={colorMap[status]}
        variant="outlined"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ cursor: 'pointer', fontWeight: 600 }}
      />
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { mt: 0.5, minWidth: 180 } }}
      >
        <Box sx={{ py: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ px: 2, py: 1, display: 'block', fontWeight: 600, color: 'text.secondary' }}
          >
            Change Status
          </Typography>
          <List dense disablePadding>
            {STATUS_OPTIONS.map((opt) => (
              <ListItemButton
                key={opt.value}
                selected={opt.value === status}
                onClick={() => {
                  onChange(opt.value);
                  setAnchorEl(null);
                }}
                sx={{ px: 2, py: 0.75 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 10, color: opt.color }} />
                </ListItemIcon>
                <ListItemText
                  primary={opt.label}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: opt.value === status ? 600 : 400,
                  }}
                />
                {opt.value === status && (
                  <CheckIcon sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} />
                )}
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Popover>
    </>
  );
};
