import type { ReactNode } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { CheckOutlined, WarningAmberOutlined } from '@mui/icons-material';

import { Body, BodyMuted, BodyStrong } from 'components/Typography';

export type UploadZoneState = 'empty' | 'uploading' | 'uploaded' | 'error';

export type UploadZoneTagVariant = 'required' | 'optional' | 'working' | 'ok' | 'err';

export interface UploadZoneTag {
  label: string;
  variant: UploadZoneTagVariant;
}

interface UploadZoneProps {
  state: UploadZoneState;
  zoneNumber?: number;
  name: string;
  tag?: UploadZoneTag;
  description?: ReactNode;
  metaLeft?: ReactNode;
  metaRight?: ReactNode;
  children: ReactNode;
}

const ZONE_TOKENS: Record<UploadZoneState, { border: string; borderStyle: 'dashed' | 'solid'; bg: string }> = {
  empty: { border: 'grey.200', borderStyle: 'dashed', bg: 'background.paper' },
  uploading: { border: 'rgba(191, 219, 254, 1)', borderStyle: 'solid', bg: 'background.paper' },
  uploaded: { border: 'rgba(187, 247, 208, 1)', borderStyle: 'solid', bg: 'background.paper' },
  error: { border: 'rgba(254, 202, 202, 1)', borderStyle: 'solid', bg: 'background.paper' },
};

const TAG_TOKENS: Record<UploadZoneTagVariant, { bg: string; color: string }> = {
  required: { bg: 'rgba(254, 226, 226, 1)', color: 'rgba(127, 29, 29, 1)' },
  optional: { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)' },
  working: { bg: 'rgba(219, 234, 254, 1)', color: 'rgba(30, 58, 138, 1)' },
  ok: { bg: 'rgba(220, 252, 231, 1)', color: 'rgba(20, 83, 45, 1)' },
  err: { bg: 'rgba(254, 226, 226, 1)', color: 'rgba(127, 29, 29, 1)' },
};

const TagPill: React.FC<{ tag: UploadZoneTag }> = ({ tag }) => {
  const tokens = TAG_TOKENS[tag.variant];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        px: 0.875,
        py: 0.25,
        borderRadius: 0.5,
        bgcolor: tokens.bg,
        color: tokens.color,
        lineHeight: 1.2,
      }}
    >
      {tag.label}
    </Box>
  );
};

const ZoneStatusBadge: React.FC<{ state: UploadZoneState; zoneNumber?: number }> = ({
  state,
  zoneNumber,
}) => {
  let content: ReactNode = zoneNumber;
  let bg = 'background.paper';
  let color = 'text.secondary';
  let borderColor = 'grey.200';

  if (state === 'uploaded') {
    content = <CheckOutlined />;
    bg = 'success.main';
    color = 'common.white';
    borderColor = 'success.main';
  } else if (state === 'error') {
    content = <WarningAmberOutlined />;
    bg = 'error.main';
    color = 'common.white';
    borderColor = 'error.main';
  } else if (state === 'uploading') {
    content = <CircularProgress size={16} thickness={5} sx={{ color: 'common.white' }} />;
    bg = 'primary.main';
    color = 'common.white';
    borderColor = 'primary.main';
  }

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1.5px solid',
        borderColor,
        bgcolor: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 13,
        flexShrink: 0,
        '& svg': { fontSize: 16 },
      }}
    >
      {content}
    </Box>
  );
};

const UploadZone: React.FC<UploadZoneProps> = ({
  state,
  zoneNumber,
  name,
  tag,
  description,
  metaLeft,
  metaRight,
  children,
}) => {
  const tokens = ZONE_TOKENS[state];
  const isError = state === 'error';

  return (
    <Box
      component="article"
      sx={{
        border: '1.5px',
        borderStyle: tokens.borderStyle,
        borderColor: tokens.border,
        bgcolor: tokens.bg,
        borderRadius: 1,
        px: 2.75,
        py: 2.75,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr',
          gap: 1.75,
          alignItems: 'flex-start',
        }}
      >
        <ZoneStatusBadge state={state} zoneNumber={zoneNumber} />
        <Box sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              lineHeight: 1.3,
            }}
          >
            <BodyStrong sx={{ fontSize: 15, fontWeight: 700 }}>{name}</BodyStrong>
            {tag ? <TagPill tag={tag} /> : null}
          </Box>
          {description ? (
            <Body
              sx={{
                fontSize: 12.5,
                mt: 0.5,
                color: isError ? 'rgba(127, 29, 29, 1)' : 'text.secondary',
                lineHeight: 1.5,
              }}
            >
              {description}
            </Body>
          ) : null}
          {metaLeft || metaRight ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                mt: 0.5,
                flexWrap: 'wrap',
              }}
            >
              {metaLeft ? (
                <BodyMuted
                  sx={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  {metaLeft}
                </BodyMuted>
              ) : (
                <span />
              )}
              {metaRight ? (
                <Box
                  sx={{
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {metaRight}
                </Box>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Box>

      <Box sx={{ mt: 1.75 }}>{children}</Box>
    </Box>
  );
};

export default UploadZone;
