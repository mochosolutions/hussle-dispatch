import { Box } from '@mui/material';

import type { BorderColor } from './SubQuestion';
import { AnsweredCard } from './AnsweredCard';

interface SubAnswerProps {
  borderColor: BorderColor;
  questionId: string;
  label: string;
  displayValue: string;
  onEdit: () => void;
}

const resolveBorderColor = (color: BorderColor): string => {
  const colorMap: Record<BorderColor, string> = {
    blue: 'info.main',
    green: 'success.main',
    red: 'error.main',
    grey: 'grey.400',
  };
  return colorMap[color];
};

const resolveBgColor = (color: BorderColor): string => {
  const bgMap: Record<BorderColor, string> = {
    blue: 'rgba(59, 130, 246, 0.05)',
    green: 'rgba(34, 197, 94, 0.05)',
    red: 'rgba(239, 68, 68, 0.05)',
    grey: 'rgba(156, 163, 175, 0.05)',
  };
  return bgMap[color];
};

export const SubAnswer: React.FC<SubAnswerProps> = ({
  borderColor,
  questionId,
  label,
  displayValue,
  onEdit,
}) => (
  <Box
    sx={{
      ml: 4,
      borderLeft: 4,
      borderColor: resolveBorderColor(borderColor),
      borderRadius: '8px',
      pl: 3,
      my: 2,
      bgcolor: resolveBgColor(borderColor),
    }}
  >
    <AnsweredCard
      questionId={questionId}
      label={label}
      displayValue={displayValue}
      onEdit={onEdit}
    />
  </Box>
);
