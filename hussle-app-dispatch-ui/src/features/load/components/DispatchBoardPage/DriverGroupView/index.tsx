import React, { useCallback, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';
import type { LoadListItem, LoadStatus } from '../../types';
import { StatusBadge } from 'components/Statusbadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DriverGroupViewProps {
  loads: LoadListItem[];
}

interface DriverGroup {
  driverId: string;
  driverName: string;
  loads: LoadListItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ACTIVE_STATUSES: ReadonlySet<LoadStatus> = new Set([
  'BOOKED',
  'DISPATCHED',
  'EN_ROUTE_PICKUP',
  'AT_PICKUP',
  'IN_TRANSIT',
  'AT_DELIVERY',
]);

const isActiveStatus = (status: LoadStatus): boolean => ACTIVE_STATUSES.has(status);

const formatCurrency = (value: number): string =>
  `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatLocation = (city: string | null, state: string | null): string =>
  [city, state].filter(Boolean).join(', ') || '\u2014';

const computeMetrics = (loads: LoadListItem[]) => {
  const activeLoads = loads.filter((load) => isActiveStatus(load.status));

  const totalRevenue = activeLoads.reduce((sum, load) => {
    const rate = load.customerRate ? Number(load.customerRate) : 0;
    return sum + rate;
  }, 0);

  const totalMiles = activeLoads.reduce((sum, load) => sum + (load.totalMiles ?? 0), 0);

  const rpm = totalMiles > 0 ? totalRevenue / totalMiles : 0;

  return { activeLoadCount: activeLoads.length, totalRevenue, totalMiles, rpm };
};

const groupLoadsByDriver = (
  loads: LoadListItem[],
): { assigned: DriverGroup[]; available: DriverGroup[] } => {
  const groupMap = loads.reduce<Record<string, DriverGroup>>((acc, load) => {
    const driverId = load.driverId ?? 'unassigned';
    const existing = acc[driverId];

    if (existing) {
      existing.loads.push(load);
    } else {
      acc[driverId] = {
        driverId,
        driverName: load.driverName ?? 'Unassigned',
        loads: [load],
      };
    }

    return acc;
  }, {});

  const groups = Object.values(groupMap).filter((group) => group.driverId !== 'unassigned');

  const assigned = groups.filter((group) =>
    group.loads.some((load) => isActiveStatus(load.status)),
  );

  const available = groups.filter((group) =>
    group.loads.every((load) => !isActiveStatus(load.status)),
  );

  return { assigned, available };
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const MetricChip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ textAlign: 'center', px: 1.5 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>
      {value}
    </Typography>
  </Box>
);

const LoadRow: React.FC<{ load: LoadListItem }> = ({ load }) => {
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    navigate(`/loads/${load.id}`);
  }, [navigate, load.id]);

  return (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        py: 1,
        px: 1,
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover', borderRadius: 1 },
      }}
    >
    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main', minWidth: 90 }}>
      {load.loadNumber}
    </Typography>
    <StatusBadge status={load.status} />
    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
      {formatLocation(load.originCity, load.originState)}
    </Typography>
    <Typography variant="body2" color="text.disabled" sx={{ mx: 0.5 }}>
      &rarr;
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
      {formatLocation(load.destinationCity, load.destinationState)}
    </Typography>
  </Box>
  );
};

// ---------------------------------------------------------------------------
// Driver Accordion Row
// ---------------------------------------------------------------------------

const DriverAccordionRow: React.FC<{
  group: DriverGroup;
  expanded: boolean;
  onToggle: () => void;
}> = ({ group, expanded, onToggle }) => {
  const metrics = useMemo(() => computeMetrics(group.loads), [group.loads]);

  const sortedLoads = useMemo(
    () =>
      [...group.loads].sort((a, b) => {
        const dateA = a.createdAt ?? '';
        const dateB = b.createdAt ?? '';
        return dateA.localeCompare(dateB);
      }),
    [group.loads],
  );

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      sx={{
        '&:before': { display: 'none' },
        border: 1,
        borderColor: 'divider',
        borderRadius: '8px !important',
        mb: 1,
        overflow: 'hidden',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
            gap: 2,
            my: 1,
          },
        }}
      >
        <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
        <Box sx={{ minWidth: 160 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {group.driverName}
          </Typography>
        </Box>

        <Chip
          label={`${metrics.activeLoadCount} active`}
          size="small"
          color={metrics.activeLoadCount > 0 ? 'primary' : 'default'}
          sx={{ fontWeight: 600, fontSize: '0.6875rem', height: 22 }}
        />

        <Box sx={{ flex: 1 }} />

        <Stack
          direction="row"
          spacing={0}
          sx={{ alignItems: 'center' }}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <MetricChip label="Revenue" value={formatCurrency(metrics.totalRevenue)} />
          <MetricChip label="Miles" value={metrics.totalMiles.toLocaleString()} />
          <MetricChip label="RPM" value={`$${metrics.rpm.toFixed(2)}`} />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
        <Divider sx={{ mb: 1 }} />
        {sortedLoads.map((load) => (
          <LoadRow key={load.id} load={load} />
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

// ---------------------------------------------------------------------------
// Available Driver Row (no accordion, static display)
// ---------------------------------------------------------------------------

const AvailableDriverRow: React.FC<{ group: DriverGroup }> = ({ group }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      py: 1.5,
      px: 2,
      border: 1,
      borderColor: 'divider',
      borderRadius: 2,
      mb: 1,
    }}
  >
    <PersonIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {group.driverName}
      </Typography>
    </Box>

    <Chip
      label="Available"
      size="small"
      color="success"
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.6875rem', height: 22 }}
    />
  </Box>
);

// ---------------------------------------------------------------------------
// DriverGroupView (public export)
// ---------------------------------------------------------------------------

export const DriverGroupView: React.FC<DriverGroupViewProps> = ({ loads }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { assigned, available } = useMemo(() => groupLoadsByDriver(loads), [loads]);

  const handleToggle = (driverId: string) => () => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) {
        next.delete(driverId);
      } else {
        next.add(driverId);
      }
      return next;
    });
  };

  return (
    <Box>
      {assigned.length === 0 && available.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No driver-assigned loads to display.
        </Typography>
      )}

      {assigned.map((group) => (
        <DriverAccordionRow
          key={group.driverId}
          group={group}
          expanded={expandedIds.has(group.driverId)}
          onToggle={handleToggle(group.driverId)}
        />
      ))}

      {available.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, px: 1 }}>
            Available Drivers ({available.length})
          </Typography>
          {available.map((group) => (
            <AvailableDriverRow key={group.driverId} group={group} />
          ))}
        </Box>
      )}
    </Box>
  );
};
