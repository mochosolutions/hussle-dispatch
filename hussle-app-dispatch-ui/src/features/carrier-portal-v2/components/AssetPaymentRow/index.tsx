import type { ChangeEvent, ReactNode } from 'react';
import { Box, ButtonBase, InputBase } from '@mui/material';

import { Body, Meta } from 'components/Typography';

export type AssetPaymentOwnership = 'owned' | 'financed';
export type AssetPaymentTagVariant = 'truck' | 'trailer';

interface AssetPaymentRowProps {
  name: string;
  thumbnail?: ReactNode;
  assetName: string;
  tagLabel: string;
  tagVariant?: AssetPaymentTagVariant;
  ownership: AssetPaymentOwnership;
  onOwnershipChange: (next: AssetPaymentOwnership) => void;
  amount: string;
  onAmountChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

const TAG_TOKENS: Record<AssetPaymentTagVariant, { bg: string; color: string }> = {
  truck: { bg: 'rgba(238, 242, 255, 1)', color: 'rgba(55, 48, 163, 1)' },
  trailer: { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)' },
};

const OwnershipToggle: React.FC<{
  value: AssetPaymentOwnership;
  onChange: (next: AssetPaymentOwnership) => void;
}> = ({ value, onChange }) => {
  const options: AssetPaymentOwnership[] = ['owned', 'financed'];
  return (
    <Box
      role="radiogroup"
      sx={{
        display: 'inline-flex',
        border: '1.5px solid',
        borderColor: 'grey.200',
        borderRadius: '999px',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      {options.map((option, idx) => {
        const isOn = value === option;
        return (
          <ButtonBase
            key={option}
            role="radio"
            aria-checked={isOn}
            onClick={() => onChange(option)}
            sx={{
              px: 1.25,
              py: 0.375,
              fontFamily: 'inherit',
              fontSize: 11.5,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: isOn ? 'common.white' : 'text.secondary',
              bgcolor: isOn ? 'primary.main' : 'transparent',
              textTransform: 'capitalize',
              borderLeft: idx > 0 ? '1.5px solid' : 'none',
              borderColor: 'grey.200',
              transition: 'all 0.15s ease',
            }}
          >
            {option}
          </ButtonBase>
        );
      })}
    </Box>
  );
};

const AssetPaymentRow: React.FC<AssetPaymentRowProps> = ({
  name,
  thumbnail,
  assetName,
  tagLabel,
  tagVariant = 'truck',
  ownership,
  onOwnershipChange,
  amount,
  onAmountChange,
}) => {
  const tagTokens = TAG_TOKENS[tagVariant];
  const isOwned = ownership === 'owned';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr auto 200px' },
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        mb: 0.75,
        bgcolor: 'grey.50',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 0.75,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {thumbnail ? <Box sx={{ flexShrink: 0, display: 'inline-flex' }}>{thumbnail}</Box> : null}
        <Body sx={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}>{assetName}</Body>
        <Meta
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            px: 0.75,
            py: 0.125,
            borderRadius: 0.5,
            bgcolor: tagTokens.bg,
            color: tagTokens.color,
          }}
        >
          {tagLabel}
        </Meta>
        {isOwned ? (
          <Box
            component="span"
            sx={{
              ml: 'auto',
              fontSize: 11,
              fontWeight: 600,
              color: 'success.dark',
              bgcolor: 'rgba(220, 252, 231, 1)',
              px: 0.875,
              py: 0.125,
              borderRadius: '999px',
              flexShrink: 0,
            }}
          >
            Owned outright · $0
          </Box>
        ) : null}
      </Box>

      <OwnershipToggle value={ownership} onChange={onOwnershipChange} />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          border: '1.5px solid',
          borderColor: 'grey.200',
          borderRadius: 0.75,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          opacity: isOwned ? 0.55 : 1,
          pointerEvents: isOwned ? 'none' : 'auto',
          transition: 'all 0.15s ease',
          '&:focus-within': isOwned
            ? undefined
            : {
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.10)',
              },
        }}
      >
        <Box
          sx={{
            px: 1.25,
            bgcolor: 'grey.50',
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            borderRight: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          $
        </Box>
        <InputBase
          id={name}
          name={name}
          value={isOwned ? '0' : amount}
          onChange={onAmountChange}
          readOnly={isOwned}
          sx={{
            flex: 1,
            px: 1.25,
            py: 0.875,
            fontFamily: 'inherit',
            fontSize: 14,
            fontWeight: 700,
            color: 'text.primary',
            '& input': {
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              p: 0,
            },
          }}
        />
        <Box
          sx={{
            px: 1.25,
            bgcolor: 'grey.50',
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: 12.5,
            display: 'flex',
            alignItems: 'center',
            borderLeft: '1px solid',
            borderColor: 'grey.200',
          }}
        >
          /mo
        </Box>
      </Box>
    </Box>
  );
};

export default AssetPaymentRow;

export type { AssetPaymentRowProps };
