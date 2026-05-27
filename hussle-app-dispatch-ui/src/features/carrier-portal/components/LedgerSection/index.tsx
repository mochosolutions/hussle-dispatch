import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import { BodyStrong, Meta } from 'components/Typography';

export type LedgerSectionIconVariant = 'indigo' | 'amber' | 'emerald';

interface LedgerSectionProps {
  icon: ReactNode;
  iconVariant?: LedgerSectionIconVariant;
  title: string;
  subtitle?: string;
  totalLabel?: string;
  totalValue?: string;
  children: ReactNode;
}

const ICON_TOKENS: Record<LedgerSectionIconVariant, { bg: string; color: string }> = {
  indigo: { bg: 'rgba(238, 242, 255, 1)', color: 'rgba(55, 48, 163, 1)' },
  amber: { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(146, 64, 14, 1)' },
  emerald: { bg: 'rgba(236, 253, 245, 1)', color: 'rgba(4, 120, 87, 1)' },
};

const LedgerSection: React.FC<LedgerSectionProps> = ({
  icon,
  iconVariant = 'indigo',
  title,
  subtitle,
  totalLabel,
  totalValue,
  children,
}) => {
  const iconTokens = ICON_TOKENS[iconVariant];

  return (
    <Box
      sx={{
        mt: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          px: 2.25,
          py: 1.75,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              bgcolor: iconTokens.bg,
              color: iconTokens.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              '& svg': { fontSize: 16 },
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <BodyStrong sx={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </BodyStrong>
            {subtitle ? (
              <Meta sx={{ fontSize: 11.5, mt: 0.125, lineHeight: 1.35 }}>{subtitle}</Meta>
            ) : null}
          </Box>
        </Box>

        {totalValue ? (
          <Box
            sx={{
              textAlign: 'right',
              flexShrink: 0,
              lineHeight: 1.2,
            }}
          >
            {totalLabel ? (
              <Meta
                sx={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {totalLabel}
              </Meta>
            ) : null}
            <BodyStrong
              sx={{
                display: 'block',
                fontSize: 16,
                fontWeight: 700,
                mt: 0.25,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {totalValue}
            </BodyStrong>
          </Box>
        ) : null}
      </Box>

      <Box>{children}</Box>
    </Box>
  );
};

export default LedgerSection;
