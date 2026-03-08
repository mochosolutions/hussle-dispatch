import { Button, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface LoadIntelligenceActionsProps {
  onCreateLoad: () => void;
  onAddManually: () => void;
}

export const LoadIntelligenceActions: React.FC<LoadIntelligenceActionsProps> = ({
  onCreateLoad,
  onAddManually,
}) => (
  <Stack direction="row" spacing={1}>
    <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddManually}>
      + Add Load Manually
    </Button>
    <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={onCreateLoad}>
      + Create Load
    </Button>
  </Stack>
);
