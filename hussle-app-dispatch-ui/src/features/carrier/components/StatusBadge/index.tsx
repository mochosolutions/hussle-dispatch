import React from 'react';
import { Chip } from '@mui/material';
import { CARRIER_STATUS_COLORS, CARRIER_STATUS_LABELS } from '../../constants';
import type { CarrierStatus } from '../../types';

export const StatusBadge: React.FC<{ status: CarrierStatus }> = ({ status }) => (
  <Chip
    label={CARRIER_STATUS_LABELS[status]}
    color={CARRIER_STATUS_COLORS[status]}
    size="small"
    variant="filled"
  />
);
