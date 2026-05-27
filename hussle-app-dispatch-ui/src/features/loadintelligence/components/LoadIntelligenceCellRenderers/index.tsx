import { Box, Chip, Tooltip } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

import type { ICellRendererParams } from 'ag-grid-community';

import { Meta, MetaStrong } from 'components/Typography';

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
    <MetaStrong sx={{ color: 'inherit' }}>
      {city}
    </MetaStrong>
    <Meta sx={{ display: 'block', color: 'inherit' }}>
      {`Score: ${score} · ${tier.label}`}
    </Meta>
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
      <Meta>
        {relativeTime}
      </Meta>
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
          <Meta sx={{ color: 'text.primary' }}>{`${data.origin.city}, ${data.origin.state}`}</Meta>
        </Box>
        <Meta>
          {`${pickupDateFormatted}${stopsText}`}
        </Meta>
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
          <Meta sx={{ color: 'text.primary' }}>
            {`${data.destination.city}, ${data.destination.state}`}
          </Meta>
        </Box>
        {stopsText !== '' && (
          <Meta>
            {stopsText}
          </Meta>
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
      <MetaStrong sx={{ fontWeight: 700, color: 'text.primary' }}>
        {milesFormatter.format(data.miles)}
      </MetaStrong>
      <Meta>
        {perMile !== null ? `${perMile}/mi` : '—'}
      </Meta>
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
        <MetaStrong sx={{ fontWeight: 700, color: 'text.primary' }}>
          {currencyFormatter.format(data.rate)}
        </MetaStrong>
      ) : (
        <MetaStrong sx={{ fontWeight: 700, color: 'primary.main' }}>
          Call
        </MetaStrong>
      )}
      <Meta>
        {data.minRate !== null ? `min ${currencyFormatter.format(data.minRate)}` : '—'}
      </Meta>
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
      <Meta sx={{ color: 'text.primary' }}>{data.customer.name}</Meta>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Meta>
          {data.customer.phone}
        </Meta>
      </Box>
    </Box>
  );
};
