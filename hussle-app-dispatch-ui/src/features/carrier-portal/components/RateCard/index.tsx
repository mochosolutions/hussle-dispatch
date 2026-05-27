import { Box } from '@mui/material';
import { TrendingUpOutlined } from '@mui/icons-material';

import { BodyMuted, BodyStrong, Meta } from 'components/Typography';

export interface RateBreakdownRow {
  label: string;
  value: string;
  isTotal?: boolean;
}

export interface RateCardSecondary {
  eyebrow: string;
  amount: string;
  unit: string;
}

interface RateCardProps {
  eyebrow: string;
  amount: string;
  unit: string;
  explain?: string;
  breakdown?: RateBreakdownRow[];
  emptyState?: boolean;
  secondary?: RateCardSecondary;
}

const RateCard: React.FC<RateCardProps> = ({
  eyebrow,
  amount,
  unit,
  explain,
  breakdown,
  emptyState = false,
  secondary,
}) => {
  return (
    <Box
      sx={{
        position: 'sticky',
        bottom: { xs: 80, md: 72 },
        mx: { xs: -2.5, md: -4 },
        mb: { xs: -2.5, md: -4 },
        mt: 3.5,
        borderTop: '1px solid',
        borderColor: 'grey.200',
        background: 'linear-gradient(180deg, #fff 0%, #f8fafc 100%)',
        px: { xs: 2, md: 3 },
        py: 2.25,
        borderRadius: '0 0 8px 8px',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        justifyContent: 'space-between',
        gap: 2,
        zIndex: 5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {secondary ? (
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'baseline',
              gap: 0.75,
              mb: 1.25,
              px: 1.25,
              py: 0.625,
              borderRadius: 0.75,
              bgcolor: 'rgba(239, 246, 255, 1)',
              border: '1px solid',
              borderColor: 'rgba(191, 219, 254, 1)',
            }}
          >
            <Meta
              sx={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(30, 64, 175, 1)',
              }}
            >
              {secondary.eyebrow}
            </Meta>
            <BodyStrong
              sx={{
                fontSize: 18,
                fontWeight: 800,
                lineHeight: 1,
                color: emptyState ? 'text.secondary' : 'rgba(30, 58, 138, 1)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {secondary.amount}
            </BodyStrong>
            <BodyMuted
              sx={{ fontSize: 12, fontWeight: 600, color: 'rgba(30, 64, 175, 0.7)' }}
            >
              {secondary.unit}
            </BodyMuted>
          </Box>
        ) : null}

        <Meta
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            mb: 0.5,
            '& svg': { fontSize: 13 },
          }}
        >
          <TrendingUpOutlined />
          {eyebrow}
        </Meta>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
          <BodyStrong
            sx={{
              fontSize: 36,
              fontWeight: 800,
              color: emptyState ? 'text.secondary' : 'rgba(30, 58, 138, 1)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {amount}
          </BodyStrong>
          <BodyMuted sx={{ fontSize: 16, fontWeight: 600 }}>{unit}</BodyMuted>
        </Box>
        {explain ? (
          <BodyMuted sx={{ fontSize: 12, mt: 0.5, lineHeight: 1.45 }}>{explain}</BodyMuted>
        ) : null}
      </Box>

      {breakdown && breakdown.length > 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            minWidth: { xs: '100%', sm: 220 },
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {breakdown.map((row, idx) => {
            const previousIsTotalDivider = row.isTotal && idx > 0;
            return (
              <Box
                key={`${row.label}-${idx}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 1.5,
                  fontSize: 12,
                  color: row.isTotal ? 'text.primary' : 'text.secondary',
                  fontWeight: row.isTotal ? 700 : 500,
                  mt: previousIsTotalDivider ? 0.5 : 0,
                  pt: previousIsTotalDivider ? 0.75 : 0,
                  borderTop: previousIsTotalDivider ? '1px solid' : 'none',
                  borderColor: 'grey.200',
                }}
              >
                <Box component="span">{row.label}</Box>
                <Box
                  component="strong"
                  sx={{
                    color: 'text.primary',
                    fontWeight: row.isTotal ? 700 : 600,
                  }}
                >
                  {row.value}
                </Box>
              </Box>
            );
          })}
        </Box>
      ) : null}
    </Box>
  );
};

export default RateCard;
