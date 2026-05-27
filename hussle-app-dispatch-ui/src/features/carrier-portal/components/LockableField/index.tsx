// ---------------------------------------------------------------------------
// LockableField — dormant capability.
//
// Today's shipping schema declares zero `locked` predicates on any question,
// so this wrapper is a no-op pass-through in practice. It remains in the
// codebase as the rendering primitive that lights up when a future schema
// variant opts a question into the locked treatment via `Question.locked`.
//
// To re-activate: set `locked: true` (or a predicate) on a question in the
// schema. `InputStep` resolves `isQuestionLocked` against the live session
// and threads the boolean here.
// ---------------------------------------------------------------------------

import { useState, type ReactNode } from 'react';
import { Box, Tooltip } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

interface LockableFieldProps {
  locked: boolean;
  value?: string;
  prefix?: string;
  mono?: boolean;
  tooltip?: string;
  children: ReactNode;
}

const DEFAULT_TOOLTIP = 'Locked after agreement signed. Contact your dispatcher to amend.';

const LockableField: React.FC<LockableFieldProps> = ({
  locked,
  value,
  prefix,
  mono,
  tooltip = DEFAULT_TOOLTIP,
  children,
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  if (!locked) {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'grey.100',
        border: '1.5px solid',
        borderColor: 'grey.200',
        borderRadius: 0.75,
        px: 1.75,
        py: 1.375,
        cursor: 'not-allowed',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          flex: 1,
          fontSize: 15,
          fontWeight: 600,
          color: 'text.primary',
          fontFamily: mono ? '"SFMono-Regular", Menlo, monospace' : 'inherit',
          letterSpacing: mono ? '0.04em' : 'normal',
        }}
      >
        {prefix ? (
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 700, mr: 0.75 }}>
            {prefix}
          </Box>
        ) : null}
        {value}
      </Box>

      <Tooltip
        title={tooltip}
        open={tooltipOpen}
        onOpen={() => setTooltipOpen(true)}
        onClose={() => setTooltipOpen(false)}
        placement="top-end"
        arrow
      >
        <Box
          tabIndex={0}
          aria-label={tooltip}
          onFocus={() => setTooltipOpen(true)}
          onBlur={() => setTooltipOpen(false)}
          onMouseEnter={() => setTooltipOpen(true)}
          onMouseLeave={() => setTooltipOpen(false)}
          sx={{
            width: 22,
            height: 22,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'help',
            flexShrink: 0,
            outline: 'none',
            '&:focus-visible': {
              outline: (theme) => `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2,
              borderRadius: '50%',
            },
          }}
        >
          <LockOutlined sx={{ fontSize: 15 }} />
        </Box>
      </Tooltip>
    </Box>
  );
};

export default LockableField;
