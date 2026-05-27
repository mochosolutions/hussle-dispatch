import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export const SectionCardActions = ({
  onEditRoute,
  children,
}: {
  onEditRoute: () => void;
  children: React.ReactNode;
}) => (
  <Button size="small" startIcon={<EditIcon fontSize="small" />} onClick={onEditRoute}>
    {children}
  </Button>
);

export default SectionCardActions;
