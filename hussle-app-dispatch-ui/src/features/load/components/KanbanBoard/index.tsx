import React, { useState, useCallback } from 'react';
import { Box, Typography, Chip, Avatar, Card, CardContent, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { KANBAN_GROUPS, STATUS_LABELS, STATUS_COLORS } from '../../constants';
import type { LoadListItem, KanbanGroup } from '../../types';

// ---------------------------------------------------------------------------
// Kanban column colors
// ---------------------------------------------------------------------------

const KANBAN_COLUMN_COLORS: Record<KanbanGroup, string> = {
  NEW: '#eab308',
  BOOKED: '#f97316',
  ACTIVE: '#22c55e',
  DELIVERED: '#a855f7',
  COMPLETE: '#6b7280',
  ISSUES: '#ef4444',
};

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

const StatusBadge: React.FC<{ status: string; label: string }> = ({ status, label }) => {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? 'text.secondary';

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: '0.6875rem',
        height: 22,
        color,
        borderColor: color,
        bgcolor: 'transparent',
      }}
      variant="outlined"
    />
  );
};

// ---------------------------------------------------------------------------
// Kanban Card
// ---------------------------------------------------------------------------

interface KanbanCardProps {
  load: LoadListItem;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ load }) => {
  const navigate = useNavigate();
  const columnColor = KANBAN_COLUMN_COLORS[
    (load.status in STATUS_LABELS ? load.status : 'ISSUES') as KanbanGroup
  ] ?? KANBAN_COLUMN_COLORS.ISSUES;

  const handleClick = useCallback(() => {
    navigate(`/loads/${load.id}`);
  }, [navigate, load.id]);

  const route = [load.originCity, load.originState]
    .filter(Boolean)
    .join(', ');

  const destination = [load.destinationCity, load.destinationState]
    .filter(Boolean)
    .join(', ');

  const driverInitials = load.driverName
    ? load.driverName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  return (
    <Card
      sx={{
        mb: 1.5,
        cursor: 'pointer',
        borderLeft: `3px solid ${columnColor}`,
        transition: 'box-shadow 0.15s, transform 0.15s',
        '&:hover': { boxShadow: 2, transform: 'translateY(-1px)' },
      }}
      onClick={handleClick}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
            {load.loadNumber}
          </Typography>
          <StatusBadge
            status={load.status}
            label={STATUS_LABELS[load.status] ?? load.status}
          />
        </Box>

        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
          {route || 'TBD'} &rarr; {destination || 'TBD'}
        </Typography>

        {load.carrierName && (
          <Chip
            label={load.carrierName}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.6875rem', height: 20, mb: 1 }}
          />
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {load.driverName && (
              <>
                <Avatar sx={{ width: 22, height: 22, fontSize: '0.625rem', fontWeight: 700 }}>
                  {driverInitials}
                </Avatar>
                <Typography variant="caption" color="text.secondary">
                  {load.driverName.split(' ')[0]}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {load.carrierRate && (
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${Number(load.carrierRate).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Kanban Column
// ---------------------------------------------------------------------------

interface KanbanColumnProps {
  groupKey: KanbanGroup;
  label: string;
  loads: LoadListItem[];
  defaultCollapsed?: boolean;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  groupKey,
  label,
  loads,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const color = KANBAN_COLUMN_COLORS[groupKey];

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <Box
      sx={{
        minWidth: 280,
        maxWidth: 320,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1.5,
          px: 0.5,
          cursor: 'pointer',
        }}
        onClick={handleToggle}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: color,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: 'text.primary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontSize: '0.75rem',
          }}
        >
          {label}
        </Typography>
        <Chip
          label={loads.length}
          size="small"
          sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600, bgcolor: 'grey.100' }}
        />
      </Box>

      {!collapsed && (
        <Box sx={{ flex: 1, overflow: 'auto', pr: 0.5 }}>
          {loads.map((load) => (
            <KanbanCard key={load.id} load={load} />
          ))}
          {loads.length === 0 && (
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
              <Typography variant="caption" color="text.disabled">
                No loads
              </Typography>
            </Box>
          )}
        </Box>
      )}

      {collapsed && (
        <Box
          sx={{
            py: 2,
            textAlign: 'center',
            border: 1,
            borderStyle: 'dashed',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'grey.50',
            cursor: 'pointer',
          }}
          onClick={handleToggle}
        >
          <Typography variant="caption" color="text.disabled">
            {loads.length} loads (click to expand)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Mobile Card List
// ---------------------------------------------------------------------------

const MobileCardList: React.FC<{ loads: LoadListItem[] }> = ({ loads }) => (
  <Box sx={{ pb: 2 }}>
    {loads.map((load) => (
      <KanbanCard key={load.id} load={load} />
    ))}
    {loads.length === 0 && (
      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
        No loads match your filters
      </Typography>
    )}
  </Box>
);

// ---------------------------------------------------------------------------
// Kanban Board (public export)
// ---------------------------------------------------------------------------

interface KanbanBoardProps {
  loadsByGroup: Record<KanbanGroup, LoadListItem[]>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ loadsByGroup }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    const allLoads = KANBAN_GROUPS.flatMap((group) => loadsByGroup[group.key]);
    return <MobileCardList loads={allLoads} />;
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, overflow: 'auto', pb: 2, minHeight: 0, flex: 1 }}>
      {KANBAN_GROUPS.map((group) => (
        <KanbanColumn
          key={group.key}
          groupKey={group.key}
          label={group.label}
          loads={loadsByGroup[group.key]}
          defaultCollapsed={group.key === 'COMPLETE'}
        />
      ))}
    </Box>
  );
};
