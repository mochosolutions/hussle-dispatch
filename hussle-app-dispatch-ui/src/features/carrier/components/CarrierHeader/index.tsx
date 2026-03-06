import { Button, ButtonGroup, Stack } from '@mui/material';

interface CarrierHeaderProps {
  handleOpenCreate: () => void;
}

export const CarrierHeaderActions = ({ handleOpenCreate }: CarrierHeaderProps) => {
  return (
    <Stack direction="row" spacing={1}>
      <Button variant="outlined">Export</Button>
      <Button variant="contained" onClick={handleOpenCreate}>
        Add Carrier
      </Button>
    </Stack>
  );
};
