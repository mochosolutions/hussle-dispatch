import type { ReactNode } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

import { BodyStrong } from 'components/Typography';

interface ListBuilderInlineFormProps {
  number?: number;
  title: string;
  onCancel: () => void;
  onSave?: () => void;
  saveLabel?: string;
  onSaveAndAddAnother?: () => void;
  saveAndAddAnotherLabel?: string;
  saveDisabled?: boolean;
  children: ReactNode;
}

const ListBuilderInlineForm: React.FC<ListBuilderInlineFormProps> = ({
  number,
  title,
  onCancel,
  onSave,
  saveLabel = 'Save',
  onSaveAndAddAnother,
  saveAndAddAnotherLabel = 'Save & add another',
  saveDisabled,
  children,
}) => {
  return (
    <Box
      sx={{
        border: '2px solid',
        borderColor: 'primary.main',
        background: (theme) =>
          `linear-gradient(180deg, ${theme.palette.primary[100]} 0%, ${theme.palette.background.paper} 80%)`,
        borderRadius: 1,
        p: { xs: 2, md: 2.25 },
        boxShadow: (theme) => `0 0 0 4px ${theme.palette.primary[100]}`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {number !== undefined ? (
            <Box
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'common.white',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {number}
            </Box>
          ) : null}
          <BodyStrong
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: 'primary.dark',
              letterSpacing: '-0.005em',
            }}
          >
            {title}
          </BodyStrong>
        </Box>
        <IconButton
          onClick={onCancel}
          aria-label="Cancel"
          sx={{ p: 0.5, color: 'text.secondary' }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <Box>{children}</Box>

      <Box
        sx={{
          mt: 2,
          pt: 1.5,
          borderTop: '1px solid',
          borderColor: 'primary.lighter',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 14,
            borderColor: 'grey.200',
            color: 'text.primary',
            px: 2,
            py: 1.125,
            borderRadius: 0.75,
            '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.300' },
          }}
        >
          Cancel
        </Button>
        {onSaveAndAddAnother ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onSaveAndAddAnother}
            disabled={saveDisabled}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              px: 2,
              py: 1.125,
              borderRadius: 0.75,
            }}
          >
            {saveAndAddAnotherLabel}
          </Button>
        ) : null}
        {onSave ? (
          <Button
            variant="contained"
            color="primary"
            onClick={onSave}
            disabled={saveDisabled}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              px: 2,
              py: 1.125,
              borderRadius: 0.75,
            }}
          >
            {saveLabel}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
};

export default ListBuilderInlineForm;
