import React from 'react';
import { Button, Stack } from '@mui/material';

interface LoadWorkspaceFooterProps {
  selectedDriverId: string | null;
  isDirty: boolean;
  onDismiss: () => void;
  onSave: () => void;
  onAssign: () => void;
}

export const LoadWorkspaceFooter: React.FC<LoadWorkspaceFooterProps> = ({
  selectedDriverId,
  isDirty,
  onDismiss,
  onSave,
  onAssign,
}) => (
  <Stack direction="row" spacing={1.5}>
    <Button variant="outlined" onClick={onDismiss} sx={{ flex: 1 }}>
      Dismiss
    </Button>
    <Button variant="outlined" onClick={onSave} disabled={!isDirty} sx={{ flex: 1 }}>
      Save
    </Button>
    <Button
      variant="contained"
      onClick={onAssign}
      disabled={selectedDriverId === null}
      sx={{ flex: 1 }}
    >
      Assign
    </Button>
  </Stack>
);
