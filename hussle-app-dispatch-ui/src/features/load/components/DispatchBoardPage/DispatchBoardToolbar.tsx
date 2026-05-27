import { useMemo } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { formatDistanceToNow } from 'date-fns';
import { FilterBar } from 'components/FilterBar';
import type { FilterConfig, SearchConfig } from 'components/FilterBar';
import { LOAD_STATUSES, STATUS_LABELS } from '../../constants';
import type { BoardView } from '../../types';

export interface DispatchBoardToolbarProps {
  boardView: BoardView;
  currentStatusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onCarrierFilterChange: (value: string) => void;
  uniqueCarriers: string[];
  onRefresh: () => void;
  onSearchChange: (value: string | number) => void;
  lastRefreshed?: string | null;
  currentCarrierFilter: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...LOAD_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] })),
];

export const DispatchBoardToolbar = ({
  boardView,
  currentStatusFilter,
  onStatusFilterChange,
  onCarrierFilterChange,
  uniqueCarriers,
  onRefresh,
  onSearchChange,
  lastRefreshed,
  currentCarrierFilter,
}: DispatchBoardToolbarProps) => {
  const carrierOptions = useMemo(
    () => [
      { value: 'all', label: 'All Carriers' },
      ...uniqueCarriers.map((carrier) => ({ value: carrier, label: carrier })),
    ],
    [uniqueCarriers],
  );

  const filters = useMemo<FilterConfig[]>(
    () => [
      {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: STATUS_OPTIONS,
        value: currentStatusFilter,
        onChange: (value) => onStatusFilterChange(value),
      },
      {
        type: 'select',
        name: 'carrier',
        label: 'Carrier',
        options: carrierOptions,
        value: currentCarrierFilter,
        onChange: (value) => onCarrierFilterChange(value),
      },
    ],
    [currentStatusFilter, onStatusFilterChange, carrierOptions, currentCarrierFilter, onCarrierFilterChange],
  );

  const searchConfig = useMemo<SearchConfig>(
    () => ({
      placeholder: 'Search loads, drivers, carriers...',
      value: '',
      onChange: onSearchChange,
      debounce: 300,
    }),
    [onSearchChange],
  );

  if (boardView === 'intel' || boardView === 'map') {
    return null;
  }

  const refreshTooltip = lastRefreshed
    ? `Updated ${formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}`
    : 'Refresh';

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <FilterBar
        filters={filters}
        search={searchConfig}
        sx={{ alignItems: 'center' }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Tooltip title={refreshTooltip}>
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={onRefresh}>
            Refresh
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};
