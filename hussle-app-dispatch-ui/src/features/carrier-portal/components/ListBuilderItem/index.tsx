import type { ReactNode } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { EditOutlined, DeleteOutline } from '@mui/icons-material';

import { BodyStrong, Meta } from 'components/Typography';

export type ListBuilderTagVariant = 'default' | 'warn' | 'owner';

export interface ListBuilderTag {
  label: string;
  variant?: ListBuilderTagVariant;
}

interface ListBuilderItemProps {
  thumbnail: ReactNode;
  name: string;
  tags?: ListBuilderTag[];
  meta?: string[];
  onEdit?: () => void;
  onRemove?: () => void;
}

const TAG_TOKENS: Record<
  ListBuilderTagVariant,
  { bg: string; color: string }
> = {
  default: { bg: 'rgba(238, 242, 255, 1)', color: 'rgba(55, 48, 163, 1)' },
  warn: { bg: 'rgba(254, 243, 199, 1)', color: 'rgba(120, 53, 15, 1)' },
  owner: { bg: 'rgba(220, 252, 231, 1)', color: 'rgba(20, 83, 45, 1)' },
};

const Tag: React.FC<ListBuilderTag> = ({ label, variant = 'default' }) => {
  const tokens = TAG_TOKENS[variant];
  return (
    <Box
      component="span"
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        px: 0.875,
        py: 0.25,
        borderRadius: 0.5,
        bgcolor: tokens.bg,
        color: tokens.color,
      }}
    >
      {label}
    </Box>
  );
};

const ListBuilderItem: React.FC<ListBuilderItemProps> = ({
  thumbnail,
  name,
  tags = [],
  meta = [],
  onEdit,
  onRemove,
}) => {
  return (
    <Box
      component="article"
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        px: 2,
        py: 1.75,
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: 1.75,
        alignItems: 'center',
      }}
    >
      <Box sx={{ width: 44, height: 44, flexShrink: 0 }}>{thumbnail}</Box>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <BodyStrong sx={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>
            {name}
          </BodyStrong>
          {tags.map((tag) => (
            <Tag key={tag.label} {...tag} />
          ))}
        </Box>
        {meta.length > 0 ? (
          <Meta
            sx={{
              fontSize: 12,
              mt: 0.375,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              alignItems: 'center',
            }}
          >
            {meta.map((piece, index) => (
              <Box key={`${piece}-${index}`} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                {index > 0 ? (
                  <Box component="span" sx={{ color: 'grey.300' }} aria-hidden>
                    ·
                  </Box>
                ) : null}
                <Box component="span">{piece}</Box>
              </Box>
            ))}
          </Meta>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', gap: 0.75, flexShrink: 0 }}>
        {onEdit ? (
          <Button
            onClick={onEdit}
            startIcon={<EditOutlined sx={{ fontSize: 14 }} />}
            sx={{
              border: '1px solid',
              borderColor: 'grey.200',
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'none',
              px: 1.375,
              py: 0.75,
              borderRadius: 0.75,
              '&:hover': { bgcolor: 'grey.100' },
            }}
          >
            Edit
          </Button>
        ) : null}
        {onRemove ? (
          <IconButton
            onClick={onRemove}
            aria-label="Remove"
            sx={{
              border: '1px solid',
              borderColor: 'rgba(254, 202, 202, 1)',
              color: 'error.main',
              borderRadius: 0.75,
              p: 0.875,
              '&:hover': { bgcolor: 'rgba(254, 242, 242, 1)' },
            }}
          >
            <DeleteOutline sx={{ fontSize: 16 }} />
          </IconButton>
        ) : null}
      </Box>
    </Box>
  );
};

export default ListBuilderItem;
