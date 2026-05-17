import type { ReactNode } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { ArrowForward, CheckCircleOutline, Check } from '@mui/icons-material';

import { BodyMuted, BodyStrong, Meta, PageTitle } from 'components/Typography';

import SelectionCardGrid, { type SelectionCardOption } from '../../SelectionCardGrid';

export interface SegmentationStepViewProps<TValue extends string = string> {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  question: {
    label: string;
    required?: boolean;
    options: SelectionCardOption<TValue>[];
  };
  value: TValue | null;
  onChange: (id: TValue) => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  reassuranceItems?: string[];
}

const DEFAULT_REASSURANCE = [
  'Save and resume any time',
  'We pull from FMCSA — less typing',
  'No charge to onboard',
];

export const SegmentationStepView = <TValue extends string = string>({
  eyebrow,
  title,
  subtitle,
  question,
  value,
  onChange,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled,
  reassuranceItems = DEFAULT_REASSURANCE,
}: SegmentationStepViewProps<TValue>) => {
  const disabled = continueDisabled ?? value === null;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 720,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {eyebrow ? (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'secondary.lighter',
            color: 'secondary.dark',
            px: 1.5,
            py: 0.625,
            borderRadius: 999,
            mb: 2,
          }}
        >
          <Check sx={{ fontSize: 14, color: 'secondary.main' }} />
          <Meta sx={{ color: 'secondary.dark', fontWeight: 600 }}>{eyebrow}</Meta>
        </Box>
      ) : null}

      <PageTitle
        sx={{
          fontSize: { xs: 26, sm: 30 },
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
          maxWidth: 540,
          mb: 1.25,
        }}
      >
        {title}
      </PageTitle>

      {subtitle ? (
        <BodyMuted
          sx={{
            fontSize: 15,
            maxWidth: 520,
            mb: 4.5,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </BodyMuted>
      ) : null}

      <Box sx={{ width: '100%', textAlign: 'left' }}>
        <Box sx={{ textAlign: 'center', mb: 1.75 }}>
          <BodyStrong sx={{ fontSize: 14, display: 'inline' }}>{question.label}</BodyStrong>
          {question.required ? (
            <Box component="span" sx={{ color: 'error.main', ml: 0.25, fontWeight: 500 }}>
              *
            </Box>
          ) : null}
        </Box>

        <SelectionCardGrid
          options={question.options}
          value={value}
          onChange={onChange}
          name={question.label}
        />

        <Box sx={{ mt: 4.5, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            disabled={disabled}
            onClick={onContinue}
            endIcon={<ArrowForward />}
            sx={{
              fontWeight: 600,
              fontSize: 14,
              px: 2.75,
              py: 1.375,
              borderRadius: 1,
              textTransform: 'none',
            }}
          >
            {continueLabel}
          </Button>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={2.25}
        sx={{
          mt: 3.5,
          flexWrap: 'wrap',
          justifyContent: 'center',
          rowGap: 1,
        }}
      >
        {reassuranceItems.map((text) => (
          <Box key={text} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <CheckCircleOutline sx={{ fontSize: 16, color: 'secondary.main' }} />
            <Meta sx={{ fontSize: 12.5, color: 'text.secondary' }}>{text}</Meta>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default SegmentationStepView;
