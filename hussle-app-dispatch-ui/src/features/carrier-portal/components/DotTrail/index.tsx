import { Box, Tooltip } from '@mui/material';

export type DotTrailState = 'done' | 'current' | 'pending';

export interface DotTrailItem {
  id: string;
  state: DotTrailState;
  tooltip?: string;
}

interface DotTrailProps {
  items: DotTrailItem[];
  label?: string;
}

const DOT_TOKENS: Record<DotTrailState, { bg: string; ring: string | null }> = {
  done: { bg: 'rgba(22, 163, 74, 1)', ring: null },
  current: { bg: 'rgba(37, 99, 235, 1)', ring: 'rgba(37, 99, 235, 0.15)' },
  pending: { bg: 'rgba(226, 232, 240, 1)', ring: null },
};

const DotTrail: React.FC<DotTrailProps> = ({ items, label = 'Document queue' }) => {
  return (
    <Box
      role="group"
      aria-label={label}
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.625, flexShrink: 0 }}
    >
      {items.map((item) => {
        const tokens = DOT_TOKENS[item.state];
        const dot = (
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: tokens.bg,
              boxShadow: tokens.ring ? `0 0 0 3px ${tokens.ring}` : 'none',
              transition: 'all 0.15s ease',
              cursor: item.tooltip ? 'help' : 'default',
            }}
          />
        );
        return item.tooltip ? (
          <Tooltip key={item.id} title={item.tooltip} placement="top" arrow>
            {dot}
          </Tooltip>
        ) : (
          <Box key={item.id} sx={{ display: 'inline-flex' }}>
            {dot}
          </Box>
        );
      })}
    </Box>
  );
};

export default DotTrail;
