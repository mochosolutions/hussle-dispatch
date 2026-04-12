import {
  Box,
  Button,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { formatDistanceToNow } from 'date-fns';
import { LOAD_STATUSES, STATUS_LABELS } from '../../../constants';
import type { BoardView } from '../../../types';
import type { selectLoadFilters } from '../../../store/selectors/loadSelectors';

export interface DispatchBoardToolbarProps {
  boardView: BoardView;
  filters: ReturnType<typeof selectLoadFilters>;
  handleSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentStatusFilter: string;
  handleStatusFilterChange: (event: SelectChangeEvent) => void;
  handleCarrierFilterChange: (event: SelectChangeEvent) => void;
  uniqueCarriers: string[];
  handleRefresh: () => void;
  lastRefreshed?: string | null;
  currentCarrierFilter: string;
}

export const DispatchBoardToolbar = ({
  boardView,
  filters,
  handleSearchChange,
  currentStatusFilter,
  handleStatusFilterChange,
  handleCarrierFilterChange,
  uniqueCarriers,
  handleRefresh,
  lastRefreshed,
  currentCarrierFilter,
}: DispatchBoardToolbarProps) => {
  if (boardView !== 'intel') {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
          px: { xs: 2, sm: 3 },
          py: 1.5,
        }}
      >
        <Stack spacing={1}>
          <InputLabel>Search</InputLabel>
          <OutlinedInput
            size="small"
            placeholder="Search loads, drivers, carriers..."
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            sx={{ minWidth: 260 }}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
              </InputAdornment>
            }
          />
        </Stack>
        <Stack spacing={1}>
          <InputLabel>Status</InputLabel>
          <Select
            size="small"
            value={currentStatusFilter}
            onChange={handleStatusFilterChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            {LOAD_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Stack spacing={1}>
          <InputLabel>Carrier</InputLabel>
          <Select
            size="small"
            value={currentCarrierFilter}
            onChange={handleCarrierFilterChange}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="all">All Carriers</MenuItem>
            {uniqueCarriers.map((carrier) => (
              <MenuItem key={carrier} value={carrier}>
                {carrier}
              </MenuItem>
            ))}
          </Select>
        </Stack>
        <Stack
          spacing={1}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginLeft: 'auto',
          }}
        >
          <Tooltip
            title={`Updated ${formatDistanceToNow(new Date(lastRefreshed), { addSuffix: true })}`}
          >
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </Tooltip>

          {lastRefreshed && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{
                ml: 2,
              }}
            ></Typography>
          )}
        </Stack>
      </Box>
    );
  }
  return null;
};
