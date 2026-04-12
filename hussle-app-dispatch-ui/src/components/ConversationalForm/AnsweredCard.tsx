import { Box, Stack, Typography } from '@mui/material';

interface AnsweredCardProps {
  questionId: string;
  label: string;
  displayValue: string;
  onEdit: () => void;
}

export const AnsweredCard: React.FC<AnsweredCardProps> = ({
  questionId,
  label,
  displayValue,
  onEdit,
}) => (
  <Box
    data-question-id={questionId}
    sx={{
      borderBottom: '1px solid',
      borderColor: 'grey.200',
      bgcolor: 'grey.50',
      borderRadius: 1,
      py: 1.5,
      px: 2,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}
  >
    <Stack>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.5 }}>
        {displayValue}
      </Typography>
    </Stack>

    <Typography
      component="span"
      onClick={onEdit}
      sx={{
        color: 'primary.main',
        fontWeight: 500,
        cursor: 'pointer',
        fontSize: '13px',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      Edit
    </Typography>
  </Box>
);
