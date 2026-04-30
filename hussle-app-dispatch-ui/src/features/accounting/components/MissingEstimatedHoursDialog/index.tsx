import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { MissingEstimatedHoursLoad } from '../../store/reducers/settlementPageSlice';

interface MissingEstimatedHoursDialogProps {
  loadIds: string[];
  loads: MissingEstimatedHoursLoad[];
  message: string;
  onClose: () => void;
}

export const MissingEstimatedHoursDialog: React.FC<MissingEstimatedHoursDialogProps> = ({
  loads,
  message,
  onClose,
}) => (
  <Dialog
    open
    onClose={onClose}
    maxWidth="sm"
    fullWidth
    aria-labelledby="missing-estimated-hours-title"
  >
    <DialogTitle id="missing-estimated-hours-title">Missing estimated hours</DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ mb: 2 }}>
        {message ??
          'One or more loads are missing estimated hours and cannot be settled yet.'}
      </DialogContentText>
      <List dense data-testid="missing-estimated-hours-load-list">
        {loads.map((load) => (
          <ListItem key={load.id} disableGutters>
            <RouterLink to={`/loads/${load.id}`} onClick={onClose}>
              #{load.loadNumber}
            </RouterLink>
          </ListItem>
        ))}
      </List>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

export default MissingEstimatedHoursDialog;
