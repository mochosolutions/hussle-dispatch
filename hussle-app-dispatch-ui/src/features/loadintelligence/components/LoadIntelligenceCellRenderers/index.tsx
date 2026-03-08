import { Box, Chip, Tooltip, Typography } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

import type { ICellRendererParams } from 'ag-grid-community';

import type { MockLoad } from '../../types';
import type { ScoreTierResult } from '../../getScoreTier';
import { getScoreTier } from '../../getScoreTier';
import { currencyFormatter, ratePerMileFormatter, milesFormatter } from '../../formatters';

type LoadCellRendererParams = ICellRendererParams<MockLoad>;

// --- Private helpers ---

const MarketDot: React.FC<{ score: number }> = ({ score }) => {
  const tier = getScoreTier(score);

  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: tier.color,
        display: 'inline-block',
        mr: 0.5,
      }}
    />
  );
};

const MarketTooltipContent: React.FC<{ city: string; score: number; tier: ScoreTierResult }> = ({
  city,
  score,
  tier,
}) => (
  <Box>
    <Typography variant="caption" sx={{ fontWeight: 600 }}>
      {city}
    </Typography>
    <Typography variant="caption" display="block">
      {`Score: ${score} · ${tier.label}`}
    </Typography>
  </Box>
);

// --- Exported renderers ---

// SRC column
export const SourceBadgeCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  const isManual = data.source.type === 'Manual';
  const relativeTime = formatDistanceToNow(new Date(data.source.dateAdded), { addSuffix: true });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
      <Chip
        label={data.source.type}
        size="small"
        variant={isManual ? 'outlined' : 'filled'}
        color={isManual ? 'primary' : 'default'}
        sx={{ width: 'fit-content' }}
      />
      <Typography variant="caption" color="text.secondary">
        {relativeTime}
      </Typography>
    </Box>
  );
};

// ORIGIN column
export const OriginCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  const tier = getScoreTier(data.market.score);
  const pickupDateFormatted = format(parseISO(data.pickupDate), 'MMM d');
  const stopsText = data.pickupStops > 0 ? ` · +${data.pickupStops} stops` : '';

  return (
    <Tooltip
      title={<MarketTooltipContent city={data.market.city} score={data.market.score} tier={tier} />}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MarketDot score={data.market.score} />
          <Typography variant="body2">{`${data.origin.city}, ${data.origin.state}`}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {`${pickupDateFormatted}${stopsText}`}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// DESTINATION column
export const DestinationCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  const tier = getScoreTier(data.destinationMarket.score);
  const stopsText = data.dropStops > 0 ? `+${data.dropStops} stops` : '';

  return (
    <Tooltip
      title={
        <MarketTooltipContent
          city={data.destinationMarket.city}
          score={data.destinationMarket.score}
          tier={tier}
        />
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MarketDot score={data.destinationMarket.score} />
          <Typography variant="body2">
            {`${data.destination.city}, ${data.destination.state}`}
          </Typography>
        </Box>
        {stopsText !== '' && (
          <Typography variant="caption" color="text.secondary">
            {stopsText}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
};

// EQUIPMENT column
export const EquipmentCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  return <Chip label={data.equipmentType} size="small" variant="outlined" />;
};

// MILES column
export const MilesRateCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  const perMile = data.rate !== null ? ratePerMileFormatter.format(data.rate / data.miles) : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {milesFormatter.format(data.miles)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {perMile !== null ? `${perMile}/mi` : '—'}
      </Typography>
    </Box>
  );
};

// RATE column
export const RateCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
      {data.rate !== null ? (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {currencyFormatter.format(data.rate)}
        </Typography>
      ) : (
        <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
          Call
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {data.minRate !== null ? `min ${currencyFormatter.format(data.minRate)}` : '—'}
      </Typography>
    </Box>
  );
};

// SCORE column
export const SingleScoreCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  const tier = getScoreTier(data.score);
  const iconChar = tier.icon === 'star' ? '★' : '✕';

  return (
    <Chip
      label={`${iconChar} ${data.score} ${tier.label}`}
      size="small"
      sx={{
        bgcolor: tier.bgColor,
        color: tier.color,
        fontWeight: 600,
      }}
    />
  );
};

// CUSTOMER column
export const CustomerCellRenderer: React.FC<LoadCellRendererParams> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
      <Typography variant="body2">{data.customer.name}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          {data.customer.phone}
        </Typography>
      </Box>
    </Box>
  );
};
