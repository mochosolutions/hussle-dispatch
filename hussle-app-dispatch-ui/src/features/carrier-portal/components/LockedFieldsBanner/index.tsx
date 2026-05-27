// ---------------------------------------------------------------------------
// LockedFieldsBanner — dormant capability.
//
// Rendered by CarrierPortalPage when `useStepMode() === 'locked'`. Today's
// schema declares no `locked` questions, so `computeStepMode` never returns
// 'locked' under current configuration — this banner never paints.
//
// Kept as the visual primitive for future schema variants that opt fields into
// the locked treatment (see `Question.locked` in engine/types.ts). When any
// visible question on the active step is locked, this banner surfaces above
// the form to communicate the read-only state to the carrier.
// ---------------------------------------------------------------------------

import { Box } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

import { Body, BodyStrong } from 'components/Typography';

export interface LockedFieldsBannerProps {
  /** Override the default copy. */
  message?: string;
  /** Override the default title. */
  title?: string;
}

/**
 * Prominent amber banner shown above a step's content when the carrier has
 * signed the dispatch agreement and the step's fields are now read-only.
 *
 * Centrally rendered by CarrierPortalPage when `useStepMode() === 'locked'`,
 * so individual step components don't need to import or position this.
 */
const LockedFieldsBanner: React.FC<LockedFieldsBannerProps> = ({
  title = 'These fields are locked',
  message = "You've signed the dispatch agreement, so your business identity is now read-only. Contact your dispatcher to make changes.",
}) => (
  <Box
    role="status"
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.75,
      px: 2.5,
      py: 2,
      mb: 2.5,
      bgcolor: 'rgba(254, 243, 199, 1)',
      borderLeft: '3px solid',
      borderLeftColor: 'rgba(217, 119, 6, 1)',
      borderRadius: '0 6px 6px 0',
    }}
  >
    <Box
      sx={{
        flexShrink: 0,
        width: 32,
        height: 32,
        borderRadius: '50%',
        bgcolor: 'rgba(217, 119, 6, 1)',
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& svg': { fontSize: 18 },
      }}
    >
      <LockOutlined />
    </Box>
    <Box sx={{ flex: 1, lineHeight: 1.45 }}>
      <BodyStrong
        sx={{
          display: 'block',
          fontSize: 14,
          fontWeight: 700,
          color: 'rgba(120, 53, 15, 1)',
          mb: 0.25,
        }}
      >
        {title}
      </BodyStrong>
      <Body sx={{ fontSize: 13, color: 'rgba(120, 53, 15, 1)' }}>{message}</Body>
    </Box>
  </Box>
);

export default LockedFieldsBanner;
