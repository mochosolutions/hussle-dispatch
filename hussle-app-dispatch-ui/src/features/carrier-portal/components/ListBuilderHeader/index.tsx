import type { ReactNode } from 'react';
import { Box, Button } from '@mui/material';
import { KeyboardArrowDown } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';

interface ListBuilderHeaderProps {
  count: string;
  countMeta?: string;
  onSortClick?: () => void;
  sortLabel?: string;
  rightSlot?: ReactNode;
}

const ListBuilderHeader: React.FC<ListBuilderHeaderProps> = ({
  count,
  countMeta,
  onSortClick,
  sortLabel = 'Sort: newest',
  rightSlot,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        mb: -0.25,
      }}
    >
      <BodyStrong sx={{ fontSize: 13 }}>
        {count}
        {countMeta ? (
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, ml: 0.5 }}>
            · {countMeta}
          </Box>
        ) : null}
      </BodyStrong>

      {rightSlot ??
        (onSortClick ? (
          <Button
            onClick={onSortClick}
            endIcon={<KeyboardArrowDown sx={{ fontSize: 14 }} />}
            sx={{
              p: 0,
              minWidth: 'auto',
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
              '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
            }}
          >
            <Meta sx={{ fontSize: 12, fontWeight: 600 }}>{sortLabel}</Meta>
          </Button>
        ) : null)}
    </Box>
  );
};

export default ListBuilderHeader;
