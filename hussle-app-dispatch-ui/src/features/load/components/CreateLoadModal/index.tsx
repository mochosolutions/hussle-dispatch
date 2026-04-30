import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
} from '@mui/material';

import { FieldLabel, Meta, MetaStrong } from 'components/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';
import type { LoadTemplate } from '../../types';
import { LOAD_TYPE_OPTIONS } from '../../constants';

interface CreateLoadModalProps {
  onSelect: (loadType: string, template?: LoadTemplate) => void;
  onClose: () => void;
  onCancel?: () => void;
}

const LAST_USED_KEY = 'fleet_lastUsedLoadType';

const DEMO_TEMPLATES: LoadTemplate[] = [
  {
    key: 'tpl-walmart-nj-target-nc',
    label: 'Walmart NJ \u2192 Target NC',
    description: 'Elizabeth, NJ to Charlotte, NC \u2014 Dry Van',
    placeIds: ['walmart-nj', 'target-nc'],
    rate: 2800,
    brokerRef: 'WM-2026-4491',
  },
  {
    key: 'tpl-amazon-ftw1',
    label: 'Amazon FTW1 Standard',
    description: 'Fort Worth, TX pickup',
    placeIds: ['amazon-ftw1'],
  },
];

const getLastUsedType = (): string | null => {
  try {
    return localStorage.getItem(LAST_USED_KEY);
  } catch {
    return null;
  }
};

const setLastUsedType = (type: string) => {
  try {
    localStorage.setItem(LAST_USED_KEY, type);
  } catch {
    // localStorage unavailable
  }
};

const SELECTABLE_CARD_SX = {
  cursor: 'pointer',
  transition: 'all 0.15s',
  '&:hover': { borderColor: 'primary.main' },
};

const selectedCardSx = (isSelected: boolean) => ({
  ...SELECTABLE_CARD_SX,
  borderColor: isSelected ? 'primary.main' : 'divider',
  borderWidth: isSelected ? 2 : 1,
  backgroundColor: isSelected ? 'primary.50' : 'background.paper',
});

export const CreateLoadModal: React.FC<CreateLoadModalProps> = ({
  onSelect,
  onClose,
  onCancel,
}) => {
  const lastUsed = getLastUsedType();
  const hasTemplates = DEMO_TEMPLATES.length > 0;
  const [selectedType, setSelectedType] = useState<string | null>(lastUsed ?? 'std');
  const [selectedTemplate, setSelectedTemplate] = useState<LoadTemplate | null>(null);

  const handleTemplateClick = (template: LoadTemplate) => {
    setSelectedTemplate(template);
    setSelectedType(null);
  };

  const handleTypeClick = (key: string) => {
    setSelectedType(key);
    setSelectedTemplate(null);
  };

  const handleContinue = () => {
    if (selectedTemplate) {
      setLastUsedType('std');
      onSelect('std', selectedTemplate);
      onClose();
      return;
    }
    if (!selectedType) {
      return;
    }
    setLastUsedType(selectedType);
    onSelect(selectedType);
    onClose();
  };

  return (
    <Dialog
      open
      maxWidth="sm"
      fullWidth
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        onClose();
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>New Load</DialogTitle>
      <DialogContent dividers>
        {/* Recent templates */}
        {hasTemplates && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.5 }}>
              <HistoryIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <FieldLabel>
                Start from Recent
              </FieldLabel>
            </Stack>
            <Meta sx={{ display: 'block', mb: 1.5 }}>
              Pre-fill from a previous load to save time
            </Meta>
            <Grid container spacing={1.5}>
              {DEMO_TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate?.key === tpl.key;

                return (
                  <Grid item xs={6} key={tpl.key}>
                    <Card
                      variant="outlined"
                      onClick={() => handleTemplateClick(tpl)}
                      sx={selectedCardSx(isSelected)}
                    >
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <MetaStrong sx={{ color: 'text.primary' }}>
                            {tpl.label}
                          </MetaStrong>
                          {isSelected && (
                            <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          )}
                        </Stack>
                        <Meta>
                          {tpl.description}
                          {tpl.rate ? ` \u2014 $${tpl.rate.toLocaleString()}` : ''}
                        </Meta>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Load type grid */}
        <FieldLabel sx={{ mb: 1.5, display: 'block' }}>
          {hasTemplates ? 'Or select a load type' : 'Select a load type'}
        </FieldLabel>
        <Grid container spacing={1.5}>
          {LOAD_TYPE_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.key;
            const isLastUsed = lastUsed === opt.key;

            return (
              <Grid item xs={6} sm={4} key={opt.key}>
                <Card
                  variant="outlined"
                  onClick={() => handleTypeClick(opt.key)}
                  sx={selectedCardSx(isSelected)}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <MetaStrong sx={{ color: 'text.primary' }}>
                        {opt.label}
                      </MetaStrong>
                      {isSelected && (
                        <CheckCircleIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      )}
                    </Stack>
                    <Meta>
                      {opt.description}
                    </Meta>
                    {isLastUsed && !isSelected && (
                      <Meta
                        sx={{ display: 'block', mt: 0.5, color: 'info.main', fontWeight: 500 }}
                      >
                        Last used
                      </Meta>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancel ?? onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!selectedType && !selectedTemplate}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};
