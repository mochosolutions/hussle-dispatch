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
import { useDispatch, useSelector } from 'store';
import {
  clearGenerateSettlementErrors,
} from '../../store/reducers/settlementPageSlice';
import { selectGenerateSettlementMissingHours } from '../../store/selectors/settlementSelectors';

export const MissingEstimatedHoursDialog: React.FC = () => {
  const dispatch = useDispatch();
  const missing = useSelector(selectGenerateSettlementMissingHours);

  const handleClose = () => {
    dispatch(clearGenerateSettlementErrors());
  };

  const open = Boolean(missing);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="missing-estimated-hours-title"
    >
      <DialogTitle id="missing-estimated-hours-title">Missing estimated hours</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {missing?.message ??
            'One or more loads are missing estimated hours and cannot be settled yet.'}
        </DialogContentText>
        <List dense data-testid="missing-estimated-hours-load-list">
          {(missing?.loads ?? []).map((load) => (
            <ListItem key={load.id} disableGutters>
              <RouterLink to={`/loads/${load.id}`} onClick={handleClose}>
                #{load.loadNumber}
              </RouterLink>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MissingEstimatedHoursDialog;
