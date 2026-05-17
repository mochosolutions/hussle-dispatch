import type { ReactNode } from 'react';
import { Box } from '@mui/material';

import { BodyStrong, Meta } from 'components/Typography';

interface LedgerGroupProps {
  label: string;
  labelSuffix?: ReactNode;
  subTotal?: string;
  children: ReactNode;
}

const LedgerGroup: React.FC<LedgerGroupProps> = ({ label, labelSuffix, subTotal, children }) => {
  return (
    <Box
      sx={{
        px: 2.25,
        pt: 1.75,
        pb: 0.75,
        '&:not(:first-of-type)': {
          borderTop: '1px solid',
          borderColor: 'grey.200',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, minWidth: 0 }}>
          <Meta
            sx={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Meta>
          {labelSuffix ? <Box sx={{ display: 'inline-flex' }}>{labelSuffix}</Box> : null}
        </Box>

        {subTotal ? (
          <BodyStrong
            sx={{
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              flexShrink: 0,
            }}
          >
            {subTotal}
          </BodyStrong>
        ) : null}
      </Box>

      {children}
    </Box>
  );
};

export default LedgerGroup;
