import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { format, parseISO } from 'date-fns';

import type { MockLoad } from '../../types';
import { getScoreTier } from '../../getScoreTier';
import { currencyFormatter, milesFormatter, ratePerMileFormatter, weightFormatter } from '../../formatters';

interface LoadWorkspaceHeaderProps {
  load: MockLoad;
  milesOverride?: number;
  totalWeight?: number;
  routeHeadline?: string;
}

export const LoadWorkspaceHeader: React.FC<LoadWorkspaceHeaderProps> = ({
  load,
  milesOverride,
  totalWeight,
  routeHeadline: routeHeadlineProp,
}) => {
  const tier = getScoreTier(load.score);
  const miles = milesOverride ?? load.miles;
  const pickupDateFormatted = format(parseISO(load.pickupDate), 'MMM d');
  const routeHeadline = routeHeadlineProp
    ?? `${load.origin.city}, ${load.origin.state} \u2192 ${load.destination.city}, ${load.destination.state}`;

  const metaParts = [
    `${milesFormatter.format(miles)} mi`,
    load.equipmentType,
  ];

  if (totalWeight && totalWeight > 0) {
    metaParts.push(`${weightFormatter.format(totalWeight)} lbs`);
  }

  metaParts.push(`Pickup ${pickupDateFormatted}`);
  const metaLine = metaParts.join(' \u00B7 ');

  const hasRate = load.rate !== null;
  const perMile = hasRate && miles > 0 && load.rate !== null
    ? `(${ratePerMileFormatter.format(load.rate / miles)}/mi)`
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {/* Row 1: Source chip + IDs */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip label={load.source.type} size="small" variant="outlined" />
        <Typography variant="body2">{load.id}</Typography>
        {load.externalId && (
          <Typography variant="caption" color="text.secondary">
            {load.externalId}
          </Typography>
        )}
      </Box>

      {/* Row 2: Route headline */}
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {routeHeadline}
      </Typography>

      {/* Row 3: Meta line */}
      <Typography variant="body2" color="text.secondary">
        {metaLine}
      </Typography>

      {/* Row 4: Rate + chips */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {hasRate && load.rate !== null ? (
          <>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currencyFormatter.format(load.rate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {perMile}
            </Typography>
          </>
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700 }} color="primary.main">
            Call
          </Typography>
        )}

        {load.vsMinimum !== null && (
          <Chip
            label={`${load.vsMinimum > 0 ? '+' : ''}${load.vsMinimum.toFixed(1)}% vs min`}
            size="small"
            sx={{
              bgcolor: load.vsMinimum >= 0 ? 'success.light' : 'error.light',
              color: load.vsMinimum >= 0 ? 'success.dark' : 'error.dark',
              fontWeight: 600,
            }}
          />
        )}

        <Chip
          label={`${tier.label}`}
          size="small"
          sx={{ bgcolor: tier.bgColor, color: tier.color, fontWeight: 600 }}
        />

        {load.chainScore !== null && (
          <Chip
            label={`Chain ${load.chainScore}`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        )}
      </Box>
    </Box>
  );
};
