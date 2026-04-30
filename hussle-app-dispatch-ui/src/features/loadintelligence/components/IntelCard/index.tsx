import { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { BodyStrong, Meta, MetaStrong, SectionTitle, Timestamp } from 'components/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { MainCard } from '@mocho/ui/components';
import { useDispatch } from 'store';
import {
  bookLoadRequest,
  bookChainRequest,
  dismissLoadRequest,
  fetchChainsRequest,
} from '../../store/reducers';
import { currencyFormatter, milesFormatter } from '../../formatters';
import type { LoadIntelFeedItem, MarketStrength, TruckScore } from '../../types';

// ---------------------------------------------------------------------------
// Market badge colors
// ---------------------------------------------------------------------------

const MARKET_COLORS: Record<MarketStrength, { color: string; bg: string }> = {
  Hot: { color: '#2e7d32', bg: '#e8f5e9' },
  Balanced: { color: '#1565c0', bg: '#e3f2fd' },
  Soft: { color: '#ef6c00', bg: '#fff3e0' },
  Dead: { color: '#c62828', bg: '#ffebee' },
};

const SOURCE_COLORS: Record<string, { color: string; bg: string }> = {
  DAT: { color: '#1565c0', bg: '#e3f2fd' },
  Manual: { color: '#616161', bg: '#f5f5f5' },
  Bulk: { color: '#ef6c00', bg: '#fff3e0' },
};

// ---------------------------------------------------------------------------
// Score Indicator
// ---------------------------------------------------------------------------

interface ScoreIndicatorProps {
  score: number;
  size?: number;
}

const getScoreColor = (score: number): string => {
  if (score >= 70) {
    return '#2e7d32';
  }
  if (score >= 40) {
    return '#ef6c00';
  }
  return '#c62828';
};

const ScoreIndicator: React.FC<ScoreIndicatorProps> = ({ score, size = 56 }) => {
  const color = getScoreColor(score);
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <SectionTitle sx={{ fontWeight: 700, color, fontSize: size * 0.35 }}>
        {score}
      </SectionTitle>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Min Book Rate Indicator
// ---------------------------------------------------------------------------

interface MinBookIndicatorProps {
  rate: number | null;
  minBookRate: number | null;
}

const MinBookIndicator: React.FC<MinBookIndicatorProps> = ({ rate, minBookRate }) => {
  if (minBookRate === null) {
    return null;
  }

  if (rate === null) {
    return (
      <Chip
        label="No price"
        size="small"
        sx={{ bgcolor: 'grey.200', color: 'text.secondary', fontSize: '0.7rem' }}
      />
    );
  }

  const isAbove = rate >= minBookRate;

  return (
    <Chip
      label={isAbove ? 'Above min' : 'Below min'}
      size="small"
      sx={{
        bgcolor: isAbove ? '#e8f5e9' : '#ffebee',
        color: isAbove ? '#2e7d32' : '#c62828',
        fontSize: '0.7rem',
        fontWeight: 600,
      }}
    />
  );
};

// ---------------------------------------------------------------------------
// Single Score Panel
// ---------------------------------------------------------------------------

interface SingleScorePanelProps {
  item: LoadIntelFeedItem;
}

const SingleScorePanel: React.FC<SingleScorePanelProps> = ({ item }) => {
  const { score, scoreBreakdown, bestTruck, minBookRate } = item;
  const breakdown = scoreBreakdown ?? { cpm: 0, market: 0, driverFit: 0 };

  return (
    <Box sx={{ flex: 1, p: 1.5 }}>
      <MetaStrong sx={{ color: 'text.secondary', mb: 1 }}>
        Single Load Score
      </MetaStrong>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <ScoreIndicator score={score} />
        <Box sx={{ flex: 1 }}>
          <Stack spacing={0.5}>
            <ScoreBar label="CPM" value={breakdown.cpm} max={40} />
            <ScoreBar label="Market" value={breakdown.market} max={30} />
            <ScoreBar label="Fit" value={breakdown.driverFit} max={30} />
          </Stack>
        </Box>
      </Stack>
      {bestTruck && (
        <Meta sx={{ mt: 1, display: 'block' }}>
          Best: {bestTruck.unitNumber}
          {minBookRate !== null ? ` | Min: ${currencyFormatter.format(minBookRate)}` : ''}
        </Meta>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Score Bar
// ---------------------------------------------------------------------------

interface ScoreBarProps {
  label: string;
  value: number;
  max: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ label, value, max }) => {
  const pct = Math.min((value / max) * 100, 100);
  const color = getScoreColor((value / max) * 100);

  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Meta sx={{ width: 40, fontSize: '0.65rem' }}>
        {label}
      </Meta>
      <Box sx={{ flex: 1, height: 6, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
        <Box
          sx={{
            width: `${pct}%`,
            height: '100%',
            bgcolor: color,
            borderRadius: 1,
          }}
        />
      </Box>
      <Meta sx={{ width: 24, fontSize: '0.65rem', textAlign: 'right', color: 'text.primary' }}>
        {value}
      </Meta>
    </Stack>
  );
};

// ---------------------------------------------------------------------------
// Chain Score Panel
// ---------------------------------------------------------------------------

interface ChainScorePanelProps {
  item: LoadIntelFeedItem;
}

const ChainScorePanel: React.FC<ChainScorePanelProps> = ({ item }) => {
  const chain = item.chain ?? null;
  const chainScore = item.chainScore ?? null;
  const chainCount = item.chainCount ?? 0;

  if (chainCount === 0 && !chain) {
    return (
      <Box
        sx={{
          flex: 1,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Meta sx={{ color: 'text.disabled' }}>
          No backhaul data
        </Meta>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 1.5 }}>
      <MetaStrong sx={{ color: 'text.secondary' }}>
        Chain Score
      </MetaStrong>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        {chainScore !== null && <ScoreIndicator score={chainScore} size={48} />}
        <Box>
          {chain && (
            <>
              <Chip
                label={chain.chainType}
                size="small"
                sx={{ fontSize: '0.65rem', height: 18, mb: 0.5 }}
              />
              <Meta sx={{ display: 'block' }}>
                {chain.legs.length} legs
              </Meta>
            </>
          )}
          {!chain && chainCount > 0 && (
            <Meta>
              {chainCount} chains available
            </Meta>
          )}
        </Box>
      </Stack>

      {chain && (
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {chain.roundTripProfitability !== null && (
            <Box>
              <Timestamp sx={{ fontSize: '0.6rem' }}>
                RT Profit
              </Timestamp>
              <MetaStrong sx={{ display: 'block' }}>
                {currencyFormatter.format(chain.roundTripProfitability)}
              </MetaStrong>
            </Box>
          )}
          {chain.dailyRevenue !== null && (
            <Box>
              <Timestamp sx={{ fontSize: '0.6rem' }}>
                Daily Rev
              </Timestamp>
              <MetaStrong sx={{ display: 'block' }}>
                {currencyFormatter.format(chain.dailyRevenue)}
              </MetaStrong>
            </Box>
          )}
          {chain.weeklyGross !== null && (
            <Box>
              <Timestamp sx={{ fontSize: '0.6rem' }}>
                Weekly
              </Timestamp>
              <MetaStrong sx={{ display: 'block' }}>
                {currencyFormatter.format(chain.weeklyGross)}
              </MetaStrong>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Truck Breakdown Table
// ---------------------------------------------------------------------------

interface TruckBreakdownTableProps {
  trucks: TruckScore[];
}

const TruckBreakdownTable: React.FC<TruckBreakdownTableProps> = ({ trucks }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Truck</TableCell>
          <TableCell sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Driver</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            Score
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            CPM
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            Market
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            Fit
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
            Min Book
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {trucks.map((truck) => (
          <TableRow key={truck.vehicleId}>
            <TableCell sx={{ fontSize: '0.75rem' }}>{truck.unitNumber}</TableCell>
            <TableCell sx={{ fontSize: '0.75rem' }}>{truck.driverName ?? '\u2014'}</TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {truck.composite}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
              {truck.cpm}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
              {truck.market}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
              {truck.fit}
            </TableCell>
            <TableCell align="right" sx={{ fontSize: '0.75rem' }}>
              {truck.minBookRate !== null ? currencyFormatter.format(truck.minBookRate) : '\u2014'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ---------------------------------------------------------------------------
// IntelCard (Main Component)
// ---------------------------------------------------------------------------

interface IntelCardProps {
  item: LoadIntelFeedItem;
}

export const IntelCard: React.FC<IntelCardProps> = ({ item }) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);

  const marketStrength = item.marketStrength ?? 'Balanced';
  const sourceType = item.source?.type ?? 'Manual';
  const marketColor = MARKET_COLORS[marketStrength] ?? MARKET_COLORS.Balanced;
  const sourceColor = SOURCE_COLORS[sourceType] ?? SOURCE_COLORS.Manual;

  const handleToggleExpand = useCallback(() => {
    if (!expanded && item.truckBreakdown.length === 0) {
      dispatch(fetchChainsRequest({ id: item.id }));
    }
    setExpanded((prev) => !prev);
  }, [dispatch, expanded, item.id, item.truckBreakdown.length]);

  const handleBookLoad = useCallback(() => {
    dispatch(bookLoadRequest({ id: item.id }));
  }, [dispatch, item.id]);

  const handleBookChain = useCallback(() => {
    dispatch(bookChainRequest({ id: item.id }));
  }, [dispatch, item.id]);

  const handleDismiss = useCallback(() => {
    dispatch(dismissLoadRequest({ id: item.id }));
  }, [dispatch, item.id]);

  const equipmentLabels: Record<string, string> = {
    DV: 'Dry Van',
    RF: 'Reefer',
    FB: 'Flatbed',
    SD: 'Step Deck',
  };

  return (
    <MainCard sx={{ overflow: 'visible' }}>
      {/* Top Row: Route + Meta */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ md: 'center' }}
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        {/* Route */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <BodyStrong sx={{ fontWeight: 700 }}>
            {item.origin.city}, {item.origin.state}
          </BodyStrong>
          <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <BodyStrong sx={{ fontWeight: 700 }}>
            {item.destination.city}, {item.destination.state}
          </BodyStrong>
        </Stack>

        {/* Badges & Rate */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={marketStrength}
            size="small"
            sx={{
              color: marketColor.color,
              bgcolor: marketColor.bg,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
          <Chip
            label={sourceType}
            size="small"
            sx={{
              color: sourceColor.color,
              bgcolor: sourceColor.bg,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
          <Chip
            label={equipmentLabels[item.equipmentType] ?? item.equipmentType}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
          <Meta>
            {item.pickupDate}
          </Meta>
        </Stack>
      </Stack>

      {/* Rate + Miles Row */}
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 1.5 }}>
        <SectionTitle sx={{ fontWeight: 700 }}>
          {item.rate !== null ? currencyFormatter.format(item.rate) : 'No rate'}
        </SectionTitle>
        <Meta>
          {milesFormatter.format(item.miles)} mi
        </Meta>
        <MinBookIndicator rate={item.rate} minBookRate={item.minBookRate} />
      </Stack>

      <Divider sx={{ mb: 1.5 }} />

      {/* Score Panels Side by Side */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={0}>
        <SingleScorePanel item={item} />
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
        <Divider sx={{ display: { md: 'none' } }} />
        <ChainScorePanel item={item} />
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      {/* Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small" onClick={handleBookLoad}>
            Book This Load
          </Button>
          {((item.chainCount ?? 0) > 0 || item.chain !== null) && (
            <Button variant="outlined" size="small" onClick={handleBookChain}>
              Book Chain
            </Button>
          )}
          <Button variant="text" size="small" color="inherit" onClick={handleDismiss}>
            Dismiss
          </Button>
        </Stack>

        {item.truckBreakdown.length > 0 && (
          <IconButton
            size="small"
            onClick={handleToggleExpand}
            aria-label={expanded ? 'Collapse truck breakdown' : 'Expand truck breakdown'}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Stack>

      {/* Expandable Truck Breakdown */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 1.5 }}>
          <TruckBreakdownTable trucks={item.truckBreakdown} />
        </Box>
      </Collapse>
    </MainCard>
  );
};
