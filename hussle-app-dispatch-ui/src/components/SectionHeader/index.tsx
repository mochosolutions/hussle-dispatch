import { Button, Stack, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

interface SectionHeaderProps {
  title: string;
  onEdit?: () => void;
  editLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  onEdit,
  editLabel = 'Edit',
}) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
    <Typography
      variant="body1"
      sx={{
        color: 'text.secondary',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.6875rem',
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Typography>
    {onEdit && (
      <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEdit}>
        {editLabel}
      </Button>
    )}
  </Stack>
);
