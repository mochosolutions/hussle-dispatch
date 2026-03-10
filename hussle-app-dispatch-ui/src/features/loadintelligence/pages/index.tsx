import { useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { SelectChangeEvent } from '@mui/material';
import { PageHeader, PageWrapper } from '@mocho/ui/components';
import { useSelector, useDispatch } from 'store';
import { useDrawerActions } from '../../ui/hooks/useDrawerActions';
import {
  fetchFeedRequest,
  setFilters,
  setSortBy,
} from '../store/reducers';
import {
  selectFeedItems,
  selectFeedFilters,
  selectFeedStats,
  selectFeedLoading,
  selectFeedHasMore,
  selectFeedSortBy,
} from '../store/selectors/intelSelectors';
import { IntelCard } from '../components/IntelCard';
import type {
  EquipmentType,
  FeedSortBy,
  MarketStrength,
  ScoreTier,
  SourceType,
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SCORE_OPTIONS: { label: string; value: ScoreTier }[] = [
  { label: 'All Scores', value: 'All' },
  { label: 'Elite (80+)', value: 'Elite' },
  { label: 'Strong (60-79)', value: 'Strong' },
  { label: 'Fair (40-59)', value: 'Fair' },
  { label: 'Weak (<40)', value: 'Weak' },
];

const EQUIPMENT_OPTIONS: { label: string; value: EquipmentType | '' }[] = [
  { label: 'All Equipment', value: '' },
  { label: 'Dry Van', value: 'DV' },
  { label: 'Reefer', value: 'RF' },
  { label: 'Flatbed', value: 'FB' },
  { label: 'Step Deck', value: 'SD' },
];

const MARKET_OPTIONS: { label: string; value: MarketStrength | 'All' }[] = [
  { label: 'All Markets', value: 'All' },
  { label: 'Hot', value: 'Hot' },
  { label: 'Balanced', value: 'Balanced' },
  { label: 'Soft', value: 'Soft' },
  { label: 'Dead', value: 'Dead' },
];

const RATE_OPTIONS: { label: string; value: 'yes' | 'no' | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Has Rate', value: 'yes' },
  { label: 'No Rate', value: 'no' },
];

const SOURCE_OPTIONS: { label: string; value: SourceType | 'All' }[] = [
  { label: 'All Sources', value: 'All' },
  { label: 'DAT', value: 'DAT' },
  { label: 'Manual', value: 'Manual' },
  { label: 'Bulk', value: 'Bulk' },
];

const SORT_OPTIONS: { label: string; value: FeedSortBy }[] = [
  { label: 'Score', value: 'score' },
  { label: 'Chain Score', value: 'chainScore' },
  { label: 'Rate', value: 'rate' },
  { label: 'Miles', value: 'miles' },
  { label: 'Pickup Date', value: 'pickupDate' },
];

const SOURCE_TYPES: SourceType[] = ['DAT', 'Bulk', 'Manual'];

const SOURCE_CHIP_COLORS: Record<SourceType, string> = {
  DAT: 'primary.main',
  Bulk: 'warning.main',
  Manual: 'text.secondary',
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const LoadIntelligencePage = () => {
  const dispatch = useDispatch();
  const { openDrawer } = useDrawerActions();

  const feedItems = useSelector(selectFeedItems);
  const filters = useSelector(selectFeedFilters);
  const stats = useSelector(selectFeedStats);
  const isLoading = useSelector(selectFeedLoading);
  const hasMore = useSelector(selectFeedHasMore);
  const sortBy = useSelector(selectFeedSortBy);

  useEffect(() => {
    dispatch(fetchFeedRequest({}));
  }, [dispatch]);

  const handleManualEntry = useCallback(() => {
    openDrawer('manualEntry', {});
  }, [openDrawer]);

  const handleLoadMore = useCallback(() => {
    const nextPage = (stats ? Math.ceil(feedItems.length / 25) : 0) + 1;
    dispatch(fetchFeedRequest({ page: nextPage }));
  }, [dispatch, feedItems.length, stats]);

  const handleScoreChange = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(setFilters({ scoreTier: event.target.value as ScoreTier }));
    },
    [dispatch],
  );

  const handleEquipmentChange = useCallback(
    (event: SelectChangeEvent) => {
      const value = event.target.value;
      dispatch(
        setFilters({
          equipmentTypes: value ? [value as EquipmentType] : [],
        }),
      );
    },
    [dispatch],
  );

  const handleMarketChange = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(setFilters({ marketStrength: event.target.value as MarketStrength | 'All' }));
    },
    [dispatch],
  );

  const handleRateChange = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(setFilters({ hasRate: event.target.value as 'yes' | 'no' | 'all' }));
    },
    [dispatch],
  );

  const handleSourceChange = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(setFilters({ source: event.target.value as SourceType | 'All' }));
    },
    [dispatch],
  );

  const handleSortChange = useCallback(
    (event: SelectChangeEvent) => {
      dispatch(setSortBy(event.target.value as FeedSortBy));
    },
    [dispatch],
  );

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(setFilters({ search: event.target.value }));
    },
    [dispatch],
  );

  const currentEquipment = useMemo(
    () => (filters.equipmentTypes.length === 1 ? filters.equipmentTypes[0] : ''),
    [filters.equipmentTypes],
  );

  return (
    <PageWrapper isLoading={isLoading && feedItems.length === 0} errorContext="LoadIntelligencePage">
      <PageHeader
        title="Load Intelligence"
        headerActions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleManualEntry}>
            Manual Entry
          </Button>
        }
      />

      {/* Stats Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          mb: 2,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {stats ? `${stats.totalLoads} loads from ${stats.sourceCount} sources` : 'Loading...'}
          </Typography>
          {stats &&
            SOURCE_TYPES.map((sourceType) => (
              <Chip
                key={sourceType}
                label={`${sourceType}: ${stats.sourceCounts[sourceType] ?? 0}`}
                size="small"
                sx={{
                  color: SOURCE_CHIP_COLORS[sourceType],
                  bgcolor: 'grey.100',
                  fontWeight: 500,
                }}
              />
            ))}
        </Stack>
      </Box>

      {/* Filter Bar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center',
          mb: 2,
        }}
      >
        <TextField
          value={filters.search}
          onChange={handleSearchChange}
          placeholder="Search loads..."
          size="small"
          sx={{ width: { xs: '100%', md: 220 } }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="score-filter-label">Score Tier</InputLabel>
          <Select
            labelId="score-filter-label"
            value={filters.scoreTier}
            label="Score Tier"
            onChange={handleScoreChange}
          >
            {SCORE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="equipment-filter-label">Equipment</InputLabel>
          <Select
            labelId="equipment-filter-label"
            value={currentEquipment}
            label="Equipment"
            onChange={handleEquipmentChange}
          >
            {EQUIPMENT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="market-filter-label">Market</InputLabel>
          <Select
            labelId="market-filter-label"
            value={filters.marketStrength}
            label="Market"
            onChange={handleMarketChange}
          >
            {MARKET_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel id="rate-filter-label">Rate</InputLabel>
          <Select
            labelId="rate-filter-label"
            value={filters.hasRate}
            label="Rate"
            onChange={handleRateChange}
          >
            {RATE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="source-filter-label">Source</InputLabel>
          <Select
            labelId="source-filter-label"
            value={filters.source}
            label="Source"
            onChange={handleSourceChange}
          >
            {SOURCE_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="sort-label">Sort By</InputLabel>
          <Select
            labelId="sort-label"
            value={sortBy}
            label="Sort By"
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Feed List */}
      <Stack spacing={2} sx={{ pb: 4 }}>
        {feedItems.map((item) => (
          <IntelCard key={item.id} item={item} />
        ))}

        {feedItems.length === 0 && !isLoading && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              No loads found
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              Try adjusting your filters or add a manual entry
            </Typography>
          </Box>
        )}

        {hasMore && feedItems.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleLoadMore}
            disabled={isLoading}
            sx={{ alignSelf: 'center', px: 6 }}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </Stack>
    </PageWrapper>
  );
};

export default LoadIntelligencePage;
