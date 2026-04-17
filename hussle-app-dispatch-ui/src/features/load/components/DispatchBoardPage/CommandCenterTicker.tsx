import { useState } from 'react';
import { Box, Chip, IconButton, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useNavigate } from 'react-router-dom';

import type { LoadListItem } from '../../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../../constants';

interface CommandCenterTickerProps {
  activeLoads: LoadListItem[];
}

const ACTIVE_STATUSES = new Set([
  'BOOKED',
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
]);

export const CommandCenterTicker: React.FC<CommandCenterTickerProps> = ({ activeLoads }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const active = activeLoads.filter((load) => ACTIVE_STATUSES.has(load.status));
  const issueCount = activeLoads.filter((load) => load.status === 'EXCEPTION').length;

  if (active.length === 0 && issueCount === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 0.5 }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
          Active ({active.length})
        </Typography>
        {issueCount > 0 && (
          <Chip
            label={`${issueCount} Issue${issueCount > 1 ? 's' : ''}`}
            size="small"
            color="error"
            sx={{ height: 20, fontSize: '0.6875rem' }}
          />
        )}
        <Box sx={{ flex: 1 }} />
        <IconButton
          size="small"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label={expanded ? 'Collapse ticker' : 'Expand ticker'}
        >
          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>

      {expanded && (
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            px: 2,
            pb: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 2 },
          }}
        >
          {active.map((load) => {
            const origin = load.originCity
              ? `${load.originCity}, ${load.originState}`
              : '';
            const dest = load.destinationCity
              ? `${load.destinationCity}, ${load.destinationState}`
              : '';
            const route = [origin, dest].filter(Boolean).join(' \u2192 ');

            return (
              <Chip
                key={load.id}
                label={
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="caption" fontWeight={700}>
                      {load.loadNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160 }}>
                      {route}
                    </Typography>
                    <Chip
                      label={STATUS_LABELS[load.status]}
                      size="small"
                      color={STATUS_COLORS[load.status]}
                      sx={{ height: 16, fontSize: '0.5625rem', ml: 0.5 }}
                    />
                  </Stack>
                }
                variant="outlined"
                onClick={() => navigate(`/loads/${load.id}`)}
                sx={{
                  height: 'auto',
                  py: 0.25,
                  '& .MuiChip-label': { px: 1 },
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};
