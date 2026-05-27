import { Box, Button, Typography } from '@mui/material';

interface QuestionCardProps {
  questionId: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
  onNext: () => void;
  isLastQuestion?: boolean;
  disabled?: boolean;
  afterInput?: React.ReactNode;
  hideButton?: boolean;
  buttonLabel?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  questionId,
  label,
  hint,
  children,
  onNext,
  isLastQuestion = false,
  disabled = false,
  afterInput,
  hideButton = false,
  buttonLabel,
}) => (
  <Box data-question-id={questionId} sx={{ py: 2 }}>
    <Typography
      sx={{
        fontSize: '20px',
        fontWeight: 600,
        color: 'text.primary',
        lineHeight: 1.3,
      }}
    >
      {label}
    </Typography>

    {hint ? (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 0 }}>
        {hint}
      </Typography>
    ) : null}

    <Box sx={{ mt: 4 }}>{children}</Box>

    {afterInput}

    {hideButton ? null : (
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          disabled={disabled}
          onClick={onNext}
          sx={{
            borderRadius: 24,
            px: 4,
            py: 1.25,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          {buttonLabel ?? (isLastQuestion ? 'Complete' : 'Continue')}
        </Button>
      </Box>
    )}
  </Box>
);
