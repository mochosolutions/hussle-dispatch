import {
  Box,
  Typography,
  Button,
  Card,
  Divider,
  Chip,
  IconButton,
  Grid,
  Stack,
  Tooltip,
  Avatar,
  Tab,
  Tabs,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

export const CarrierDetailsActions = ({
  carrierId: _carrierId,
  handleEdit,
}: {
  carrierId: string;
  handleEdit: () => void;
}) => (
  <Stack direction="row" spacing={1}>
    {/* <Button variant="contained">Dispatch Load</Button> */}
    <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>
      Edit
    </Button>
  </Stack>
);
