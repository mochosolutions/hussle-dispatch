import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { CheckOutlined, RemoveOutlined } from '@mui/icons-material';

import { BodyMuted, BodyStrong } from 'components/Typography';

export type DocumentRowState = 'signed' | 'next' | 'pending' | 'skipped';

export type DocTagVariant = 'required' | 'optional' | 'signed' | 'skipped';

export interface DocTag {
  label: string;
  variant: DocTagVariant;
}

const TAG_TOKENS: Record<DocTagVariant, { bg: string; color: string }> = {
  required: { bg: 'rgba(254, 226, 226, 1)', color: 'rgba(127, 29, 29, 1)' },
  optional: { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)' },
  signed: { bg: 'rgba(220, 252, 231, 1)', color: 'rgba(20, 83, 45, 1)' },
  skipped: { bg: 'rgba(241, 245, 249, 1)', color: 'rgba(71, 85, 105, 1)' },
};

const DocTagPill: React.FC<{ tag: DocTag }> = ({ tag }) => {
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

interface StatusBadgeProps {
  state: DocumentRowState;
  number?: number;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ state, number }) => {
  const isSigned = state === 'signed';
  const isNext = state === 'next';
  const isSkipped = state === 'skipped';

  let content: React.ReactNode = number;
  if (isSigned) {
    content = <CheckOutlined />;
  } else if (isSkipped) {
    content = <RemoveOutlined />;
  }

  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1.5px solid',
        fontWeight: 700,
        fontSize: 13,
        ...(isSigned && {
          bgcolor: 'success.main',
          borderColor: 'success.main',
          color: 'common.white',
        }),
        ...(isNext && {
          bgcolor: 'primary.main',
          borderColor: 'primary.main',
          color: 'common.white',
        }),
        ...(!isSigned &&
          !isNext &&
          !isSkipped && {
            bgcolor: 'background.paper',
            borderColor: 'grey.200',
            color: 'text.secondary',
          }),
        ...(isSkipped && {
          bgcolor: 'grey.50',
          borderColor: 'grey.200',
          color: 'text.secondary',
        }),
        '& svg': { fontSize: 16 },
      }}
    >
      {content}
    </Box>
  );
};

export interface DocumentRowProps {
  state: DocumentRowState;
  number?: number;
  name: string;
  tag?: DocTag;
  description?: string;
  meta?: ReactNode[];
  actions: ReactNode;
}

const DocumentRow: React.FC<DocumentRowProps> = ({
  state,
  number,
  name,
  tag,
  description,
  meta,
  actions,
}) => {
  const isNext = state === 'next';
  const isSkipped = state === 'skipped';
  const dimmed = isSkipped;

  return (
    <Box
      component="article"
      sx={{
        border: '1.5px solid',
        borderColor: isNext ? 'primary.main' : 'grey.200',
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: isNext ? '0 0 0 3px rgba(37, 99, 235, 0.10)' : 'none',
        transition: 'all 0.15s ease',
        opacity: dimmed ? 0.7 : 1,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '32px 1fr', sm: '32px 1fr auto' },
          gap: 1.75,
          alignItems: 'center',
          px: 2,
          py: 1.75,
        }}
      >
        <StatusBadge state={state} number={number} />

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
            <BodyStrong
              sx={{
                fontSize: 14.5,
                fontWeight: 700,
                color: dimmed ? 'text.secondary' : 'text.primary',
              }}
            >
              {name}
            </BodyStrong>
            {tag ? <DocTagPill tag={tag} /> : null}
          </Box>
          {description ? (
            <BodyMuted sx={{ fontSize: 12.5, mt: 0.25, lineHeight: 1.4 }}>
              {description}
            </BodyMuted>
          ) : null}
          {meta && meta.length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                flexWrap: 'wrap',
                mt: 0.5,
                fontSize: 11.5,
                color: 'text.secondary',
                fontWeight: 500,
              }}
            >
              {meta.map((item, idx) => (
                <Box
                  key={idx}
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                >
                  {idx > 0 ? (
                    <Box component="span" sx={{ color: 'grey.300', fontSize: 11 }}>
                      ·
                    </Box>
                  ) : null}
                  {item}
                </Box>
              ))}
            </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexShrink: 0,
            alignItems: 'center',
            gridColumn: { xs: '1 / -1', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' },
          }}
        >
          {actions}
        </Box>
      </Box>
    </Box>
  );
};

export default DocumentRow;
