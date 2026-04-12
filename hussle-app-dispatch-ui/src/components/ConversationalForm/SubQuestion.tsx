import { Box, Typography } from '@mui/material';

export type BorderColor = 'blue' | 'green' | 'red' | 'grey';

interface SubQuestionProps {
  borderColor: BorderColor;
  questionId: string;
  label: string;
  hint?: string;
  categoryTag?: string;
  children: React.ReactNode;
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

export const SubQuestion: React.FC<SubQuestionProps> = ({
  borderColor,
  questionId,
  label,
  hint,
  categoryTag,
  children,
}) => {
  const resolvedColor = resolveBorderColor(borderColor);

  return (
    <Box
      data-question-id={questionId}
      sx={{
        borderLeft: 4,
        borderColor: resolvedColor,
        borderRadius: '8px',
        pl: 3,
        py: 1,
        my: 2,
      }}
    >
      {categoryTag ? (
        <Typography
          variant="overline"
          sx={{ color: resolvedColor, fontWeight: 700, mb: 1, display: 'block' }}
        >
          {categoryTag}
        </Typography>
      ) : null}

      <Typography
        sx={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'text.primary',
          lineHeight: 1.3,
        }}
      >
        {label}
      </Typography>

      {hint ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {hint}
        </Typography>
      ) : null}

      <Box sx={{ mt: 2 }}>{children}</Box>
    </Box>
  );
};
