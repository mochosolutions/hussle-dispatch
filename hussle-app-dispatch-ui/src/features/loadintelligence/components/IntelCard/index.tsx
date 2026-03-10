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
  Typography,
} from '@mui/material';
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
      <Typography variant="h6" sx={{ fontWeight: 700, color, fontSize: size * 0.35 }}>
        {score}
      </Typography>
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

  return (
    <Box sx={{ flex: 1, p: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1 }}>
        Single Load Score
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
        <ScoreIndicator score={score} />
        <Box sx={{ flex: 1 }}>
          <Stack spacing={0.5}>
            <ScoreBar label="CPM" value={scoreBreakdown.cpm} max={40} />
            <ScoreBar label="Market" value={scoreBreakdown.market} max={30} />
            <ScoreBar label="Fit" value={scoreBreakdown.driverFit} max={30} />
          </Stack>
        </Box>
      </Stack>
      {bestTruck && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Best: {bestTruck.unitNumber}
          {minBookRate !== null ? ` | Min: ${currencyFormatter.format(minBookRate)}` : ''}
        </Typography>
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
      <Typography
        variant="caption"
        sx={{ width: 40, fontSize: '0.65rem', color: 'text.secondary' }}
      >
        {label}
      </Typography>
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
      <Typography variant="caption" sx={{ width: 24, fontSize: '0.65rem', textAlign: 'right' }}>
        {value}
      </Typography>
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
  const { chain, chainScore, chainCount } = item;

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
        <Typography variant="caption" color="text.disabled">
          No backhaul data
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, p: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
        Chain Score
      </Typography>
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
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {chain.legs.length} legs
              </Typography>
            </>
          )}
          {!chain && chainCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              {chainCount} chains available
            </Typography>
          )}
        </Box>
      </Stack>

      {chain && (
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          {chain.roundTripProfitability !== null && (
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                RT Profit
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {currencyFormatter.format(chain.roundTripProfitability)}
              </Typography>
            </Box>
          )}
          {chain.dailyRevenue !== null && (
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                Daily Rev
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {currencyFormatter.format(chain.dailyRevenue)}
              </Typography>
            </Box>
          )}
          {chain.weeklyGross !== null && (
            <Box>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled' }}>
                Weekly
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {currencyFormatter.format(chain.weeklyGross)}
              </Typography>
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

  const marketColor = MARKET_COLORS[item.marketStrength] ?? MARKET_COLORS.Balanced;
  const sourceColor = SOURCE_COLORS[item.source.type] ?? SOURCE_COLORS.Manual;

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
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {item.origin.city}, {item.origin.state}
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {item.destination.city}, {item.destination.state}
          </Typography>
        </Stack>

        {/* Badges & Rate */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={item.marketStrength}
            size="small"
            sx={{
              color: marketColor.color,
              bgcolor: marketColor.bg,
              fontWeight: 600,
              fontSize: '0.7rem',
            }}
          />
          <Chip
            label={item.source.type}
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
          <Typography variant="body2" color="text.secondary">
            {item.pickupDate}
          </Typography>
        </Stack>
      </Stack>

      {/* Rate + Miles Row */}
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {item.rate !== null ? currencyFormatter.format(item.rate) : 'No rate'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {milesFormatter.format(item.miles)} mi
        </Typography>
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
          {(item.chainCount > 0 || item.chain !== null) && (
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
